import { Client } from "pg"
import env from 'dotenv'
env.config()
console.log(process.env.PG_USER)

export async function getClient() {
    const client = new Client({
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: process.env.PG_DATABASE
    })
    await client.connect()
    return client
}