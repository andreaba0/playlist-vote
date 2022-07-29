import express, { Request, Response, NextFunction, json } from "express";
import dotenv from 'dotenv';
import { getClient as getRedisClient } from './redis'
import { getClient as getPgClient, query as pgQuery } from './postgresql'
import cookieParser from 'cookie-parser'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
dotenv.config()

const app = express();
app.use(express.text())
app.use(cookieParser())
const port = 3001;

async function userSignedIn(user_uuid, session_uuid, session_data): Promise<number> {
    const client = getRedisClient()
    try {
        const data = await client.get(`${user_uuid}.${session_uuid}`)
        if (data === null) {
            return 400
        } else if (data !== session_data) {
            return 401
        } else {
            return 200
        }
    } catch (e) {
        console.log(e)
        return 500
    }
}

async function authMiddlewareBackend(req: any, res: Response, next: NextFunction) {
    const client = getRedisClient()
    const body = req.body || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }
    const bodyData = JSON.parse(body)
    const sessionParts = bodyData?.session.split('.')
    const session = {
        user_uuid: sessionParts[0] || null,
        session_uuid: sessionParts[1] || null,
        session_data: sessionParts[2] || null
    }

    const authStatus = await userSignedIn(session.user_uuid, session.session_uuid, session.session_data)

    if (authStatus === 400) {
        res.status(400).send('SIGNED_OUT')
        return
    }
    if (authStatus === 401) {
        res.status(400).send('BAD_CREDENTIALS')
        return
    }
    if (authStatus === 500) {
        res.status(500).send('AUTH_SERVICE')
        return
    }

    req._user = {}
    req._user.user_uuid = session.user_uuid
    req._user.session_uuid = session.session_uuid
    req._user.session_data = session.session_data
    next()
}

async function authMiddlewareClient(req: any, res: Response, next: NextFunction) {
    const client = getRedisClient()
    const body = req.cookies['session'] || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }
    const sessionParts = body.split('.')
    const session = {
        user_uuid: sessionParts[0] || null,
        session_uuid: sessionParts[1] || null,
        session_data: sessionParts[2] || null
    }

    const authStatus = await userSignedIn(session.user_uuid, session.session_uuid, session.session_data)

    if (authStatus === 400) {
        res.status(400).send('SIGNED_OUT')
        return
    }
    if (authStatus === 401) {
        res.status(400).send('BAD_CREDENTIALS')
        return
    }
    if (authStatus === 500) {
        res.status(500).send('AUTH_SERVICE')
        return
    }

    req._user = {}
    req._user.user_uuid = session.user_uuid
    req._user.session_uuid = session.session_uuid
    req._user.session_data = session.session_data
    next()
}

app.get('/api-service', (req, res: Response): void => {
    res.send('Hello World');
})

app.post('/api/auth/status', authMiddlewareBackend, async (req: any, res: Response): Promise<void> => {
    res.status(200).send('OK')
})

app.post('/api/backend/playlist/list', authMiddlewareBackend, async (req: any, res: Response): Promise<void> => {

    var [err, rows] = await pgQuery(
        `select s.name, s.author, (
            select _user.username
            from _user
            where _user.uuid=s.user_uuid
        )as created_by, (
            select count(vote.vote)
            from vote
            where vote.vote='up' and vote.song_id=s.id
        ) as up, (
            select count(vote.vote)
            from vote
            where vote.vote='down' and vote.song_id=s.id
        ) as down, (
            select vote.vote
            from vote
            where vote.song_id=s.id and vote.user_uuid=$1
        ) as your_vote, (
            select 1
            from song as so
            where so.id=s.id and user_uuid=$1
        ) as is_your, (
            select count(username)
            from _user
        ) as total_voters
        from song as s
        order by s.name asc`,
        [req._user.user_uuid]
    )

    if (err) {
        res.status(500).send('STORAGE_SERVICE')
        return
    }

    res.status(200).send(JSON.stringify(rows))
})

