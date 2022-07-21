import { getClient as getRedisClient } from '../../modules/redis'
import { v4 as uuidv4 } from 'uuid'
import { parseCookie, parseUserSession } from '../../modules/supply'
import { getClient as getPgClient } from '../../modules/pg'

export default async function addSong(req, res) {
    const cookies = parseCookie(req.headers.cookie)
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) {
        res.status(400).send('USER_SIGNED_OUT')
        return
    }
    const session = parseUserSession(userAccessCookie)
    const redisClient = await getRedisClient()


    try {
        const redisUserSession = await redisClient.get(`${session.user_uuid}.${session.session_uuid}`)
        if (redisUserSession === null) {
            res.setHeader('set-cookie', 'session=;path=/;httpOnly')
            res.status(400).send('SIGNED_OUT')
            return
        }
        const body = req.body || null
        if(body===null) {
            res.status(400).send('BODY_MALFORMED')
            return
        }
        const commentData = JSON.parse(body)
        const pgClient = await getPgClient()
        console.log(commentData)

        var { rows } = (commentData.reply_to===null) ? await pgClient.query(
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
            [uuidv4(), commentData.song, commentData.author, session.user_uuid, commentData.message]
        ) : await pgClient.query(
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
            [uuidv4(), commentData.song, commentData.author, session.user_uuid, commentData.message, commentData.reply_to]
        )
        if(rows.length>0) {
            res.status(200).send()
        } else {
            res.status(400).send('UNABLE_TO_ADD_COMMENT')
        }
    } catch (e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
}