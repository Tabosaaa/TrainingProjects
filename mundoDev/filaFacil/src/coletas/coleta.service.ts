// SERVICE: coordena o fluxo. Não sabe COMO salvar, COMO priorizar nem QUEM é notificado.
// Recebe tudo pronto no construtor (Dependency Injection) — nenhum `new` aqui dentro.

import { ehStatusValido, STATUS_COLETA, type Coleta, type FiltroColeta, type StatusColeta } from './coleta.model.ts';
import type { ColetaRepository, EstrategiaPrioridade } from './coleta.contratos.ts';
import { ErroNaoEncontrado, ErroValidacao } from './coleta.erros.ts';
import type { ColetaFactory } from './coleta.factory.ts';
import type { EventosColeta } from './eventos/eventos-coleta.ts';

export interface ResumoOperacional {
  total: number;
  totalPacotes: number;
  porStatus: Record<StatusColeta, number>;
  estrategiaPrioridade: string;
}

export interface DependenciasColetaService {
  repositorio: ColetaRepository;
  fabrica: ColetaFactory;
  estrategia: EstrategiaPrioridade;
  eventos: EventosColeta;
}

export class ColetaService {
  private readonly deps: DependenciasColetaService;

  constructor(deps: DependenciasColetaService) {
    this.deps = deps;
  }

  async cadastrar(entrada: unknown): Promise<Coleta> {
    const coleta = this.deps.fabrica.criar(entrada, this.deps.estrategia);
    await this.deps.repositorio.salvar(coleta);
    this.deps.eventos.publicar({ tipo: 'coleta.criada', coleta });
    return coleta;
  }

  // Mais urgentes primeiro.
  async listar(filtro?: FiltroColeta): Promise<Coleta[]> {
    const coletas = await this.deps.repositorio.listar(filtro);
    return coletas.sort((a, b) => b.prioridade - a.prioridade);
  }

  async buscar(id: string): Promise<Coleta> {
    const coleta = await this.deps.repositorio.buscarPorId(id);
    if (!coleta) throw new ErroNaoEncontrado(`Coleta ${id} não encontrada`);
    return coleta;
  }

  async atualizarStatus(id: string, status: unknown): Promise<Coleta> {
    if (!ehStatusValido(status)) {
      throw new ErroValidacao(`status deve ser um de: ${STATUS_COLETA.join(', ')}`);
    }
    const atual = await this.buscar(id);
    const atualizada: Coleta = { ...atual, status }; // cópia nova, sem mutar a original
    await this.deps.repositorio.salvar(atualizada);
    this.deps.eventos.publicar({ tipo: 'coleta.status_atualizado', coleta: atualizada, statusAnterior: atual.status });
    return atualizada;
  }

  async deletar(id: string): Promise<void> {
    const removida = await this.deps.repositorio.remover(id);
    if (!removida) throw new ErroNaoEncontrado(`Coleta ${id} não encontrada`);
  }

  async resumo(): Promise<ResumoOperacional> {
    const coletas = await this.deps.repositorio.listar();
    const porStatus = Object.fromEntries(STATUS_COLETA.map((s) => [s, 0])) as Record<StatusColeta, number>;
    for (const coleta of coletas) porStatus[coleta.status]++;

    return {
      total: coletas.length,
      totalPacotes: coletas.reduce((soma, c) => soma + c.quantidadePacotes, 0),
      porStatus,
      estrategiaPrioridade: this.deps.estrategia.nome,
    };
  }
}