app.post('/api/client/playlist/list', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {

    var [err, rows] = await pgQuery(
        `select s.name, s.author, (
            select _user.username
            from _user
            where _user.uuid=s.user_uuid
        )as created_by, (
            select count(vote.vote)
            from vote
            where vote.vote='up' and vote.song_id=s.id
        ) as up, (
            select count(vote.vote)
            from vote
            where vote.vote='down' and vote.song_id=s.id
        ) as down, (
            select vote.vote
            from vote
            where vote.song_id=s.id and vote.user_uuid=$1
        ) as your_vote, (
            select 1
            from song as so
            where so.id=s.id and user_uuid=$1
        ) as is_your, (
            select count(username)
            from _user
        ) as total_voters
        from song as s
        order by s.name asc`,
        [req._user.user_uuid]
    )

    if (err) {
        res.status(500).send('STORAGE_SERVICE')
        return
    }

    res.status(200).send(JSON.stringify(rows))
})

app.post('/api/client/comment/list', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    const body = req.body || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }
    const bodyData = JSON.parse(body)
    const songName = bodyData.song
    const songAuthor = bodyData.author
    if (songName === null || songAuthor === null) {
        res.status(400).send('INCOMPLETE_DATA')
        return
    }

    var [err, rows] = await pgQuery(
        `select
            (
                select 1
                from comment as com
                where com.user_uuid=$3 and com.uuid=c.uuid
            ) as is_you,
            c.uuid as comment_uuid,
            extract(epoch from (now() - c.created_at)) as created_at,
            c.user_uuid as uuid_author,
            (
                select u.username
                from _user as u
                where u.uuid=c.user_uuid
            ) as author,
            c.message as comment,
            c.reply_to as reply_to_id, 
            (
                select _user.username
                from _user inner join comment on _user.uuid=comment.user_uuid
                where c.reply_to=comment.uuid and _user.uuid=comment.user_uuid
            ) as reply_to_author,
            (
                select comment.message
                from comment
                where comment.uuid=c.reply_to
            ) as replied_message, (
                select count(user_uuid)
                from comment_like
                where comment_like.comment_uuid = c.uuid
            ) as comment_like, (
                select 1
                from comment_like
                where comment_like.user_uuid=$3 and comment_like.comment_uuid=c.uuid
            ) as you_like
            from comment as c
            where c.song_id=(
                select id
                from song
                where song.name=$1 and song.author=$2
            )
            order by created_at desc`,
        [songName, songAuthor, req._user.user_uuid]
    )

    if (err) {
        res.status(500).send('STORAGE_ERROR')
    } else {
        res.status(200).send(JSON.stringify(rows))
    }
})

app.post('/api/backend/comment/list', authMiddlewareBackend, async (req: any, res: Response): Promise<void> => {
    const body = req.body || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }
    const bodyData = JSON.parse(body)
    const songName = bodyData.song
    const songAuthor = bodyData.author
    if (songName === null || songAuthor === null) {
        res.status(400).send('INCOMPLETE_DATA')
        return
    }

    var [err, rows] = await pgQuery(
        `select
            (
                select 1
                from comment as com
                where com.user_uuid=$3 and com.uuid=c.uuid
            ) as is_you,
            c.uuid as comment_uuid,
            extract(epoch from (now() - c.created_at)) as created_at,
            c.user_uuid as uuid_author,
            (
                select u.username
                from _user as u
                where u.uuid=c.user_uuid
            ) as author,
            c.message as comment,
            c.reply_to as reply_to_id, 
            (
                select _user.username
                from _user inner join comment on _user.uuid=comment.user_uuid
                where c.reply_to=comment.uuid and _user.uuid=comment.user_uuid
            ) as reply_to_author,
            (
                select comment.message
                from comment
                where comment.uuid=c.reply_to
            ) as replied_message, (
                select count(user_uuid)
                from comment_like
                where comment_like.comment_uuid = c.uuid
            ) as comment_like, (
                select 1
                from comment_like
                where comment_like.user_uuid=$3 and comment_like.comment_uuid=c.uuid
            ) as you_like
            from comment as c
            where c.song_id=(
                select id
                from song
                where song.name=$1 and song.author=$2
            )
            order by created_at desc`,
        [songName, songAuthor, req._user.user_uuid]
    )

    if (err) {
        res.status(500).send('STORAGE_ERROR')
    } else {
        res.status(200).send(JSON.stringify(rows))
    }
})

