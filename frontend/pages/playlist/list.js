import { parseCookie, parseUserSession } from "../../modules/supply"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp, MdOutlineModeComment } from 'react-icons/md'
import { FaCaretDown, FaCaretUp } from 'react-icons/fa'
import { useRouter } from 'next/router'
import { Page } from "@/Components/page"
import { Menu } from "@/Components/menu"
import { HeadComponent } from "@/Components/head"
import { DropDownMenu } from "@/Components/dropdown"

export async function getServerSideProps(context) {
    const cookies = parseCookie(context.req.headers.cookie || '')
    const userAccessCookie = cookies['session'] || null
    const orderBy = cookies['filter_order_by'] || null
    const orderByAuthor = cookies['filter_by_author'] || null
    const displayFilter = cookies['filter_display'] || null
    if (userAccessCookie === null) return {
        redirect: {
            permanent: false,
            destination: '/signin?redirect=playlist/list'
        }
    }
    const res = await fetch(`${process.env.DOMAIN}/api/backend/playlist/list`, {
        method: 'POST',
        body: JSON.stringify({
            session: userAccessCookie,
            order: orderBy || undefined,
            author: (orderByAuthor === 'all') ? undefined : orderByAuthor || undefined
        })
    })
    if (res.status >= 500) {
        return {
            props: {
                status: 500,
                data: null
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
    const rows = await res.json()

    return {
        props: {
            data: rows.list,
            users: rows.users,
            display: displayFilter,
            order_by: orderBy,
            filter_by_author: orderByAuthor
        }
    }
}

export function SongRow(props) {
    const router = useRouter()

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

    function renderVoteSimplified() {
        if (props.up_vote + props.down_vote < props.total_voters) return (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
        )
        if (props.up_vote > props.down_vote) return (
            <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
        )

        return (
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
        )
    }

    function renderUpVote() {
        if (props.your_vote === 'up') return (
            <div className="flex flex-shrink-0 w-14 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className=" font-bold px-1">{props.up_vote}</div>
                <MdThumbUp size={21} />
            </div>
        )

        return (
            <div onClick={() => { voteThisSong('up') }} className="flex flex-shrink-0 w-14 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className="font-bold px-1">{props.up_vote}</div>
                <MdThumbUpOffAlt size={21} />
            </div>
        )
    }

    function renderDownVote() {
        if (props.your_vote === 'down') return (
            <div className="flex flex-shrink-0 w-14 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className="font-bold px-1">{props.down_vote}</div>
                <MdThumbDown size={21} />
            </div>
        )

        return (
            <div onClick={() => { voteThisSong('down') }} className="flex flex-shrink-0 w-14 flex-row items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                <div className="font-bold px-1">{props.down_vote}</div>
                <MdThumbDownOffAlt size={21} />
            </div>
        )
    }

    function renderCommentsNumber() {
        return (
            <div onClick={() => {
                router.push(`/comment/list?song=${props.name}&author=${props.author}`)
            }} className="text-gray-700 w-20 flex flex-row flex-shrink-0 items-center justify-center cursor-pointer border-gray-700 border-l-2 hover:bg-gray-100">
                <div className="font-bold px-1 w-9">{props.total_comments}</div>
                <MdOutlineModeComment size={21} />
            </div>
        )
    }

    function renderDeleteSong() {
        if (props.is_your !== 1) return (null)
        return (
            <div
                className="flex flex-row w-16 items-center justify-center cursor-pointer hover:bg-gray-100"
                onClick={() => {
                    router.push(`/playlist/delete?song=${props.name}&author=${props.author}`)
                }}
            >
                <div className="w-7"></div>
                <MdClose size={21} />
            </div>
        )
    }

    function voteThisSong(vote) {
        fetch('/api/client/song/vote', {
            method: 'POST',
            body: JSON.stringify({
                song: props.name,
                author: props.author,
                vote: vote
            })
        })
            .then(res => {
                if (res.status === 200) {
                    props.reloadPage()
                }
                return res.text()
            })
            .then(data => {
                console.log(data)
            })
            .catch(e => {
                console.log(e.message)
            })
    }

    function render() {
        if (props.display === 'full') return (
            <div className="w-full flex flex-col border-b-2 border-dotted border-gray-500">
                <div className="w-full flex flex-row">
                    <div className="w-3/4 flex-grow flex flex-col items-start pt-2 pl-3">
                        <div className="text-sm text-gray-800 font-bold flex-grow break-all">
                            {props.name}{' '}-{' '}<span className="text-gray-500">{props.author}</span>
                        </div>
                        <div className="text-sm text-gray-600 font-thin">
                            {(props.is_your === 1) ? 'Tu' : props.created_by}
                        </div>
                    </div>
                    {renderDeleteSong()}
                </div>
                <div className="w-full flex flex-row pb-2 pl-3">
                    {renderVote()}
                    {renderUpVote()}
                    {renderDownVote()}
                    {renderCommentsNumber()}
                </div>
            </div>
        )

        return (
            <div className="w-full flex flex-row justify-center border-b-2 border-dotted border-gray-500 py-3">
                <div className="w-3/4 flex-grow flex flex-row justify-start min-h-6 items-center space-x-4 pl-5">
                    {renderVoteSimplified()}
                    <div className="text-sm text-gray-800 font-bold break-all flex-grow">
                        {props.name}{' '}-{' '}<span className="text-gray-400">{props.author}</span>
                    </div>
                </div>
                {renderUpVote()}
                {renderDownVote()}
            </div>
        )
    }

    return render()
}

export default function Home(props) {
    var [data, setData] = useState(props.data)
    var [display, setDisplay] = useState(props.display || 'full')
    var [orderBy, setOrderBy] = useState(props.order_by || null)
    var [users, setUsers] = useState(props.users)
    var [orderByAuthor, setOrderByAuthor] = useState(props.filter_by_author || null)
    var [matchString, setMatchString] = useState('')
    const router = useRouter()

    function renderSongList() {
        const elem = []
        data.map((obj) => {
            const tempName = `${obj.name} - ${obj.author}`
            if (matchString !== '' && tempName.match(matchString) === null) return
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
                    total_comments={obj.total_comments}
                    key={uuidv4()}
                    reloadPage={reloadPage}
                    display={display}
                />
            )
        })
        return elem
    }

    function buildUsersOptionList() {
        var res = []
        for (var i = 0; i < users.length; i++) res.push({
            key: users[i].username,
            text: users[i].username
        })
        res.push({
            key: 'all',
            text: 'tutti'
        })
        return res
    }

    function goToAdd() {
        router.push('/playlist/add')
    }

    function reloadPage() {
        fetch('/api/client/playlist/list', {
            method: 'POST'
        })
            .then(res => {
                if (res.status !== 200) return res.text()
                return res.json()
            })
            .then(data => {
                if (typeof data === 'string') console.log(data)
                else {
                    setData(data.list)
                    setUsers(data.users)
                }
            })
    }

    function renderAddButton() {
        return (
            <div className="w-full fixed z-10 bottom-0 right-0 flex flex-col items-center">
                <div className="w-full max-w-xl relative">
                    <div onClick={goToAdd} className="flex w-14 h-14 items-center justify-center rounded-full cursor-pointer bg-emerald-500 text-white absolute bottom-4 right-4">
                        <MdAdd size={30} />
                    </div>
                </div>
            </div>
        )
    }

    function searchChange(e) {
        setMatchString(e.target.value)
    }

    function pageBody() {
        if (props.status === 500) {
            return (
                <div className="w-full flex items-center text-sm font-medium text-gray-700 h-60 justify-center">
                    <div className="max-w-xs text-center">
                        Si &egrave; verificato un errore
                    </div>
                </div>
            )
        }
        return (
            <div className="flex flex-col w-full items-center">
                <div className="w-full flex flex-row justify-center py-6">
                    <div className="w-60">
                        <DropDownMenu value="Mostra vista:" options={
                            [
                                {
                                    key: 'full',
                                    text: 'completa'
                                }, {
                                    key: 'simplified',
                                    text: 'semplificata'
                                }
                            ]
                        } default={props.display} onChange={(selected) => {
                            document.cookie = `filter_display=${selected}; path=/; samesite=lax`
                            setDisplay(selected)
                        }} />
                    </div>
                </div>
                <div className="py-6 w-full flex flex-row justify-center space-x-4">
                    <div className="w-56">
                        <DropDownMenu value="Ordina per:" options={
                            [
                                {
                                    key: 'alf_asc',
                                    text: 'ALF ASC'
                                }, {
                                    key: 'alf_desc',
                                    text: 'ALF DESC'
                                }, {
                                    key: 'date_asc',
                                    text: 'DATE ASC'
                                }, {
                                    key: 'date_desc',
                                    text: 'DATE DESC'
                                }
                            ]
                        } default="alf_asc" onChange={(selected) => {
                            document.cookie = `filter_order_by=${selected}; path=/; samesite=lax`
                            setOrderBy(selected)
                            reloadPage()
                        }} />
                    </div>
                    <div className="w-56">
                        <DropDownMenu value="Filtra per:" options={
                            buildUsersOptionList()
                        } default={(orderByAuthor === null) ? 'all' : orderByAuthor} onChange={(selected) => {
                            if (selected === 'all') document.cookie = `filter_by_author=${selected}; path=/; samesite=lax; max-age=0`
                            else document.cookie = `filter_by_author=${selected}; path=/; samesite=lax`
                            setOrderByAuthor(selected)
                            reloadPage()
                        }} />
                    </div>
                </div>
                <div className="py-6 w-full flex flex-col items-center">
                    <input
                        type="text"
                        placeholder="Termine di ricerca"
                        className="py-2 px-3 w-80 box-border font-medium text-sm text-gray-700 border-gray-600 border-solid border-[1px] rounded"
                        onChange={searchChange}
                    />
                </div>
                <div className="w-full flex flex-col items-center">
                    {renderSongList()}
                </div>
            </div>
        )
    }

    return (
        <Page absoluteMenu={
            renderAddButton()
        } menu={
            <Menu title="Playlist - brani" />
        } head={
            <HeadComponent title="Playlist - brani" />
        }>
            {pageBody()}
        </Page>
    )
}