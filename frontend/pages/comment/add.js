import { parseCookie, parseUserSession } from "../../modules/supply"
import '../../modules/client/renew'
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp } from 'react-icons/md'
import { useRouter } from 'next/router'
import { Menu } from "@/Components/menu"
import { Page } from "@/Components/page"
import { HeadComponent } from "@/Components/head"

export async function getServerSideProps(context) {
    const songName = context.query.song || null
    const songAuthor = context.query.author || null
    const replyTo = context.query.reply_to || null
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
            destination: '/signin?redirect=playlist/list'
        }
    }
    const session = parseUserSession(userAccessCookie)

    var res = await fetch(`${process.env.DOMAIN}/api/auth/status`, {
        method: 'POST',
        body: JSON.stringify({session: userAccessCookie})
    })
    if (res.status >= 500) {
        return {
            props: {
                status: 500,
                data: null,
                song: songName,
                author: songAuthor
            }
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

    if (replyTo === null) {
        return {
            props: {
                data: null,
                song: songName,
                author: songAuthor
            }
        }
    }

    res = await fetch(`${process.env.DOMAIN}/api/backend/comment`, {
        method: 'POST',
        body: JSON.stringify({
            reply_to: replyTo
        })
    })
    if (res.status !== 200) return {
        props: {
            data: null,
            song: songName,
            author: songAuthor,
            status: 500
        }
    }

    const data = await res.json()

    if (data.length === 0) return {
        props: {
            data: null,
            song: songName,
            author: songAuthor
        }
    }

    return {
        props: {
            data: data[0],
            song: songName,
            author: songAuthor,
            reply_to: replyTo
        }
    }
}

export default function AddComment(props) {
    const REPLYTO = props.data
    var [message, setMessage] = useState(null)
    const router = useRouter()

    function submitForm(e) {
        e.preventDefault()
        fetch('/api/client/comment/add', {
            method: 'POST',
            body: JSON.stringify({
                song: props.song,
                author: props.author,
                reply_to: props.reply_to || null,
                message: message
            })
        })
            .then(res => {
                if (res.status === 200) router.push(`/comment/list?song=${props.song}&author=${props.author}`)
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
        if (REPLYTO === null) return (null)

        return (
            <div className="flex flex-col w-full items-center">
                <div className="w-full py-2 text-sm font-medium text-gray-600 text-center">
                    In risposta a
                </div>
                <div className="w-full p-6 text-sm font-normal text-gray-600 mt-2 text-center">
                    {REPLYTO.reply_to_comment}
                </div>
            </div>
        )
    }

    function exit() {
        fetch('/api/signout')
            .then(res => {
                if (res.status === 200) router.push('/playlist/list')
            })
    }

    function render() {
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
                                <button type="button" onClick={() => {
                                    router.push(`/comment/list?song=${props.song}&author=${props.author}`)
                                    return false
                                }} className="border-solid border-2 border-gray-700 text-gray-700 py-3 px-5 text-sm font-bold rounded-md">
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <Page menu={
            <Menu title="Nuovo commento" />
        } head={
            <HeadComponent title="Aggiungi commento" />
        }>
            {render()}
        </Page>
    )
}