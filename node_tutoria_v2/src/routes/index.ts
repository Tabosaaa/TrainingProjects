import { Router } from "express";
import clientRouter from "./clientRouter";

const rootRouter = Router();

rootRouter.use('/client', clientRouter);

export default rootRouter;