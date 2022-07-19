import { getClient } from "../modules/redis"
import { parseCookie, parseUserSession } from "../modules/supply"
import '../modules/client/renew'

export async function getServerSideProps(context) {
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    if(userAccessCookie===null) return {
        redirect: {
            permanent: false,
            destination: '/signin?redirect=playlist'
        }
    }
    const session = parseUserSession(userAccessCookie)

    const client = getClient()
    try {
        await client.connect()
    } catch (e) { }
    const redisUserSession = await client.get(`${session.user_uuid}.${session.session_uuid}`)
    if (redisUserSession === null) {
        context.res.setHeaders('set-cookie', 'session=;path=/;httpOnly')
        return {
            redirect: {
                permanent: false,
                destination: '/signin?redirect=index'
            }
        }
    }

    return {
        props: {}
    }
}

export default function Home(props) {
    return (
        <div>
            Hello World
        </div>
    )
}