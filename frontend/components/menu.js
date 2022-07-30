import { useState } from "react";
import { MdExitToApp, MdOutlineVpnKey } from "react-icons/md"
import { FaUser, FaCaretDown, FaCaretUp, FaKey, FaRegUser } from 'react-icons/fa'
import { useRouter } from "next/router";

export function Menu(props) {
    const router = useRouter()
    var [menuDisplay, setMenuDisplay] = useState(0)

    function setMenuStatus() {
        setMenuDisplay((menuDisplay + 1) % 2)
    }

    function exit() {
        fetch('/api/client/signout', {
            method: 'POST'
        })
            .then(res => {
                if (res.status === 200) router.push('/')
            })
    }

    function showUserMenu() {
        if (menuDisplay === 0) return (null)

        return (
            <div className="flex flex-col items-center justify-start text-base font-medium text-gray-600 shadow-md w-64 absolute right-2 top-10 bg-white z-40 border-solid border-[1px] border-gray-200 rounded-md">
                <div onClick={() => router.push('/profile')} className="flex flex-row h-12 justify-center items-center w-full space-x-4 hover:bg-gray-100 cursor-pointer">
                    <div><FaRegUser size={17} /></div>
                    <div>Il tuo account</div>
                </div>
                <div onClick={exit} className="flex flex-row h-12 justify-center items-center w-full space-x-4 hover:bg-gray-100 cursor-pointer">
                    <div><MdExitToApp size={21} /></div>
                    <div>Esci dall'app</div>
                </div>
            </div>
        )
    }

    function renderDropIcon() {
        if(menuDisplay===0) return(<FaCaretDown size={15} />)
        return (<FaCaretUp size={15} />)
    }

    return (
        <div className="flex flex-row justify-center w-full relative">
            <div className="flex-grow flex flex-col items-start justify-center pl-6 h-12 text-2xl font-thin text-gray-700">
                {props.title}
            </div>
            <div onClick={setMenuStatus} className="select-none w-14 flex flex-row items-center justify-center text-gray-700 cursor-pointer">
                <div><FaUser size={21} /></div>
                <div>{renderDropIcon()}</div>
            </div>
            {showUserMenu()}
        </div>
    )
}