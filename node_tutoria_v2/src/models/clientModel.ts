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
      const result = await db.query(query); // `result` agora é um array de objetos.
      return result as Client[]; // Fazemos a tipagem explícita.
    } catch (error) {
      throw error; // Aqui você pode adicionar logs para facilitar o debug.
    }
  },

  createNewClient: async (nome: string, cpf: string): Promise<Client> => {
    try {
      const query = 'INSERT INTO Cliente (nome, cpf) VALUES (?, ?)'; // Troquei para '?' (MySQL usa isso para parâmetros).
      const values = [nome, cpf];
      const result: any = await db.query(query, values);

      // O retorno da query é uma estrutura com o ID do registro inserido:
      const newClient: Client = { id: result.insertId, nome, cpf }; // Use `insertId` para obter o ID do registro inserido.
      return newClient;
    } catch (error) {
      throw error;
    }
  },
};

export default Cliente;