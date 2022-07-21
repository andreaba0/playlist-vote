import { MdClose, MdAdd, MdThumbUp, MdThumbDown, MdThumbUpOffAlt, MdThumbDownOffAlt, MdExitToApp, MdOutlineModeComment } from 'react-icons/md'

export function SongRow(props) {

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
                            props.setParams({
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
                <div onClick={() => {
                    props.changePage('comments', 0)
                    props.setParams(props)
                }} className="w-14 text-gray-700 flex items-center justify-center hover:bg-gray-100">
                    <MdOutlineModeComment size={21} />
                </div>
            </div>
        </div>
    )
}