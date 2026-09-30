// Ponto de entrada: lê a configuração do ambiente e sobe o HTTP.
// Não conhece as peças internas de coletas; só pluga as rotas que o módulo entrega.

import express from 'express';
import { tratarErros } from './coletas/coleta.controller.ts';
import { criarModuloColetas } from './coletas/coleta.module.ts';

const coletas = criarModuloColetas({
  estrategia: process.env.ESTRATEGIA ?? 'pacotes',
  arquivoDados: process.env.ARQUIVO_DADOS ?? 'data/coletas.json',
});

const app = express();
app.use(express.json());
app.use('/coletas', coletas.rotas);
app.use(tratarErros);

const porta = Number(process.env.PORT ?? 3000);
app.listen(porta, () => {
  console.log(`FilaFácil rodando em http://localhost:${porta} (prioridade: ${coletas.estrategia.nome})`);
});
