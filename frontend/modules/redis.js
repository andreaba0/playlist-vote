import { createClient } from "redis"

export async function getClient() {
    const client = createClient({
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }
    })
    await client.connect()
    return client
}