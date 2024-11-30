import {NextFunction, Request,Response} from 'express';
import {get,merge} from 'lodash';
import { getUserBySessionToken } from '../models/userModel';


export const isAuthenticated = async (req:Request, res:Response, next: NextFunction ) => {
    try {
        const sessionToken = req.cookies['sessionToken'];

        if (!sessionToken) {
            res.sendStatus(403);
            return;
        }

        const existingUser = await getUserBySessionToken(sessionToken);

        if (!existingUser) {
            res.sendStatus(403);
            return;
        }

        merge(req, { identity: existingUser });
        next();
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
}

export const isOwner = async (req:Request, res:Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const currentUserId = get(req, 'identity._id') as string;

        if (!currentUserId || !id) {
            res.sendStatus(400);
            return;
        }

        if (currentUserId.toString() !== id) {
            res.sendStatus(403);
            return;
        }

        next();
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
}