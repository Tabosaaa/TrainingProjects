
import {RequestHandler,Request, Response,} from 'express';  
import {getUserByEmail, createUser} from '../models/userModel';  
import { random, authentication } from '../helpers/authenticationHelper';

export const register: RequestHandler = async (req: Request, res: Response) => {
    try{
        const {email, password, username} = req.body;
        if(!email || !password || !username){
            res.sendStatus(400);
            return;
        }

        const existingUser = await getUserByEmail(email);

        if(existingUser){
            res.sendStatus(409);
            return;
        }

        const salt = random();

        const user = await createUser({
            email,
            username,
            authentication:{
                salt,
                password: authentication(salt,password)
            },
        })

        res.status(200).json(user).end();
        return;

    }catch(error){
        console.log(error)
        res.sendStatus(400);
        return;
    }
}

export const login: RequestHandler = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            res.sendStatus(400);
            return;
        }

        const user = await getUserByEmail(email).select('+authentication.salt +authentication.password');

        if (!user) {
            res.sendStatus(404);
            return;
        }

        if (user.authentication.password !== authentication(user.authentication.salt, password)) {
            res.sendStatus(401);
            return;
        }

        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());
        await user.save();

        res.cookie('sessionToken', user.authentication.sessionToken, { domain: 'localhost', path: '/' });

        res.status(200).json(user).end();
        return;
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
}