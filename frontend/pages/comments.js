import { getClient } from "../modules/redis"
import { getClient as getPgClient } from "../modules/pg"
import { parseCookie, parseUserSession } from "../modules/supply"
import '../modules/client/renew'
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp } from 'react-icons/md'
import { useRouter } from 'next/router'

export async function getServerSideProps(context) {
    const songName = context.query.song || null
    const songAuthor = context.query.author || null
    if (songName === null || songAuthor === null) return {
        redirect: {
            permanent: false,
            destination: '/playlist'
        }
    }
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
                destination: '/signin?redirect=playlist'
            }
        }
    }

    const pgClient = await getPgClient()

    var { rows } = await pgClient.query(
        `select
            (
                select 1
                from comment as com
                where com.user_uuid=$3 and com.uuid=c.uuid
            ) as is_you,
            c.uuid as comment_uuid,
            c.user_uuid as uuid_author,
            (
                select u.username
                from _user as u
                where u.uuid=c.user_uuid
            ) as author,
            c.message as comment,
            c.reply_to as reply_to_id, 
            (
                select _user.username
                from _user inner join comment on _user.uuid=comment.user_uuid
                where c.reply_to=comment.uuid and _user.uuid=comment.user_uuid
            ) as reply_to_author,
            (
                select comment.message
                from comment
                where comment.uuid=c.reply_to
            ) as replied_message
            from comment as c
            where c.song_id=(
                select id
                from song
                where song.name=$1 and song.author=$2
            )
            order by created_at asc`,
        [songName, songAuthor, session.user_uuid]
    )

    return {
        props: {
            data: rows,
            song: songName,
            author: songAuthor
        }
    }
}

function CommentRow(props) {
    const comment = props.data.comment
    const author = props.data.author
    const is_you = props.data.is_you
    const uuid_author = props.data.uuid_author
    const comment_uuid = props.data.comment_uuid
    const reply_to_id = props.data.reply_to_id || null
    const reply_to_author = props.data.reply_to_author || null
    const replied_message = props.data.replied_message || null
    const replyEvent = () => {
        props.changePage('create', 0)
        props.setParams({
            author: author,
            comment: comment,
            uuid_author: uuid_author,
            uuid_comment: comment_uuid
        })
    }

    function render() {
        if (reply_to_id === null) return (
            <div className="w-full flex flex-col items-center mt-4 bg-gray-50 py-3">
                <div className="py-2 text-base text-gray-800 font-medium text-left box-border w-full pl-4">
                    {author}
                </div>
                <div className="w-full pl-12 mt-1 text-gray-600 text-sm font-normal">
                    {comment}
                </div>
                <div onClick={replyEvent} className="w-full pl-12 mt-1 text-blue-600 text-sm font-medium cursor-pointer">
                    Replica
                </div>
            </div>
        )

        return (
            <div className="w-full flex flex-col items-center mt-4 bg-gray-50 py-3">
                <div className="py-2 text-base text-gray-800 font-medium text-left box-border w-full pl-4">
                    {author}
                </div>
                <div className="w-full flex flex-row justify-start">
                    <div className="w-14"></div>
                    <div className="border-emerald-400 border-l-2 border-solid flex flex-grow flex-col items-start pl-3 py-2 bg-slate-100">
                        <div className="text-gray-700 font-medium text-sm">
                            {reply_to_author}
                        </div>
                        <div className="text-gray-600 font-normal text-sm">
                            {replied_message}
                        </div>
                    </div>
                    <div className="w-14"></div>
                </div>
                <div className="w-full pl-12 mt-2 text-gray-600 text-sm font-normal">
                    {comment}
                </div>
                <div onClick={replyEvent} className="w-full pl-12 mt-1 text-blue-600 text-sm font-medium cursor-pointer">
                    Replica
                </div>
            </div>
        )
    }

    return render()
}

