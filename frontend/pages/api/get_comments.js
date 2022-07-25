import { getClient as getRedisClient } from '../../modules/redis'
import { v4 as uuidv4 } from 'uuid'
import { parseCookie, parseUserSession } from '../../modules/supply'
import { getClient as getPgClient } from '../../modules/pg'

export default async function getComments(req, res) {
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
            `select
                (
                    select 1
                    from comment as com
                    where com.user_uuid=$3 and com.uuid=c.uuid
                ) as is_you,
                c.uuid as comment_uuid,
                c.user_uuid as uuid_author,
                (
                    select u.username
                    from _user as u
                    where u.uuid=c.user_uuid
                ) as author,
                c.created_at as created_at,
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
                order by created_at asc`,
            [songData.song, songData.author, session.user_uuid]
        )
        res.status(200).send(rows)
    } catch (e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
}