app.post('/api/client/comment/add', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    const body = req.body || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }

    try {
        const commentData = JSON.parse(body)

        var [err, rows] = (commentData.reply_to === null) ? await pgQuery(
            `insert into comment (
                uuid,
                song_id,
                user_uuid,
                message
            ) values (
                $1,
                (
                    select id
                    from song
                    where name=$2 and author=$3
                ),
                $4,
                $5
            ) returning *`,
            [uuidv4(), commentData.song, commentData.author, req._user.user_uuid, commentData.message]
        ) : await pgQuery(
            `insert into comment (
                uuid,
                song_id,
                user_uuid,
                message,
                reply_to
            ) values (
                $1,
                (
                    select id
                    from song
                    where name=$2 and author=$3
                ),
                $4,
                $5,
                $6
            ) returning *`,
            [uuidv4(), commentData.song, commentData.author, req._user.user_uuid, commentData.message, commentData.reply_to]
        )
        if (err) {
            res.status(500).send('STORAGE_ERROR')
            return
        }

        if (rows.length > 0) {
            res.status(200).send()
        } else {
            res.status(400).send('UNABLE_TO_ADD_COMMENT')
        }
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

app.post('/api/client/comment/like', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    try {
        const body = req.body || null
        if (body === null) {
            res.status(400).send('BODY_REQUIRED')
            return
        }
        const bodyData = JSON.parse(body)

        var [err, rows] = (bodyData.like === 1) ? await pgQuery(
            `insert into comment_like (
                comment_uuid,
                user_uuid
            ) values (
                $2,
                $1
            ) returning *`,
            [req._user.user_uuid, bodyData.comment_uuid]
        ) : await pgQuery(
            `delete from comment_like
            where comment_uuid=$2 and user_uuid=$1
            returning *`,
            [req._user.user_uuid, bodyData.comment_uuid]
        )
        if (err) {
            res.status(500).send('STORAGE_ERROR')
            return
        }
        if (rows.length > 0) {
            res.status(200).send()
        } else {
            res.status(400).send('UNABLE_TO_PROCEED')
        }
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

app.post('/api/backend/comment', async (req: Request, res: Response): Promise<void> => {
    const body = req.body || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }
    const bodyData = JSON.parse(body)
    const replyTo = bodyData.reply_to
    if (replyTo === null) {
        res.status(400).send('REPLY_TO_REQUIRED')
        return
    }
    var [err, rows] = await pgQuery(
        `select (
            select username
            from comment as c2 inner join _user on _user.uuid=c2.user_uuid
            where c2.uuid=c1.uuid
        ) as reply_to_author, (
            select message
            from comment as c2
            where c2.uuid=c1.uuid
        ) as reply_to_comment
        from comment as c1
        where c1.uuid=$1`,
        [replyTo]
    )
    if (err) {
        res.status(500).send('STORAGE_ERROR')
    } else {
        res.status(200).send(JSON.stringify(rows))
    }
})

app.post('/api/client/song/add', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    try {
        const body = req.body || null
        if (body === null) {
            res.status(400).send('BODY_REQUIRED')
            return
        }
        const songData = JSON.parse(body)
        var [err, rows] = await pgQuery(
            `insert into song (
                name,
                author,
                user_uuid
            ) values (
                $1,
                $2,
                $3
            ) returning *`,
            [songData.song, songData.author, req._user.user_uuid]
        )
        if (err) {
            res.status(500).send('STORAGE_ERROR')
            return
        }
        if (rows.length > 0) {
            res.status(200).send()
        } else {
            res.status(400).send('ALREADY_EXISTS')
        }
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

app.post('/api/client/song/delete', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    try {
        const body = req.body || null
        if (body === null) {
            res.status(400).send('BODY_REQUIRED')
            return
        }
        const songData = JSON.parse(body)

        var [err, rows] = await pgQuery(
            `delete from song
            where name=$1 and author=$2 and user_uuid=$3 returning *`,
            [songData.song, songData.author, req._user.user_uuid]
        )
        if (err) {
            res.status(500).send('STORAGE_ERROR')
            return
        }
        if (rows.length > 0) {
            res.status(200).send()
        } else {
            res.status(400).send('NOT_FOUND')
        }
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

app.post('/api/client/song/vote', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    try {
        const body = req.body || null
        if (body === null) {
            res.status(400).send('BODY_REQUIRED')
            return
        }
        const songData = JSON.parse(body)

        var [err, rows] = await pgQuery(
            `insert into vote (
                song_id,
                user_uuid,
                vote
            ) values (
                (
                    select id
                    from song
                    where name=$1 and author=$2
                ),
                $3,
                $4
            ) on conflict (song_id, user_uuid) do update set vote=$4 returning *`,
            [songData.song, songData.author, req._user.user_uuid, songData.vote]
        )
        if (err) {
            res.status(500).send('STORAGE_ERROR')
            return
        }
        res.status(200).send()
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

app.post('/api/client/session/renew', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    const session = req._user
    try {
        const client = getRedisClient()
        const newCode = uuidv4()
        await client.set(`${session.user_uuid}.${session.session_uuid}`, newCode, {
            EX: 60 * 10
        })
        res.setHeader('set-cookie', `session=${session.user_uuid}.${session.session_uuid}.${newCode};path=/;same-site=strict;httpOnly;max-age=${60 * 10}`)
        res.status(200).send()
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

function hashPassword(password, salt) {
    return crypto.createHash('sha256').update(`${password}:${salt}`).digest('hex')
}

app.post('/api/client/signin', async (req: Request, res: Response): Promise<void> => {
    const redisClient = await getRedisClient()
    const body = req.body || null
    if (body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }


    try {
        const userData = JSON.parse(body)
        const [err, rows] = await pgQuery(
            `select uuid, password, salt
            from _user
            where username=$1`,
            [userData.username]
        )
        if (err) {
            res.status(500).send('STORAGE_ERROR')
            return
        }
        if (rows.lengh === 0) res.status(400).send('USER_NOT_FOUND')
        else if (rows[0].password !== hashPassword(userData.password, rows[0].salt)) res.status(400).send('WRONG_PASSWORD')
        else {
            const user_uuid = rows[0].uuid
            const session_uuid = uuidv4()
            const session_data = uuidv4()
            var r = await redisClient.set(`${user_uuid}.${session_uuid}`, session_data, {
                EX: 60 * 10
            })
            if (r === 'OK') {
                res.setHeader('set-cookie', `session=${user_uuid}.${session_uuid}.${session_data};path=/;same-site=strict;httpOnly;max-age=${60 * 10}`)
                res.status(200).send()
            } else {
                res.setHeader('set-cookie', `session=;path=/;same-site=strict;httpOnly`)
                res.status(500).send('SESSION_ERROR')
            }
        }
    } catch (e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
})

app.post('/api/client/signout', authMiddlewareClient, async (req: any, res: Response): Promise<void> => {
    const redisClient = await getRedisClient()
    try {
        const redisUserSession = await redisClient.getDel(`${req._user.user_uuid}.${req._user.session_uuid}`)
        res.setHeader('set-cookie', `session=;path=/;same-site=strict;httpOnly`)
        res.status(200).send()
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
})

app.listen(port, async (): Promise<void> => {
    const client = getRedisClient()
    console.log(`Server is listening on ${port}`)
    await client.connect()
})