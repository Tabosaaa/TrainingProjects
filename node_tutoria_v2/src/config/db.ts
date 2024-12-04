import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Incorreta@2011',
  database: 'Testes',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default {
  query: async (text: string, params?: any[]) => {
    const [results] = await pool.query(text, params);
    return results;
  },
};