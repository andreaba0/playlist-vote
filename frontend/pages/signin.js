import { useState } from "react"
import { createClient } from "redis"

export async function getServerSideProps(context) {
    console.log(context.req.headers)
    const cookiesHeader = context.req.headers.cookie || ''
    const cookiesParts = cookiesHeader.split('; ')
    const cookies = {}
    for (var i = 0; i < cookiesParts.length; i++) {
        var temp = cookiesParts[i].split('=')
        cookies[temp[0]] = temp[1]
    }
    console.log(JSON.stringify(cookies))
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) return {
        props: {}
    }
    const userId = userAccessCookie.split('.')[0]
    const sessionId = userAccessCookie.split('.')[1]
    const sessionCode = userAccessCookie.split('.')[2]

    const client = createClient({
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }
    })
    await client.connect()
    const redisUserSession = await client.get(`session-${userId}`)
    if(redisUserSession===null) return {
        props: {}
    }

    return {
        redirect: {
            permanent: false,
            destination: '/index'
        }
    }
}

export default function SigninPage(props) {

    var [username, setUsername] = useState('')
    var [password, setPassword] = useState('')

    function submitForm(e) {
        e.preventDefault()
        console.log(username, password)
        fetch('/api/signin', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(data => data.text())
        .then(data => {
            console.log(data)
        })
        .catch(e => console.log(e.message))
    }

    function iSetUsername(e) {
        setUsername(e.target.value)
    }

    function iSetPassword(e) {
        setPassword(e.target.value)
    }

    return (
        <div className="w-screen flex flex-col items-center">
            <div className="w-full max-w-lg bg-white flex flex-col items-center mt-5 py-3">
                <div>
                    Accedi
                </div>
                <div className="mt-3">
                    <form onSubmit={submitForm} className="flex w-full flex-col items-center space-y-6">
                        <input type="text" onChange={iSetUsername} placeholder="username" className="border-b-2 border-black" />
                        <input type="password" onChange={iSetPassword} placeholder="password" className="border-b-2 border-black" />
                        <button type="submit">
                            Accedi
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}