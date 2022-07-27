import {createClient, RedisClientType} from 'redis'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        reconnectStrategy: (retries) => 1000,
        keepAlive: 4000
    },
    disableOfflineQueue: true
})

client.on('error', (e): void => {
    console.log(e.message)
})

client.on('ready', (): void => {
    console.log('ready to accept connection')
})

client.on('reconnecting', (): void => {
    console.log('Reconnecting')
})

client.on('connect', (): void => {
    console.log('connected')
})

export function getClient() {
    return client
}