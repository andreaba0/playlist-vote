import { getClient as getRedisClient } from '../../modules/redis'
import { v4 as uuidv4 } from 'uuid'
import { parseCookie, parseUserSession } from '../../modules/supply'
import { getClient as getPgClient } from '../../modules/pg'

export default async function songList(req, res) {
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
        const pgClient = await getPgClient()

        var { rows } = await pgClient.query(
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
        from song as s`,
            [session.user_uuid]
        )
        res.status(200).send(JSON.stringify(rows))
    } catch (e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
}