export default function CommentsPage(props) {
    var [comments, setComments] = useState(props.data)
    var [page, setPage] = useState('main')
    var [params, setParams] = useState(null)
    const router = useRouter()

    function renderComments() {
        if (comments === null) return (null)
        if (comments.length === 0) return (
            <div className="w-full py-9 text-base font-medium text-gray-800 text-center">
                Non ci sono commenti da mostrare
            </div>
        )

        var res = []
        comments.map((obj) => {
            res.push(
                <CommentRow
                    key={uuidv4()}
                    data={obj}
                    changePage={changePage}
                    setParams={setParams}
                />
            )
        })
        return res
    }

    function changePage(p, dataChanged) {
        setPage(p)
        if (dataChanged === 1) {
            fetch('/api/get_comments', {
                method: 'POST',
                body: JSON.stringify({
                    song: props.song,
                    author: props.author
                })
            })
                .then(res => {
                    return res.json()
                })
                .then(data => {
                    setComments(data)
                })
        }
    }

    function render() {
        if (page === 'main') return (
            <div className="w-full flex flex-col items-center">
                <div className="w-full flex flex-row justify-center">
                    <div className="flex-grow text-left pl-3 text-gray-800 font-medium text-lg">
                        Commenti
                    </div>
                    <div onClick={() => { router.push('/playlist') }} className="w-14 flex items-center justify-center text-gray-800 hover:bg-gray-100">
                        <MdClose size={30} />
                    </div>
                </div>
                <div className="w-full flex flex-col">
                    {renderComments()}
                </div>
                <div className="w-full py-4 flex flex-col items-center">
                    <div
                        onClick={() => {
                            setPage('create', 0)
                            setParams({})
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-md cursor-pointer"
                    >
                        Commenta
                    </div>
                </div>
            </div>
        )

        if (page === 'create') return (
            <AddComment
                params={params}
                changePage={changePage}
                song={props.song}
                author={props.author}
            />
        )
    }

    function exit() {
        fetch('/api/signout')
            .then(res => {
                if (res.status === 200) router.push('/playlist')
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
                    {render()}
                </div>
            </div>
        </div>
    )


}

function AddComment(props) {
    var [message, setMessage] = useState(null)

    function submitForm(e) {
        e.preventDefault()
        fetch('/api/add_comment', {
            method: 'POST',
            body: JSON.stringify({
                song: props.song,
                author: props.author,
                reply_to: props.params.uuid_comment || null,
                message: message
            })
        })
            .then(res => {
                if (res.status === 200) props.changePage('main', 1)
                return res.text()
            })
            .then(data => {
            })
            .catch(e => {
                console.log(e.message)
            })
    }

    function messageInputChange(e) {
        setMessage(e.target.value)
    }

    function renderReply() {
        if (typeof props.params.uuid_comment === 'undefined') return (null)

        return (
            <div className="flex flex-col w-full items-center">
                <div className="w-full py-2 text-sm font-medium text-gray-600 text-center">
                    In risposta a
                </div>
                <div className="w-full p-6 text-sm font-normal text-gray-600 mt-2 text-center">
                    {props.params.comment}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full text-center text-lg text-gray-800 font-thin">
                Inserisci un commento
            </div>
            {renderReply()}
            <div className="w-full mt-6">
                <form onSubmit={submitForm} className="flex flex-col items-center">
                    <div className="w-full flex flex-row justify-center">
                        <div className="w-9"></div>
                        <textarea
                            onChange={messageInputChange}
                            type="text"
                            placeholder="Il tuo commento"
                            className="flex-grow"
                        />
                        <div className="w-9"></div>
                    </div>
                    <div className="w-full flex flex-row justify-center space-x-4 mt-6">
                        <div>
                            <button type="submit" className="border-solid border-2 bg-blue-600 rounded-md border-blue-600 text-white font-bold text-sm px-5 py-3">
                                pubblica
                            </button>
                        </div>
                        <div>
                            <button onClick={() => { props.changePage('main', 0) }} className="border-solid border-2 border-gray-700 text-gray-700 py-3 px-5 text-sm font-bold rounded-md">
                                Annulla
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}