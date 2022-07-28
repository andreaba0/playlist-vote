function renew() {
    fetch('/api/client/session/renew', {
        method: 'POST'
    })
        .then(res => {
            console.log(res.status)
            return res.text()
        })
        .then(data => console.log(data))
        .catch(e => console.log(e.message))
}

function main() {
    if (typeof window === 'undefined') return
    renew()
    setInterval(renew, 1000 * 60 * 9)
}

main()