// Testes unitários do service: sem banco, sem arquivo, sem HTTP.
// Só é possível porque o service recebe as dependências por injeção.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EstrategiaPrioridade, EventoColeta, ObservadorColeta } from './coleta.contratos.ts';
import { ErroNaoEncontrado, ErroValidacao } from './coleta.erros.ts';
import { ColetaFactory } from './coleta.factory.ts';
import { ColetaService } from './coleta.service.ts';
import { ContadorEventos } from './eventos/contador-eventos.ts';
import { EventosColeta } from './eventos/eventos-coleta.ts';
import { ColetaRepositoryMemoria } from './persistencia/coleta-repository-memoria.ts';
import { PrioridadePorPacotes } from './prioridade/prioridade-por-pacotes.ts';
import { PrioridadePorTipoCliente } from './prioridade/prioridade-por-tipo-cliente.ts';

// "Espião": um observador de teste que só anota o que recebeu.
class ObservadorEspiao implements ObservadorColeta {
  recebidos: EventoColeta[] = [];
  notificar(evento: EventoColeta): void {
    this.recebidos.push(evento);
  }
}

function montarService(estrategia: EstrategiaPrioridade = new PrioridadePorPacotes()) {
  const repositorio = new ColetaRepositoryMemoria(); // fake no lugar do arquivo JSON
  const espiao = new ObservadorEspiao();
  const eventos = new EventosColeta();
  eventos.inscrever(espiao);
  const service = new ColetaService({ repositorio, fabrica: new ColetaFactory(), estrategia, eventos });
  return { service, repositorio, espiao, eventos };
}

const MERCADO = { cliente: 'Mercado Sol', tipoCliente: 'comum', regiao: 'Norte', quantidadePacotes: 10 };
const BANCO = { cliente: 'Banco Azul', tipoCliente: 'corporativo', regiao: 'Sul', quantidadePacotes: 2 };

test('cadastrar salva a coleta e notifica os observadores', async () => {
  const { service, repositorio, espiao } = montarService();

  const coleta = await service.cadastrar(MERCADO);

  assert.equal(coleta.status, 'pendente');
  assert.deepEqual(await repositorio.buscarPorId(coleta.id), coleta);
  assert.deepEqual(espiao.recebidos, [{ tipo: 'coleta.criada', coleta }]);
});

test('trocar a estratégia muda a ordem da fila sem alterar o service', async () => {
  const porPacotes = montarService(new PrioridadePorPacotes()).service;
  await porPacotes.cadastrar(MERCADO);
  await porPacotes.cadastrar(BANCO);

  const porCliente = montarService(new PrioridadePorTipoCliente()).service;
  await porCliente.cadastrar(MERCADO);
  await porCliente.cadastrar(BANCO);

  assert.equal((await porPacotes.listar())[0].cliente, 'Mercado Sol'); // 10 pacotes > 2
  assert.equal((await porCliente.listar())[0].cliente, 'Banco Azul'); // corporativo > comum
});

test('aceita qualquer estratégia que cumpra o contrato', async () => {
  const sempreCem: EstrategiaPrioridade = { nome: 'fixa', calcular: () => 100 };
  const { service } = montarService(sempreCem);

  const coleta = await service.cadastrar(MERCADO);

  assert.equal(coleta.prioridade, 100);
});

test('listar aplica filtros', async () => {
  const { service } = montarService();
  await service.cadastrar(MERCADO);
  await service.cadastrar(BANCO);

  const doSul = await service.listar({ regiao: 'Sul' });

  assert.deepEqual(doSul.map((c) => c.cliente), ['Banco Azul']);
});

test('atualizarStatus salva o novo status e publica o status anterior', async () => {
  const { service, espiao } = montarService();
  const criada = await service.cadastrar(MERCADO);

  const atualizada = await service.atualizarStatus(criada.id, 'em_rota');

  assert.equal(atualizada.status, 'em_rota');
  assert.equal((await service.buscar(criada.id)).status, 'em_rota');
  assert.deepEqual(espiao.recebidos.at(-1), {
    tipo: 'coleta.status_atualizado',
    coleta: atualizada,
    statusAnterior: 'pendente',
  });
});

test('atualizarStatus rejeita status inválido e coleta inexistente', async () => {
  const { service, espiao } = montarService();
  const criada = await service.cadastrar(MERCADO);

  await assert.rejects(service.atualizarStatus(criada.id, 'voando'), ErroValidacao);
  await assert.rejects(service.atualizarStatus('nao-existe', 'coletada'), ErroNaoEncontrado);
  assert.equal(espiao.recebidos.length, 1); // só o evento de criação
});

test('cadastro inválido não salva nem notifica', async () => {
  const { service, repositorio, espiao } = montarService();

  await assert.rejects(service.cadastrar({ ...MERCADO, quantidadePacotes: 0 }), ErroValidacao);

  assert.equal((await repositorio.listar()).length, 0);
  assert.equal(espiao.recebidos.length, 0);
});

test('deletar remove e falha se a coleta não existe', async () => {
  const { service } = montarService();
  const criada = await service.cadastrar(MERCADO);

  await service.deletar(criada.id);

  await assert.rejects(service.buscar(criada.id), ErroNaoEncontrado);
  await assert.rejects(service.deletar(criada.id), ErroNaoEncontrado);
});

test('resumo conta por status e soma pacotes', async () => {
  const { service } = montarService();
  const mercado = await service.cadastrar(MERCADO);
  await service.cadastrar(BANCO);
  await service.atualizarStatus(mercado.id, 'coletada');

  assert.deepEqual(await service.resumo(), {
    total: 2,
    totalPacotes: 12,
    porStatus: { pendente: 1, em_rota: 0, coletada: 1, cancelada: 0 },
    estrategiaPrioridade: 'pacotes',
  });
});

test('um observador com erro não impede os outros nem a operação', async () => {
  const { service, eventos } = montarService();
  const contador = new ContadorEventos();
  eventos.inscrever({ notificar: () => { throw new Error('falhei'); } });
  eventos.inscrever(contador);
  const erroOriginal = console.error;
  console.error = () => {}; // silencia o log esperado do erro

  try {
    await service.cadastrar(MERCADO);
  } finally {
    console.error = erroOriginal;
  }

  assert.equal(contador.total('coleta.criada'), 1);
});
