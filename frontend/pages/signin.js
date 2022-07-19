import { useRouter } from "next/router"
import { useState } from "react"
import { getClient } from "../modules/redis"
import { parseCookie, parseUserSession } from "../modules/supply"

export async function getServerSideProps(context) {
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) return {
        props: {}
    }
    const session = parseUserSession(userAccessCookie)

    const client = await getClient()
    const redisUserSession = await client.get(`${session.user_uuid}.${session.session_uuid}`)
    if (redisUserSession === null) {
        context.res.setHeaders('set-cookie', 'session=;path=/;httpOnly')
        return {
            props: {}
        }
    }

    return {
        redirect: {
            permanent: false,
            destination: `/${context.query['redirect'] || ''}`
        }
    }
}

export default function SigninPage(props) {

    const router = useRouter()

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
                router.push(`/${router.query['redirect'] || ''}`)
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