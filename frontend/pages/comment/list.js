import { getClient } from "../../modules/redis"
import { getClient as getPgClient } from "../../modules/pg"
import { parseCookie, parseUserSession } from "../../modules/supply"
import '../../modules/client/renew'
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp, MdReply } from 'react-icons/md'
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
    const router = useRouter()
    const comment = props.data.comment
    const author = props.data.author
    const is_you = props.data.is_you
    const uuid_author = props.data.uuid_author
    const comment_uuid = props.data.comment_uuid
    const reply_to_id = props.data.reply_to_id || null
    const reply_to_author = props.data.reply_to_author || null
    const replied_message = props.data.replied_message || null
    const replyEvent = () => {
        router.push(`/comment/add?song=${props.song}&author=${props.author}&reply_to=${comment_uuid}`)
    }

    function renderRepliedTo() {
        if (reply_to_id === null) return (null)
        return (
            <div className="flex flex-row justify-center w-full pt-1">
                <div className="w-7"></div>
                <div className="flex flex-grow flex-col items-center border-blue-600 border-l-4 rounded bg-slate-50">
                    <div className="w-full box-border pl-4 text-xs text-gray-500 font-bold pt-1">
                        {reply_to_author}
                    </div>
                    <div className="w-full box-border pl-6 text-xs text-gray-400 font-bold pb-1">
                        {replied_message}
                    </div>
                </div>
                <div className="w-7"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-row justify-center">
            <div className="w-12"></div>
            <div className="flex flex-col w-full items-center rounded-md bg-slate-100 overflow-x-hidden">
                <div className="flex flex-row justify-center w-full">
                    <div className="flex-grow pt-2 pl-4 text-sm font-bold text-gray-700">
                        {author}
                    </div>
                    <div onClick={replyEvent} className="w-11 text-blue-600 hover:bg-gray-200 flex items-center justify-center">
                        <MdReply size={21} />
                    </div>
                </div>
                {renderRepliedTo()}
                <div className="w-full box-border px-5 pt-2 text-sm font-medium text-gray-600 pb-2">
                    {comment}
                </div>
            </div>
            <div className="w-12"></div>
        </div>
    )
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
                    song={props.song}
                    author={props.author}
                />
            )
        })
        return res
    }

    function render() {
        return (
            <div className="w-full flex flex-col items-center space-y-6">
                <div className="w-full flex flex-row justify-center">
                    <div className="flex-grow text-left pl-3 text-gray-800 font-medium text-lg">
                        Commenti
                    </div>
                    <div onClick={() => { router.push('/playlist') }} className="w-14 flex items-center justify-center text-gray-800 hover:bg-gray-100">
                        <MdClose size={30} />
                    </div>
                </div>
                <div className="w-full flex flex-col space-y-5">
                    {renderComments()}
                </div>
                <div className="w-full py-4 flex flex-col items-center">
                    <div
                        onClick={() => {
                            router.push(`/comment/add?song=${props.song}&author=${props.author}`)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-md cursor-pointer"
                    >
                        Commenta
                    </div>
                </div>
            </div>
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