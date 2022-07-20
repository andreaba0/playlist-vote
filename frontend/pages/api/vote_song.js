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
        if (body === null) {
            res.status(400).send('BODY_MALFORMED')
            return
        }
        const songData = JSON.parse(body)
        const pgClient = await getPgClient()

        var { rows } = await pgClient.query(
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
            [songData.song, songData.author, session.user_uuid, songData.vote]
        )
        await pgClient.end()
        res.status(200).send()
    } catch (e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
}