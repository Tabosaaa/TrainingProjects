// OBSERVER: registra todo evento de coleta no log.

import type { EventoColeta, ObservadorColeta } from '../coleta.contratos.ts';

export class LogOperacional implements ObservadorColeta {
  notificar(evento: EventoColeta): void {
    const { coleta } = evento;
    console.log(`[log] ${evento.tipo} id=${coleta.id} cliente=${coleta.cliente} status=${coleta.status}`);
  }
}
