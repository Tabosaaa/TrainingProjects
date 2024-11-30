import { Router } from 'express';
import { login, register } from '../controller/authenticationController';

const authenticationRouter: Router = Router();

authenticationRouter.post('/register', register);
authenticationRouter.post('/login', login);

export default authenticationRouter;