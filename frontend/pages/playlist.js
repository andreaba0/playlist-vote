import { getClient } from "../modules/redis"
import { getClient as getPgClient } from "../modules/pg"
import { parseCookie, parseUserSession } from "../modules/supply"
import '../modules/client/renew'
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"

export async function getServerSideProps(context) {
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) return {
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

    const pgClient = getPgClient()
    try {
        await pgClient.connect()
    } catch (e) {
        console.log(e.code)
    }

    var { rows } = await pgClient.query(
        `select s.name, s.author, (
            select _user.username
            from _user
            where _user.uuid=s.user_uuid
        )as created_by, (
            select count(vote.vote)
            from vote
            where vote.vote='up' and vote.song_id=s.id
        ) as up, (
            select count(vote.vote)
            from vote
            where vote.vote='down' and vote.song_id=s.id
        ) as down, (
            select vote.vote
            from vote
            where vote.song_id=s.id and vote.user_uuid=$1
        ) as your_vote, (
            select 1
            from song as so
            where so.id=s.id and user_uuid=$1
        ) as is_your, (
            select count(username)
            from _user
        ) as total_voters
        from song as s`,
        [session.user_uuid]
    )

    return {
        props: {
            data: rows
        }
    }
}

function SongRow(props) {
    return (
        <div className="w-full flex flex-row">
            <div className="w-3/4">
                {props.name}
            </div>
            {(props.is_your) ? (
                <div className="flex-grow">
                    delete
                </div>
            ) : (null)}
        </div>
    )
}

export default function Home(props) {
    var [page, setPage] = useState('main')
    var [data, setData] = useState(props.data)
    console.log(data)

    function renderSongList() {
        if (page === 'main') {
            const elem = []
            data.map((obj) => {
                elem.push(
                    <SongRow
                        name={obj.name}
                        author={obj.author}
                        created_by={obj.created_by}
                        up_vote={parseInt(obj.up)}
                        down_vote={parseInt(obj.down)}
                        your_vote={obj.your_vote}
                        is_your={obj.is_your}
                        key={uuidv4()}
                    />
                )
            })
            return elem
        }
    }
    return (
        <div className="w-screen overflow-x-hidden flex flex-col items-center">
            <div className="w-full max-w-xl flex flex-col items-center bg-white">
                <div>
                    Playlist
                </div>
                <div className="w-full flex flex-col items-center">
                    {renderSongList()}
                </div>
            </div>
        </div>
    )
}