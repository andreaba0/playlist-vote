export async function getServerSideProps(context) {
    console.log(context.req.headers)
    const cookiesHeader = context.req.headers.cookie || ''
    const cookiesParts = cookiesHeader.split('; ')
    const cookies = {}
    for(var i=0;i<cookiesParts.length;i++) {
        var temp = cookiesParts[i].split('=')
        cookies[temp[0]]=temp[1]
    }
    console.log(JSON.stringify(cookies))
    const userAccessCookie = cookies['session_id'] || null
    if(userAccessCookie===null) return {
        redirect: {
            permanent: false,
            destination: '/signin?redirect=playlist'
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