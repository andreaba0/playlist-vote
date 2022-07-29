import { Request } from "express";

type UserSession = {
    user_uuid: string
    session_uuid: string
    session_data: string
}

export interface CustomRequest extends Request {
    _user: UserSession
}