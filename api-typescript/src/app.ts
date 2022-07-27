import express, { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';
import { getClient as getRedisClient } from './redis'
import { getClient as getPgClient, query as pgQuery } from './postgresql'
import cookieParser from 'cookie-parser'
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

async function authMiddleware(req: Request, res: Response, next: NextFunction) {

}

app.get('/api-service', (req: Request, res: Response): void => {
    res.send('Hello World');
})

app.post('/api/auth/status', async (req: Request, res: Response): Promise<void> => {
    const client = getRedisClient()
    const body = req.body || null
    console.log(req.body)
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

    res.status(200).send('OK')
})

app.post('/api/backend/playlist/list', async (req: Request, res: Response): Promise<void> => {
    const body = req.body || null
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
        [session.user_uuid]
    )

    if (err) {
        res.status(500).send('STORAGE_SERVICE')
        return
    }

    res.status(200).send(JSON.stringify(rows))
})

app.post('/api/client/playlist/list', async (req: Request, res: Response): Promise<void> => {
    const body = req.cookies['session'] || null
    if (body === null) {
        res.status(400).send('CREDENTIALS_REQUIRED')
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
        [session.user_uuid]
    )

    if (err) {
        res.status(500).send('STORAGE_SERVICE')
        return
    }

    res.status(200).send(JSON.stringify(rows))
})

app.listen(port, async (): Promise<void> => {
    const client = getRedisClient()
    console.log(`Server is listening on ${port}`)
    await client.connect()
})