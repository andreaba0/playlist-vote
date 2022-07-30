import { parseCookie, parseUserSession } from "../../modules/supply"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp } from 'react-icons/md'
import { useRouter } from 'next/router'
import { Page } from "@/Components/page"
import { Menu } from "@/Components/menu"
import { HeadComponent } from "@/Components/head"

export async function getServerSideProps(context) {
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    if (userAccessCookie === null) return {
        redirect: {
            permanent: false,
            destination: '/signin?redirect=playlist/list'
        }
    }
    const session = parseUserSession(userAccessCookie)

    const res = await fetch(`${process.env.DOMAIN}/api/auth/status`, {
        method: 'POST',
        body: JSON.stringify({session: userAccessCookie})
    })

    if (res.status !== 200) {
        context.res.setHeader('set-cookie', 'session=;path=/;httpOnly')
        return {
            redirect: {
                permanent: false,
                destination: '/signin?redirect=playlist/list'
            }
        }
    }

    return {
        props: {}
    }
}

export default function AddSong(props) {
    var [song, setSong] = useState('')
    var [author, setAuthor] = useState('')
    const router = useRouter()

    function submitForm(e) {
        e.preventDefault()
        fetch('/api/client/song/add', {
            method: 'POST',
            body: JSON.stringify({
                song: song,
                author: author
            })
        })
            .then(res => {
                if (res.status === 200) router.push('/playlist/list')
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

    function exit() {
        fetch('/api/signout')
            .then(res => {
                if (res.status === 200) router.push('/playlist/list')
            })
    }

    return (
        <Page menu={
            <Menu title="Aggiungi brano" />
        } head={
            <HeadComponent title="Aggiungi brano" />
        }>
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
                                    type="button"
                                    onClick={() => { router.push('/playlist/list') }}
                                    className="py-2 px-4 border-2 border-gray-500 text-gray-500 font-bold text-sm rounded-md"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Page>
    )
}