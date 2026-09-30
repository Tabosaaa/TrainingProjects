import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroValidacao } from './coleta.erros.ts';
import { ColetaFactory } from './coleta.factory.ts';
import type { EstrategiaPrioridade } from './coleta.contratos.ts';

const fabrica = new ColetaFactory();
const prioridadeSete: EstrategiaPrioridade = { nome: 'teste', calcular: () => 7 };
const VALIDO = { cliente: '  Loja X ', tipoCliente: 'premium', regiao: 'Centro', quantidadePacotes: 3 };

test('cria coleta com id, status inicial, data e prioridade', () => {
  const coleta = fabrica.criar(VALIDO, prioridadeSete);

  assert.match(coleta.id, /^[0-9a-f-]{36}$/);
  assert.equal(coleta.status, 'pendente');
  assert.equal(coleta.prioridade, 7);
  assert.equal(coleta.cliente, 'Loja X'); // espaços removidos
  assert.ok(!Number.isNaN(Date.parse(coleta.criadaEm)));
});

test('rejeita dados inválidos', () => {
  const invalidos = [
    null,
    'texto',
    { ...VALIDO, cliente: '' },
    { ...VALIDO, tipoCliente: 'vip' },
    { ...VALIDO, regiao: undefined },
    { ...VALIDO, quantidadePacotes: 0 },
    { ...VALIDO, quantidadePacotes: 2.5 },
    { ...VALIDO, quantidadePacotes: '3' },
  ];
  for (const entrada of invalidos) {
    assert.throws(() => fabrica.criar(entrada, prioridadeSete), ErroValidacao, JSON.stringify(entrada));
  }
});
