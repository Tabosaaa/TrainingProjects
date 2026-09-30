// OBSERVER — o "sujeito": guarda a lista de observadores e avisa todos.
// O service só diz "aconteceu X" (uma linha). Quem reage fica nos outros arquivos desta pasta.

import type { EventoColeta, ObservadorColeta } from '../coleta.contratos.ts';

export class EventosColeta {
  private readonly observadores: ObservadorColeta[] = [];

  inscrever(observador: ObservadorColeta): void {
    this.observadores.push(observador);
  }

  publicar(evento: EventoColeta): void {
    for (const observador of this.observadores) {
      try {
        observador.notificar(evento);
      } catch (erro) {
        // Um observador quebrado não pode derrubar a operação principal nem os outros.
        console.error(`[eventos] observador falhou em ${evento.tipo}:`, erro);
      }
    }
  }
}
