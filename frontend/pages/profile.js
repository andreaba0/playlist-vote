import { parseCookie, parseUserSession } from "../modules/supply"
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
            destination: '/signin?redirect=profile'
        }
    }
    const session = parseUserSession(userAccessCookie)

    const res = await fetch(`${process.env.DOMAIN}/api/auth/status`, {
        method: 'POST',
        body: JSON.stringify({ session: userAccessCookie })
    })

    if (res.status !== 200) {
        context.res.setHeader('set-cookie', 'session=;path=/;httpOnly')
        return {
            redirect: {
                permanent: false,
                destination: '/signin?redirect=profile'
            }
        }
    }

    return {
        props: {}
    }
}

export default function ProfilePage() {
    return (
        <Page
            menu={
                <Menu title="Il tuo profilo" />
            } head={
                <HeadComponent title="Account" />
            }
        >
            <div className="w-full flex flex-col items-center space-y-12">
                <div className="w-full flex flex-col items-center py-6 space-y-4">
                    <div className="text-base font-medium text-gray-700">
                        Vuoi cambiare password?
                    </div>
                    <div className="text-center px-3 py-2 underline cursor-pointer select-none text-blue-600 text-base font-bold">
                        Cambiala ora
                    </div>
                </div>

                <div className="w-full flex flex-col items-center py-6 space-y-4">
                    <div className="text-base font-medium text-gray-700">
                        Se vuoi visionare le tue sessioni attive
                    </div>
                    <div className="text-center px-3 py-2 underline cursor-pointer select-none text-blue-600 text-base font-bold">
                        visualizza sessioni attive
                    </div>
                </div>
            </div>
        </Page>
    )
}