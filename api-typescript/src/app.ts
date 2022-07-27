import express, {Request, Response} from "express";
import dotenv from 'dotenv';
import {RedisClientType, createClient} from 'redis';
import {getClient as getRedisClient} from './redis'
dotenv.config()

const app = express();
app.use(express.text())
const port = 3001;

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

    try {
        const data = await client.get(`${session.user_uuid}.${session.session_uuid}`)
        if(data===null) {
            res.status(400).send('SIGNED_OUT')
        } else if(data!==session.session_data) {
            res.status(400).send('BAD_CREDENTIALS')
        } else {
            res.status(200).send('OK')
        }
    } catch(e) {
        console.log(e)
        res.status(500).send('AUTH_SERVICE')
        return
    }
})

app.listen(port, async (): Promise<void> => {
    const client = getRedisClient()
    console.log(`Server is listening on ${port}`)
    await client.connect()
})