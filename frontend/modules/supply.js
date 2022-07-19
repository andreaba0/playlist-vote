export function parseCookie(string) {
    const cookiesHeader = string || ''
    const cookiesParts = cookiesHeader.split('; ')
    const cookies = {}
    for (var i = 0; i < cookiesParts.length; i++) {
        var temp = cookiesParts[i].split('=')
        cookies[temp[0]] = temp[1]
    }
    return cookies
}

export function parseUserSession(session) {
    const user_uuid = session.split('.')[0]
    const session_uuid = session.split('.')[1]
    const sessionCode = session.split('.')[2]
    return  {
        user_uuid: user_uuid || '',
        session_uuid: session_uuid || '',
        code: sessionCode || ''
    }
}