import { getClient as getRedisClient } from '../../modules/redis'
import { v4 as uuidv4 } from 'uuid'
import { parseCookie, parseUserSession } from '../../modules/supply'

export default async function signout(req, res) {
    const cookies = parseCookie(req.headers.cookie)
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) {
        res.status(200).send('USER_SIGNED_OUT')
        return
    }
    const session = parseUserSession(userAccessCookie)
    const redisClient = await getRedisClient()
    try {
        const redisUserSession = await redisClient.getDel(`${session.user_uuid}.${session.session_uuid}`)
        res.setHeader('set-cookie', `session=;path=/;same-site=strict;httpOnly`)
        res.status(200).send()
    } catch (e) {
        console.log(e.message)
        res.status(500).send('SERVER_ERROR')
    }
}