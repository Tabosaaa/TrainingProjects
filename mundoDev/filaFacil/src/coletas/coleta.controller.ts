// CONTROLLER: traduz HTTP <-> service. Não tem regra de negócio.
// Também recebe o service por injeção (parâmetro da função).

import { Router, type ErrorRequestHandler, type Request } from 'express';
import { ehStatusValido, ehTipoClienteValido, type FiltroColeta } from './coleta.model.ts';
import { ErroNaoEncontrado, ErroValidacao } from './coleta.erros.ts';
import type { ColetaService } from './coleta.service.ts';

function lerFiltro(query: Request['query']): FiltroColeta {
  const { status, regiao, tipoCliente } = query;
  if (status !== undefined && !ehStatusValido(status)) throw new ErroValidacao('filtro status inválido');
  if (tipoCliente !== undefined && !ehTipoClienteValido(tipoCliente)) throw new ErroValidacao('filtro tipoCliente inválido');
  return { status, tipoCliente, regiao: typeof regiao === 'string' ? regiao : undefined };
}

export function criarRotasColetas(service: ColetaService): Router {
  const rotas = Router();

  rotas.post('/', async (req, res) => {
    res.status(201).json(await service.cadastrar(req.body));
  });

  rotas.get('/', async (req, res) => {
    res.json(await service.listar(lerFiltro(req.query)));
  });

  // Declarada antes de "/:id", senão "resumo" seria lido como um id.
  rotas.get('/resumo', async (_req, res) => {
    res.json(await service.resumo());
  });

  rotas.get('/:id', async (req, res) => {
    res.json(await service.buscar(req.params.id));
  });

  rotas.patch('/:id/status', async (req, res) => {
    res.json(await service.atualizarStatus(req.params.id, req.body?.status));
  });

  rotas.delete('/:id', async (req, res) => {
    await service.deletar(req.params.id);
    res.status(204).end();
  });

  return rotas;
}

// Erros do domínio viram status HTTP aqui — o service nunca fala "400" ou "404".
export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof ErroValidacao) return void res.status(400).json({ erro: erro.message });
  if (erro instanceof ErroNaoEncontrado) return void res.status(404).json({ erro: erro.message });
  if (erro instanceof SyntaxError) return void res.status(400).json({ erro: 'JSON inválido' });
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno' });
};
