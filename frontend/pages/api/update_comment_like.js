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
        const bodyData = JSON.parse(body)
        const pgClient = await getPgClient()

        var { rows } = (bodyData.like===1) ? await pgClient.query(
            `insert into comment_like (
                comment_uuid,
                user_uuid
            ) values (
                $2,
                $1
            ) returning *`,
            [session.user_uuid, bodyData.comment_uuid]
        ) : await pgClient.query(
            `delete from comment_like
            where comment_uuid=$2 and user_uuid=$1
            returning *`,
            [session.user_uuid, bodyData.comment_uuid]
        )
        if(rows.length>0) {
            res.status(200).send()
        } else {
            res.status(400).send('UNABLE_TO_PROCEED')
        }
    } catch (e) {
        console.log(e.message)
        res.status(500).send('REQUEST_ERROR')
    }
}