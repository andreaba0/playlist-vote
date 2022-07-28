import { parseCookie, parseUserSession } from "../../modules/supply"
import '../../modules/client/renew'
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
    const songName = context.query.song || null
    const songAuthor = context.query.author || null
    if (songName === null || songAuthor === null) {
        return {
            redirect: {
                permanent: false,
                destination: '/signin?redirect=playlist/list'
            }
        }
    }
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

    if(res.status!==200) {
        context.res.setHeader('set-cookie', 'session=;path=/;httpOnly')
        return {
            redirect: {
                permanent: false,
                destination: '/signin?redirect=playlist/list'
            }
        }
    }

    return {
        props: {
            query: {
                song: songName,
                author: songAuthor
            }
        }
    }
}

export default function DeleteSong(props) {
    const songName = props.query.song
    const songAuthor = props.query.author
    var [confirm, setConfirm] = useState('')
    const router = useRouter()

    function inputConfirm(e) {
        setConfirm(e.target.value)
    }

    function submitForm(e) {
        e.preventDefault()
        if (confirm !== 'delete') return
        fetch('/api/delete_song', {
            method: 'POST',
            body: JSON.stringify({
                song: songName,
                author: songAuthor
            })
        })
            .then(res => {
                if (res.status === 200) router.push('/playlist/list')
                return res.text()
            })
            .then(data => {

            })
            .catch(e => {
                console.log(e.message)
            })
    }

    function exit() {
        fetch('/api/signout')
            .then(res => {
                if (res.status === 200) router.push('/playlist')
            })
    }

    function displayTextForDeletion() {
        var word = 'delete'
        var res = []
        for (var c of word) res.push(
            <div key={uuidv4()} className="px-2 py-1 text-base font-bold text-gray-600 bg-slate-100">
                {c}
            </div>
        )
        return res
    }

    return (
        <Page menu={
            <Menu title="Elimina canzone" />
        } head={
            <HeadComponent title="Elimina brano" />
        }>
            <div className="w-full flex flex-col items-center">
                <div className="w-full">
                    <form className="w-full flex flex-col items-center" onSubmit={submitForm}>
                        <div className="font-bold text-sm text-gray-800">
                            Per eliminare
                        </div>
                        <div className="flex flex-row justify-center mt-3">
                            <div className="w-12"></div>
                            <div className="flex-grow py-2 px-4 rounded-md bg-slate-100 text-left text-md font-bold">
                                <span className="text-gray-700">{songName}{' '}-{' '}</span>
                                <span className="text-gray-500">{songAuthor}</span>
                            </div>
                            <div className="w-12"></div>
                        </div>
                        <div className="font-bold text-sm text-gray-800 mt-6">
                            digita
                        </div>
                        <div className="w-full flex flex-row justify-center space-x-2 mt-2">
                            {displayTextForDeletion()}
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