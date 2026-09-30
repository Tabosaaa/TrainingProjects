// Contratos (interfaces): só existem onde há VARIAÇÃO real de comportamento.
//  - Repository: arquivo JSON em produção, memória nos testes.
//  - Estratégia de prioridade: várias regras intercambiáveis.
//  - Observador: vários reagem ao mesmo evento, cada um do seu jeito.
// A Factory e o publicador de eventos NÃO têm interface: só existe uma versão deles.

import type { Coleta, DadosNovaColeta, FiltroColeta } from './coleta.model.ts';

export interface ColetaRepository {
  salvar(coleta: Coleta): Promise<void>; // insere ou substitui pelo id
  buscarPorId(id: string): Promise<Coleta | undefined>;
  listar(filtro?: FiltroColeta): Promise<Coleta[]>;
  remover(id: string): Promise<boolean>; // false se não existia
}

export interface EstrategiaPrioridade {
  readonly nome: string;
  calcular(dados: DadosNovaColeta): number; // maior número = mais urgente
}

export type EventoColeta =
  | { tipo: 'coleta.criada'; coleta: Coleta }
  | { tipo: 'coleta.status_atualizado'; coleta: Coleta; statusAnterior: Coleta['status'] };

export interface ObservadorColeta {
  notificar(evento: EventoColeta): void;
}
