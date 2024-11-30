import { Router } from "express";
import authenticationRouter from "./authenticationRouter";
import usersRouter from "./usersRouter";

const rootRouter: Router = Router();


rootRouter.use('/auth', authenticationRouter);
rootRouter.use('/users', usersRouter);


export default rootRouter;