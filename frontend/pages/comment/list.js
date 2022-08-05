import { parseCookie, parseUserSession } from "../../modules/supply"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp, MdReply, MdOutlineAddComment } from 'react-icons/md'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { useRouter } from 'next/router'
import { AbsoluteMenu, Page } from "@/Components/page"
import { Menu } from "@/Components/menu"
import { HeadComponent } from "@/Components/head"

export async function getServerSideProps(context) {
    const songName = context.query.song || null
    const songAuthor = context.query.author || null
    if (songName === null || songAuthor === null) return {
        redirect: {
            permanent: false,
            destination: '/playlist/list'
        }
    }
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) return {
        redirect: {
            permanent: false,
            destination: '/signin?redirect=playlist/list'
        }
    }
    const session = parseUserSession(userAccessCookie)

    const res = await fetch(`${process.env.DOMAIN}/api/backend/comment/list`, {
        method: 'POST',
        body: JSON.stringify({
            session: userAccessCookie,
            song: songName,
            author: songAuthor
        })
    })
    if (res.status >= 500) return {
        props: {
            status: 500,
            data: null,
            song: songName,
            author: songAuthor
        }
    }
    if (res.status >= 400) {
        context.res.setHeader('set-cookie', 'session=;path=/;httpOnly')
        return {
            redirect: {
                permanent: false,
                destination: '/signin?redirect=playlist/list'
            }
        }
    }

    const data = await res.json()

    return {
        props: {
            data: data,
            song: songName,
            author: songAuthor
        }
    }
}

function CommentRow(props) {
    const router = useRouter()
    const comment = props.data.comment
    const author = props.data.author
    const is_you = props.data.is_you
    const uuid_author = props.data.uuid_author
    const comment_uuid = props.data.comment_uuid
    const reply_to_id = props.data.reply_to_id || null
    const reply_to_author = props.data.reply_to_author || null
    const replied_message = props.data.replied_message || null
    const like_number = props.data.comment_like || 0
    const you_like = props.data.you_like || 0
    const created_at = props.data.created_at
    const replyEvent = () => {
        router.push(`/comment/add?song=${props.song}&author=${props.author}&reply_to=${comment_uuid}`)
    }

    function renderRepliedTo() {
        if (reply_to_id === null) return (null)
        return (
            <div className="flex flex-row justify-center w-full pt-1">
                <div className="w-4"></div>
                <div className="flex flex-grow flex-col items-center border-gray-600 border-l-4 bg-slate-50">
                    <div className="w-full box-border pl-4 text-xs text-gray-500 font-bold pt-1">
                        {reply_to_author}
                    </div>
                    <div className="w-full box-border pl-6 text-xs text-gray-400 font-bold pb-1 pt-1">
                        {replied_message}
                    </div>
                </div>
                <div className="w-4"></div>
            </div>
        )
    }

    function renderLikeIcon() {
        if (you_like === 1) return (<div className="text-red-500" onClick={() => likeApi(0)}>
            <FaHeart size={16} />
        </div>)

        return (<div onClick={() => likeApi(1)}>
            <FaRegHeart size={16} />
        </div>)
    }

    function likeApi(status) {
        fetch('/api/client/comment/like', {
            method: 'POST',
            body: JSON.stringify({
                comment_uuid: comment_uuid,
                like: status
            })
        })
            .then(res => {
                if (res.status === 200) props.onLike()
                res.text()
            })
            .then(data => {

            })
            .catch(e => { console.log(e.message) })
    }

    function parseTimeCreated() {
        const t = parseInt(created_at)
        if (t === 0) return "Adesso"
        if (t < 60 && t === 1) return `${t} secondo fa`
        if (t < 60) return `${t} secondi fa`
        const minutes = parseInt(t / 60)
        if (minutes < 60 && minutes === 1) return `${minutes} minuto fa`
        if (minutes < 60) return `${minutes} minuti fa`

        const hours = parseInt(minutes / 60)
        if (hours < 24 && hours === 1) return `${hours} ora fa`
        if (hours < 24) return `${hours} ore fa`

        const days = parseInt(hours / 24)
        if (days === 1) return `${days} giorno fa`
        return `${days} giorni fa`
    }

    return (
        <div className="flex flex-row justify-center bg-gray-100 py-3">
            <div className="w-12"></div>
            <div className="flex flex-col w-full items-center rounded-md overflow-x-hidden">
                <div className="w-full flex flex-row justify-start">
                    <div className="pl-4 text-sm font-bold text-gray-700">
                        {(is_you === 1) ? 'Tu' : author}
                    </div>
                    <div className="text-sm font-medium text-gray-400 pl-5">
                        {parseTimeCreated()}
                    </div>
                </div>
                <div className="w-full h-2 flex"></div>
                {renderRepliedTo()}
                <div className="w-full h-2 flex"></div>
                <div className="w-full flex flex-row justify-center">
                    <div className="w-5"></div>
                    <div className="w-full flex-grow box-border text-sm font-medium text-gray-600 pb-2">
                        {comment}
                    </div>
                    <div className="w-5"></div>
                </div>
                <div className="w-full h-4 flex"></div>
                <div className="w-full flex flex-row justify-start">
                    <div className="w-5"></div>
                    <div className="text-gray-500 border-solid border-r-2 border-gray-500 hover:bg-gray-200 cursor-pointer font-bold text-sm w-16 flex flex-row justify-center items-center space-x-2">
                        <div>{like_number}</div>
                        {renderLikeIcon()}
                    </div>
                    <div onClick={replyEvent} className="flex w-28 flex-row justify-center items-center text-blue-500 hover:bg-gray-200 cursor-pointer text-sm font-bold space-x-2">
                        <div>Reply</div>
                        <div><MdReply size={16} /></div>
                    </div>
                </div>
            </div>
            <div className="w-12"></div>
        </div>
    )
}

export default function CommentsPage(props) {
    console.log(props.data)
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
                    onLike={updateComments}
                    key={uuidv4()}
                    data={obj}
                    song={props.song}
                    author={props.author}
                />
            )
        })
        return res
    }

    function updateComments() {
        fetch('/api/client/comment/list', {
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
            .catch(e => { console.log(e.message) })
    }

    function render() {
        return (
            <div className="w-full flex flex-col items-center space-y-6">
                <div className="w-full flex flex-row justify-center">
                    <div className="flex-grow text-left pl-3 text-gray-800 font-medium text-lg">
                        Commenti
                    </div>
                    <div onClick={() => { router.push('/playlist/list') }} className="w-14 flex items-center justify-center text-gray-800 hover:bg-gray-100">
                        <MdClose size={30} />
                    </div>
                </div>
                <div className="w-full flex flex-col space-y-12">
                    {renderComments()}
                </div>
            </div>
        )
    }

    function renderAbsoluteMenu() {
        return (
            <AbsoluteMenu onClick={() => {
                router.push(`/comment/add?song=${props.song}&author=${props.author}`)
            }} icon={<MdOutlineAddComment size={21} />} />
        )
    }

    function exit() {
        fetch('/api/signout')
            .then(res => {
                if (res.status === 200) router.push('/playlist/list')
            })
    }

    return (
        <Page menu={
            <Menu title="Commenti" />
        } absoluteMenu={
            renderAbsoluteMenu()
        } head={
            <HeadComponent title="Commenti" />
        }>
            {render()}
        </Page>
    )
}