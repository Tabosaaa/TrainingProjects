// OBSERVER: avisa o motorista quando a coleta sai para a rua.

import type { EventoColeta, ObservadorColeta } from '../coleta.contratos.ts';

export class NotificacaoRota implements ObservadorColeta {
  notificar(evento: EventoColeta): void {
    if (evento.tipo === 'coleta.status_atualizado' && evento.coleta.status === 'em_rota') {
      console.log(`[rota] motorista avisado: coleta ${evento.coleta.id} na região ${evento.coleta.regiao}`);
    }
  }
}
