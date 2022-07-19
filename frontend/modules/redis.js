import { createClient } from "redis"

const client = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})

export function getClient() {
    return client
}