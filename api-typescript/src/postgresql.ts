import { Pool } from "pg";
import dotenv from 'dotenv'
dotenv.config()

const pool = new Pool({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
})

pool.on('error', (err, client) => {
    console.log(err.message)
})

export async function query(text, params): Promise<any> {
    return new Promise((resolve, reject) => {
        pool.query(text, params, (err, res) => {
            if (err) resolve([err, null])
            else resolve([null, res.rows])
        })
    })
}

export function getClient() {
    return pool;
}