import  { deleteUser, getAllUsers, updateUser }  from '../controller/usersController';
import { Router } from "express";
import { isAuthenticated, isOwner } from '../middlewares/authenticationMiddleware';

const usersRouter = Router();

usersRouter.get('/', isAuthenticated ,getAllUsers);
usersRouter.delete('/delete/:id', isAuthenticated, isOwner ,deleteUser);
usersRouter.patch('/update/:id', isAuthenticated, isOwner ,updateUser);

export default usersRouter; 