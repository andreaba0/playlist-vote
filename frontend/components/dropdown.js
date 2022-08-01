import { useState } from "react"
import { FaCaretDown, FaCaretUp } from "react-icons/fa"

export function DropDownMenu(props) {
    const motd = props.value
    const options = props.options
    const onChange = props.onChange || null
    var [display, setDisplay] = useState(0)
    var [selected, setSelected] = useState(props.default || options[0].key)

    function changeDisplayState() {
        setDisplay((display + 1) % 2)
    }

    function displayBox() {
        if (display === 0) return (null)
        var res = []
        for (var i = 0; i < options.length; i++) {
            if (selected === options[i].key) continue
            res.push(
                <div key={options[i].key} onClick={() => {
                    setSelected(options[i].key)
                    setDisplay(0)
                    if (onChange !== null) onChange(options[i].key)
                }} className="w-full py-2 text-center">
                    {options[i].text}
                </div>
            )
        }
        return (
            <div className="w-full absolute z-10 top-10 right-0 flex flex-col items-center rounded-md border-solid border-gray-200 border-[1px] bg-white shadow-md">
                {res}
            </div>
        )

        return (
            <div className="w-full absolute z-10 top-10 right-0 flex flex-col items-center rounded-md border-solid border-gray-200 border-[1px] bg-white shadow-md">
                {(display !== 'full') ? (
                    <div onClick={changeDisplayState} className="w-full py-2 text-center">
                        completa
                    </div>
                ) : (null)}
                {(display !== 'simplified') ? (
                    <div onClick={changeDisplayState} className="w-full py-2 text-center">
                        semplificata
                    </div>
                ) : (null)}
            </div>
        )
    }

    function parseArrow() {
        if (display === 1) return <FaCaretUp size={15} />
        return <FaCaretDown size={15} />
    }

    function parseText() {
        for (var i = 0; i < options.length; i++) {
            if (options[i].key === selected) return options[i].text
        }
        return ''
    }

    return (
        <div
            onClick={changeDisplayState}
            className="flex select-none cursor-pointer space-x-4 flex-row w-full h-9 rounded border-gray-200 border-solid border-[1px] relative items-center justify-center font-medium text-base text-gray-700"
        >
            <div>
                {motd}{' '}{parseText()}
            </div>
            <div>
                {parseArrow()}
            </div>
            {displayBox()}
        </div>
    )
}