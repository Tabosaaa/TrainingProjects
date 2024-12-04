import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '3306',
  user: 'root',
  password: 'Incorreta@2011',
  database: 'Testes',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default {
    query: (text: string, params?: any[]) => pool.query(text, params),
  };