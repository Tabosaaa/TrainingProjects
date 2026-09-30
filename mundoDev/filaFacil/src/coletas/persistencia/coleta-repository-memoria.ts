// REPOSITORY em memória. É o "fake" dos testes: rápido, sem disco, começa vazio.
// Também é a base do repositório JSON, que só acrescenta a gravação em arquivo.

import type { Coleta, FiltroColeta } from '../coleta.model.ts';
import type { ColetaRepository } from '../coleta.contratos.ts';

function atendeFiltro(coleta: Coleta, filtro: FiltroColeta = {}): boolean {
  return (
    (!filtro.status || coleta.status === filtro.status) &&
    (!filtro.regiao || coleta.regiao === filtro.regiao) &&
    (!filtro.tipoCliente || coleta.tipoCliente === filtro.tipoCliente)
  );
}

export class ColetaRepositoryMemoria implements ColetaRepository {
  private readonly coletas = new Map<string, Coleta>();

  async salvar(coleta: Coleta): Promise<void> {
    this.coletas.set(coleta.id, { ...coleta }); // cópia: quem chamou não altera o "banco" por referência
  }

  async buscarPorId(id: string): Promise<Coleta | undefined> {
    const coleta = this.coletas.get(id);
    return coleta && { ...coleta };
  }

  async listar(filtro?: FiltroColeta): Promise<Coleta[]> {
    return [...this.coletas.values()].filter((c) => atendeFiltro(c, filtro)).map((c) => ({ ...c }));
  }

  async remover(id: string): Promise<boolean> {
    return this.coletas.delete(id);
  }
}
