import { getClient } from "../modules/redis"
import { getClient as getPgClient } from "../modules/pg"
import { parseCookie, parseUserSession } from "../modules/supply"
import '../modules/client/renew'
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown } from 'react-icons/md'

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

    const client = await getClient()
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

    const pgClient = await getPgClient()

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

    function renderVote() {
        if (props.up_vote + props.down_vote < props.total_voters) return (
            <div className="flex-grow flex flex-col items-start justify-center py-1 text-blue-500 font-bold text-sm border-r-2 border-gray-700">
                In attesa del quorum [{props.up_vote + props.down_vote}/{props.total_voters}]
            </div>
        )
        if (props.up_vote > props.down_vote) return (
            <div className="flex-grow flex flex-col items-start justify-center py-1 text-green-500 font-bold text-sm border-r-2 border-gray-700">
                Canzone approvata
            </div>
        )

        return (
            <div className="flex-grow flex flex-col items-start justify-center py-1 text-red-500 font-bold text-sm border-r-2 border-gray-700">
                Canzone cassata
            </div>
        )
    }

    function renderUpVote() {
        if (props.your_vote === 'up') return (
            <div className="flex w-16 items-center justify-center text-green-500 cursor-pointer hover:bg-gray-100">
                <MdThumbUp size={21} />
            </div>
        )

        return (
            <div className="flex w-16 items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100">
                <MdThumbUp size={21} />
            </div>
        )
    }

    function renderDownVote() {
        if (props.your_vote === 'down') return (
            <div className="flex w-16 items-center justify-center text-red-500 cursor-pointer hover:bg-gray-100">
                <MdThumbDown size={21} />
            </div>
        )

        return (
            <div className="flex w-16 items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100">
                <MdThumbDown size={21} />
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col border-b-2 border-dotted border-gray-500">
            <div className="w-full flex flex-row">
                <div className="w-3/4 flex-grow flex flex-col items-start pt-2 pl-3">
                    <div className="text-sm text-gray-800 font-bold">
                        {props.name}{' '}-{' '}{props.author}
                    </div>
                    <div className="text-sm text-gray-600 font-thin">
                        {(props.is_your === 1) ? 'Tu' : props.created_by}
                    </div>
                </div>
                {(props.is_your) ? (
                    <div className="flex w-14 items-center justify-center cursor-pointer hover:bg-gray-100">
                        <MdClose size={21} />
                    </div>
                ) : (null)}
            </div>
            <div className="w-full flex flex-row pb-2 pl-3">
                {renderVote()}
                {renderUpVote()}
                {renderDownVote()}
                <div className="w-14">

                </div>
            </div>
        </div>
    )
}

function AddSong(props) {
    var [song, setSong] = useState('')
    var [author, setAuthor] = useState('')

    function submitForm(e) {
        e.preventDefault()
        props.changePage('main', 0)
    }

    function inputSong(e) {
        setSong(e.target.value)
    }

    function inputAuthor(e) {
        setAuthor(e.target.value)
    }

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full">
                <form className="w-full flex flex-col items-center" onSubmit={submitForm}>
                    <input 
                        onChange={inputSong} 
                        type="text" 
                        placeholder="Nome della canzone" 
                        className="mt-4 border-gray-600 border-b-2" />
                    <input 
                        onChange={inputAuthor} 
                        type="text" 
                        placeholder="Autore" 
                        className="mt-4 border-gray-600 border-b-2" />
                    <div className="w-full flex flex-row justify-center space-x-3 mt-4">
                        <div>
                            <button type="submit" className="py-2 px-4 rounded-md text-white font-bold text-sm bg-blue-600 border-2 border-blue-600">
                                Aggiungi
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => { props.changePage('main', 0) }}
                                className="py-2 px-4 border-2 border-gray-500 text-gray-500 font-bold text-sm rounded-md"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function Home(props) {
    var [page, setPage] = useState('main')
    var [data, setData] = useState(props.data)

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
                        total_voters={obj.total_voters}
                        key={uuidv4()}
                    />
                )
            })
            return elem
        }

        if (page === 'add') return (<AddSong changePage={changePage} />)
    }

    function goToAdd() {
        changePage('add', 0)
    }

    function changePage(p, dataChanged) {
        setPage(p)
    }

    function renderAddButton() {
        if (page !== 'add') return (
            <div className="w-full absolute bottom-0 right-0 flex flex-col items-center">
                <div className="w-full max-w-xl relative">
                    <div onClick={goToAdd} className="flex w-14 h-14 items-center justify-center rounded-full cursor-pointer bg-emerald-500 text-white absolute bottom-4 right-4">
                        <MdAdd size={30} />
                    </div>
                </div>
            </div>
        )

        return (null)
    }

    return (
        <div className="w-screen overflow-x-hidden flex flex-col items-center">
            <div className="w-full max-w-xl flex flex-col items-center bg-white pb-4">
                <div>
                    Playlist
                </div>
                <div className="w-full flex flex-col items-center">
                    {renderSongList()}
                </div>
            </div>
            {renderAddButton()}
        </div>
    )
}