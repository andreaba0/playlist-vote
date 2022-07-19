import { getClient as getRedisClient } from '../../modules/redis'
import { v4 as uuidv4 } from 'uuid'
import { parseCookie, parseUserSession } from '../../modules/supply'

export default async function renew(req, res) {
    const cookies = parseCookie(req.headers.cookie)
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) {
        res.status(400).send('USER_SIGNED_OUT')
        return
    }
    const session = parseUserSession(userAccessCookie)
    const redisClient = getRedisClient()
    try {
        await redisClient.connect()
    } catch (e) { }


    try {
        const redisUserSession = await redisClient.get(`${session.user_uuid}.${session.session_uuid}`)
        if (redisUserSession === null) {
            res.setHeader('set-cookie', 'session=;path=/;httpOnly')
            res.status(400).send('SIGNED_OUT')
            return
        }
        const newCode = uuidv4()
        await redisClient.set(`${session.user_uuid}.${session.session_uuid}`, newCode, {
            EX: 60 * 10
        })
        res.setHeader('set-cookie', `session=${session.user_uuid}.${session.session_uuid}.${newCode};path=/;same-site=strict;httpOnly;max-age=${60 * 10}`)
        res.status(200).send()
    } catch (e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
}