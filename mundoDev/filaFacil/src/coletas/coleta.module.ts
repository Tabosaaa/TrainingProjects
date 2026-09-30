// COMPOSITION ROOT do domínio de coletas: o único lugar que faz `new` das peças concretas e as conecta.
// Trocar a regra de prioridade, a persistência ou os observadores = mudar só este arquivo.
// Quem está de fora (server.ts) só recebe as rotas prontas e não conhece nada daqui de dentro.

import type { Router } from 'express';
import type { EstrategiaPrioridade } from './coleta.contratos.ts';
import { criarRotasColetas } from './coleta.controller.ts';
import { ColetaFactory } from './coleta.factory.ts';
import { ColetaService } from './coleta.service.ts';
import { ContadorEventos } from './eventos/contador-eventos.ts';
import { EventosColeta } from './eventos/eventos-coleta.ts';
import { LogOperacional } from './eventos/log-operacional.ts';
import { NotificacaoRota } from './eventos/notificacao-rota.ts';
import { ColetaRepositoryJson } from './persistencia/coleta-repository-json.ts';
import { PrioridadePorPacotes } from './prioridade/prioridade-por-pacotes.ts';
import { PrioridadePorTipoCliente } from './prioridade/prioridade-por-tipo-cliente.ts';

const ESTRATEGIAS: Record<string, EstrategiaPrioridade> = {
  pacotes: new PrioridadePorPacotes(),
  cliente: new PrioridadePorTipoCliente(),
};

export interface ConfigColetas {
  estrategia: string; // nome de uma chave de ESTRATEGIAS
  arquivoDados: string;
}

export function criarModuloColetas(config: ConfigColetas): { rotas: Router; estrategia: EstrategiaPrioridade } {
  const estrategia = ESTRATEGIAS[config.estrategia];
  if (!estrategia) {
    throw new Error(`Estratégia inválida: "${config.estrategia}". Use: ${Object.keys(ESTRATEGIAS).join(', ')}`);
  }

  const eventos = new EventosColeta();
  eventos.inscrever(new LogOperacional());
  eventos.inscrever(new NotificacaoRota());
  eventos.inscrever(new ContadorEventos());

  const service = new ColetaService({
    repositorio: new ColetaRepositoryJson(config.arquivoDados),
    fabrica: new ColetaFactory(),
    estrategia,
    eventos,
  });

  return { rotas: criarRotasColetas(service), estrategia };
}
