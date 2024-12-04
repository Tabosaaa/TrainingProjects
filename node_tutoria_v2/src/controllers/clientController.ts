import { Request, Response } from 'express';
import ClienteModel from '../models/ClienteModel';

const clienteController = {
    
  getAllClients: async (req: Request, res: Response): Promise<void> => {
    try {
      const clients = await ClienteModel.getAllClients();
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao obter lista de clientes.' });
    }
  },

  createNewClient: async (req: Request, res: Response): Promise<void> => {
    const { nome, cpf } = req.body;

    if (!nome || !cpf) {
      res.status(400).json({ error: 'Os campos "nome" e "cpf" são obrigatórios.' });
      return;
    }

    try {
      const newClient = await ClienteModel.createNewClient(nome, cpf);
      res.status(201).json(newClient);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar novo cliente.' });
    }
  },
};

export default clienteController;