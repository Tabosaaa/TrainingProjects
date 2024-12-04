import { Router } from "express";
import clienteController from '../controllers/clientController';

const clientRouter = Router();

clientRouter.get('/', clienteController.getAllClients);
clientRouter.post('/', clienteController.createNewClient);

export default clientRouter;
