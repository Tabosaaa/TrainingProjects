import { Request, Response, RequestHandler } from "express";
import { deleteUserById, updateUserById,getUsers, getUserById } from "../models/userModel";

export const getAllUsers: RequestHandler = async (req: Request, res: Response) => {
    try {
        const users = await getUsers();
        res.status(200).json(users).end();
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
}


export const deleteUser: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.sendStatus(400);
            return;
        }
        const deletedUser = await deleteUserById(id);
        res.status(200).json(deletedUser).end();
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
}


export const updateUser: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        if (!username) {
            res.sendStatus(400);
            return;
        }
        const user = await getUserById(id);
        user.username = username;

        await user.save();
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
}
