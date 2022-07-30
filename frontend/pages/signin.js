import { useRouter } from "next/router"
import { useState } from "react"
import { parseCookie, parseUserSession } from "../modules/supply"

export async function getServerSideProps(context) {
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) return {
        props: {}
    }
    const session = parseUserSession(userAccessCookie)

    const res = await fetch(`${process.env.DOMAIN}/api/auth/status`, {
        method: 'POST',
        body: JSON.stringify({ session: userAccessCookie })
    })
    if (res.status !== 200) {
        context.res.setHeader('set-cookie', 'session=;path=/;httpOnly')
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
    var [error, setError] = useState(null)

    function submitForm(e) {
        e.preventDefault()
        if (username === '' || password === '') {
            setError('EMPTY')
            return
        }
        fetch('/api/client/signin', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
            .then(res => {
                return res.text()
            })
            .then(data => {
                if (data === 'OK') {
                    router.push(`/${router.query['redirect'] || ''}`)
                } else {
                    setError(data)
                }
            })
            .catch(e => {
                console.log(e.message)
                setError(e.message)
            })
    }

    function iSetUsername(e) {
        setError(null)
        setUsername(e.target.value)
    }

    function iSetPassword(e) {
        setError(null)
        setPassword(e.target.value)
    }

    function renderErrorMessage() {
        switch (error) {
            case 'CREDENTIALS':
                return 'Username o password errato/i'
            case 'EMPTY':
                return 'Username e password richiesti'
            case 'STORAGE_ERROR':
            case 'SESSION_ERROR':
            case'SERVER_ERROR':
                return 'Errore del server'
            default:
                return 'Errore sconosciuto'
        }
    }

    function renderError() {
        if (error === null) return (null)
        return (
            <div className="w-full bg-red-500 text-white p-4 font-medium text-sm">
                {renderErrorMessage()}
            </div>
        )
    }

    return (
        <div className="w-screen flex flex-col items-center">
            <div className="w-full max-w-lg bg-white flex flex-col items-center py-3 space-y-8">
                <div className="font-medium text-2xl text-gray-700">
                    Accedi
                </div>
                <div className="py-3">
                    <form onSubmit={submitForm} className="flex w-full flex-col items-center space-y-6">
                        <input type="text" onChange={iSetUsername} placeholder="username" className="border-b-2 border-black" />
                        <input type="password" onChange={iSetPassword} placeholder="password" className="border-b-2 border-black" />
                        <button type="submit" className="font-bold text-sm text-white bg-blue-600 rounded px-12 py-3">
                            Accedi
                        </button>
                    </form>
                </div>
                {renderError()}
            </div>
        </div>
    )
}