import { getClient } from "../modules/redis"
import { getClient as getPgClient } from "../modules/pg"
import { parseCookie, parseUserSession } from "../modules/supply"
import '../modules/client/renew'
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp } from 'react-icons/md'
import {useRouter} from 'next/router'

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
        from song as s
        order by s.name asc`,
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
                In attesa del quorum [{props.up_vote + props.down_vote}/{props.total_voters} votanti]
            </div>
        )
        if (props.up_vote > props.down_vote) return (
            <div className="flex-grow flex flex-col items-start justify-center py-1 text-emerald-500 font-bold text-sm border-r-2 border-gray-700">
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
            <div className="flex flex-shrink-0 w-16 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className=" font-bold px-1">{props.up_vote}</div>
                <MdThumbUp size={21} />
            </div>
        )

        return (
            <div onClick={() => { voteThisSong('up') }} className="flex flex-shrink-0 w-16 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className="font-bold px-1">{props.up_vote}</div>
                <MdThumbUpOffAlt size={21} />
            </div>
        )
    }

    function renderDownVote() {
        if (props.your_vote === 'down') return (
            <div className="flex flex-shrink-0 w-16 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className="font-bold px-1">{props.down_vote}</div>
                <MdThumbDown size={21} />
            </div>
        )

        return (
            <div onClick={() => { voteThisSong('down') }} className="flex flex-shrink-0 w-16 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className="font-bold px-1">{props.down_vote}</div>
                <MdThumbDownOffAlt size={21} />
            </div>
        )
    }

    function voteThisSong(vote) {
        fetch('/api/vote_song', {
            method: 'POST',
            body: JSON.stringify({
                song: props.name,
                author: props.author,
                vote: vote
            })
        })
            .then(res => {
                if (res.status === 200) props.changePage('main', 1)
                return res.text()
            })
            .then(data => {
                console.log(data)
            })
            .catch(e => {
                console.log(e.message)
            })
    }

    return (
        <div className="w-full flex flex-col border-b-2 border-dotted border-gray-500">
            <div className="w-full flex flex-row">
                <div className="w-3/4 flex-grow flex flex-col items-start pt-2 pl-3">
                    <div className="text-sm text-gray-800 font-bold">
                        {props.name}{' '}-{' '}<span className="text-gray-500">{props.author}</span>
                    </div>
                    <div className="text-sm text-gray-600 font-thin">
                        {(props.is_your === 1) ? 'Tu' : props.created_by}
                    </div>
                </div>
                {(props.is_your) ? (
                    <div
                        className="flex w-14 items-center justify-center cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                            props.setDeletionData({
                                song: props.name,
                                author: props.author
                            })
                            props.changePage('delete', 0)
                        }}
                    >
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
        fetch('/api/add_song', {
            method: 'POST',
            body: JSON.stringify({
                song: song,
                author: author
            })
        })
            .then(res => {
                if (res.status === 200) props.changePage('main', 1)
                return res.text()
            })
            .then(info => {
                console.log(info)
            })
            .catch(e => {
                console.log(e.message)
            })
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

function DeleteSong(props) {
    var [confirm, setConfirm] = useState('')

    function inputConfirm(e) {
        setConfirm(e.target.value)
    }

    function submitForm(e) {
        e.preventDefault()
        if (confirm !== 'delete') return
        fetch('/api/delete_song', {
            method: 'POST',
            body: JSON.stringify({
                song: props.dataForDeletion.song,
                author: props.dataForDeletion.author
            })
        })
            .then(res => {
                if (res.status === 200) props.changePage('main', 1)
                return res.text()
            })
            .then(data => {
                if(data==='NOT_FOUND') props.changePage('main', 1)
            })
            .catch(e => {
                console.log(e.message)
            })
    }

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full">
                <form className="w-full flex flex-col items-center" onSubmit={submitForm}>
                    <div className="font-bold text-sm text-gray-800">
                        Per eliminare la canzone {props.dataForDeletion.song} di {props.dataForDeletion.author} digita 'delete'
                    </div>
                    <div>
                        <input
                            onChange={inputConfirm}
                            type="text"
                            placeholder="Scrivi quanto richiesto"
                            className="mt-4 border-gray-600 border-b-2"
                        />
                    </div>
                    <div className="w-full flex flex-row justify-center space-x-3 mt-4">
                        <div>
                            <button type="submit" className="py-2 px-4 rounded-md text-white font-bold text-sm bg-blue-600 border-2 border-blue-600">
                                Elimina
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
    var [dataForDeletion, setDataForDeletion] = useState(null)
    const router = useRouter()

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
                        changePage={changePage}
                        setDeletionData={setDeletionData}
                    />
                )
            })
            return elem
        }

        if (page === 'add') return (<AddSong changePage={changePage} />)
        if (page === 'delete') return (
            <DeleteSong changePage={changePage} dataForDeletion={dataForDeletion} />
        )
    }

    function goToAdd() {
        changePage('add', 0)
    }

    function setDeletionData(data) {
        setDataForDeletion(data)
    }

    function changePage(p, dataChanged) {
        setPage(p)
        if (dataChanged === 1) {
            fetch('/api/song_list')
                .then(res => {
                    return res.json()
                })
                .then(data => {
                    setData(data)
                })
        }
    }

    function renderAddButton() {
        if (page === 'main') return (
            <div className="w-full fixed z-10 bottom-0 right-0 flex flex-col items-center">
                <div className="w-full max-w-xl relative">
                    <div onClick={goToAdd} className="flex w-14 h-14 items-center justify-center rounded-full cursor-pointer bg-emerald-500 text-white absolute bottom-4 right-4">
                        <MdAdd size={30} />
                    </div>
                </div>
            </div>
        )

        return (null)
    }

    function exit() {
        fetch('/api/signout')
        .then(res => {
            if(res.status===200) router.push('/playlist')
        })
    }

    return (
        <div className="w-screen overflow-x-hidden flex flex-col items-center">
            <div className="w-full max-w-xl flex flex-col items-center bg-white pb-20">
                <div className="py-4 flex w-full flex-row justify-center text-4xl font-thin text-gray-700">
                    <div className="flex-grow pl-2">
                        Playlist
                    </div>
                    <div onClick={exit} className="w-14 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                        <MdExitToApp size={30} />
                    </div>
                </div>
                <div className="w-full flex flex-col items-center">
                    {renderSongList()}
                </div>
            </div>
            {renderAddButton()}
        </div>
    )
}