import { Request, Response } from 'express';
import ClienteModel from '../models/clientModel';

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

  excludeClient: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'O campo "id" é obrigatório.' });
      return;
    }

    try {
      await ClienteModel.excludeClient(Number(id));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir cliente.' });
    }
  }
};

export default clienteController;