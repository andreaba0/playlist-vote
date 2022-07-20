import { Client } from "pg"
import env from 'dotenv'
env.config()
console.log(process.env.PG_USER)

var isConnected = 0
var client
var mex = "Hello"
var int = 0

export async function getClient() {
    console.log(mex, int++, isConnected)
    if (isConnected === 1) return client
    client = new Client({
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: process.env.PG_DATABASE,
        idle_in_transaction_session_timeout: 10000
    })
    return new Promise((resolve, reject) => {
        client.connect((err) => {
            if (err) {
                resolve(null)
                return
            }
            client.on('error', () => {
                console.log('error')
                isConnected = 0
            })
            client.on('end', () => {
                console.log('end')
                isConnected = 0
            })
            isConnected = 1
            resolve(client)
        })
    })
}