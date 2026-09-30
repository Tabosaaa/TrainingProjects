// OBSERVER: conta quantos eventos de cada tipo aconteceram (em memória).

import type { EventoColeta, ObservadorColeta } from '../coleta.contratos.ts';

export class ContadorEventos implements ObservadorColeta {
  private readonly contagem = new Map<EventoColeta['tipo'], number>();

  notificar(evento: EventoColeta): void {
    this.contagem.set(evento.tipo, this.total(evento.tipo) + 1);
  }

  total(tipo: EventoColeta['tipo']): number {
    return this.contagem.get(tipo) ?? 0;
  }
}
