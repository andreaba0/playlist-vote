import { getClient } from '../../modules/pg'
import { getClient as getRedisClient } from '../../modules/redis'
import {v4 as uuidv4} from 'uuid'

export default async function signin(req, res) {
    const client = await getClient()
    const redisClient = await getRedisClient()
    const body = req.body || null
    if(body === null) {
        res.status(400).send('BODY_REQUIRED')
        return
    }


    try {
        const userData = JSON.parse(body)
        const {rows} = await client.query(
            `select uuid, password
            from _user
            where username=$1`, [
                userData.username
            ]
        )
        await client.end()
        console.log(rows)
        if(rows.lengh===0) res.status(400).send('USER_NOT_FOUND')
        else if(rows[0].password!==userData.password) res.status(400).send('WRONG_PASSWORD')
        else {
            const user_uuid=rows[0].uuid
            const session_uuid = uuidv4()
            const session_data = uuidv4()
            await redisClient.set(`${user_uuid}.${session_uuid}`, session_data, {
                EX: 60*10
            })
            res.setHeader('set-cookie', `session=${user_uuid}.${session_uuid}.${session_data};path=/;same-site=strict;httpOnly;max-age=${60*10}`)
            res.status(200).send()
        }
    } catch(e) {
        console.log(e.message)
        res.status(400).send('BODY_MALFORMED')
    }
}