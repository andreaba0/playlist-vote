import { useState } from "react"

function StackItem(props) {
    return (
        <div className="bg-white text-gray-700 font-bold text-sm px-4 py-1 rounded mt-4 ml-2 mr-2">{props.name}</div>
    )
}

export function Page(props) {

    return (
        <div>
            <div className="w-screen flex lg:flex-row flex-col-reverse overflow-x-hidden">
                <div className="lg:w-1/2 lg:items-end w-full lg:flex-shrink-0 flex flex-col items-center space-y-6 pb-20">
                    <div className="w-full max-w-xl bg-blue-500 text-white font-medium text-base box-border p-8 flex flex-col lg:items-end items-center">
                        <div>
                            Ebbene, questo progetto &egrave; giunto al termine
                        </div>
                        <div className="w-full flex flex-row lg:justify-end justify-center p-6 flex-wrap">
                            <StackItem name="Next.js" />
                            <StackItem name="React.js" />
                            <StackItem name="Redis" />
                            <StackItem name="PostgreSQL" />
                            <StackItem name="Typescript" />
                            <StackItem name="DigitalOcean" />
                            <StackItem name="Cloudflare" />
                            <StackItem name="Nginx" />
                            <StackItem name="Docker" />
                            <StackItem name="Bash script" />
                            <StackItem name="Ubuntu" />
                        </div>
                    </div>
                </div>
                <div className="lg:flex-grow lg:items-start w-full overflow-x-hidden flex flex-col items-center">
                    <div className="relative w-full max-w-xl flex flex-col items-center bg-white pb-20">
                        {props.menu}
                        <div className="w-full flex flex-col items-center">
                            {props.children}
                        </div>
                    </div>
                </div>
            </div>
            {props.head}
            {props.absoluteMenu}
        </div>
    )
}

export function AbsoluteMenu(props) {
    return (
        <div className="w-screen fixed z-10 bottom-0 right-0 flex flex-row justify-center items-center">
            <div className="lg:w-1/2 lg:block hidden">

            </div>
            <div className="flex-grow lg:items-start flex flex-col justify-center items-center">
                <div className="w-full max-w-xl relative">
                    <div onClick={props.onClick} className="flex w-14 h-14 items-center justify-center rounded-full cursor-pointer bg-emerald-500 text-white absolute bottom-4 right-4">
                        {props.icon}
                    </div>
                </div>
            </div>
        </div>
    )
}