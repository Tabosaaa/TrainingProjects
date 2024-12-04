import db from '../config/db';

interface Client {
  id?: number; // O campo `id` pode ser opcional
  nome: string;
  cpf: string;
}

const Cliente = {
  getAllClients: async (): Promise<Client[]> => {
    try {
      const query = 'SELECT * FROM Cliente';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  createNewClient: async (nome: string, cpf: string): Promise<Client> => {
    try {
      const query = 'INSERT INTO Cliente (nome, cpf) VALUES ($1, $2) RETURNING *';
      const values = [nome, cpf];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },
};

export default Cliente;