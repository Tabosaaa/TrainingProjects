import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Coleta } from '../coleta.model.ts';
import { ColetaRepositoryJson } from './coleta-repository-json.ts';

const COLETA: Coleta = {
  id: 'c1',
  cliente: 'Loja X',
  tipoCliente: 'comum',
  regiao: 'Norte',
  quantidadePacotes: 1,
  status: 'pendente',
  prioridade: 1,
  criadaEm: '2026-01-01T00:00:00.000Z',
};

test('repositório em arquivo mantém os dados entre instâncias (restart)', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'filafacil-'));
  const caminho = join(pasta, 'sub', 'coletas.json');
  try {
    await new ColetaRepositoryJson(caminho).salvar(COLETA);

    const reaberto = new ColetaRepositoryJson(caminho);
    assert.deepEqual(await reaberto.buscarPorId('c1'), COLETA);
    assert.equal(await reaberto.remover('c1'), true);
    assert.deepEqual(await new ColetaRepositoryJson(caminho).listar(), []);
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});
