import { useState } from "react"

export function Page(props) {

    return (
        <div>
            <div className="w-screen overflow-x-hidden flex flex-col items-center">
                <div className="w-full max-w-xl flex flex-col items-center bg-white pb-20">
                    {props.menu}
                    <div className="w-full flex flex-col items-center">
                        {props.children}
                    </div>
                </div>
            </div>
            {props.absoluteMenu}
        </div>
    )
}