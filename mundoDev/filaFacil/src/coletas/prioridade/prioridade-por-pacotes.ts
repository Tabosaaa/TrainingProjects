// STRATEGY: prioriza quem tem mais pacotes.

import type { DadosNovaColeta } from '../coleta.model.ts';
import type { EstrategiaPrioridade } from '../coleta.contratos.ts';

export class PrioridadePorPacotes implements EstrategiaPrioridade {
  readonly nome = 'pacotes';

  calcular(dados: DadosNovaColeta): number {
    return dados.quantidadePacotes;
  }
}
