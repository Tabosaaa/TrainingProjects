/**
 * Express Application Configuration
 * 
 * Configura middlewares e rotas da aplicação.
 */

const express = require('express');
const cors = require('cors');

// Routes
const healthRoutes = require('./routes/healthRoutes');
const taskRoutes = require('./routes/taskRoutes');
const syncRoutes = require('./routes/syncRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sync', syncRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

module.exports = app;





