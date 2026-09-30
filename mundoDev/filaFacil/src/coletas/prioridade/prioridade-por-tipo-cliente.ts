// STRATEGY: prioriza pelo tipo de cliente (corporativo > premium > comum).

import type { DadosNovaColeta, TipoCliente } from '../coleta.model.ts';
import type { EstrategiaPrioridade } from '../coleta.contratos.ts';

const PESO_POR_TIPO: Record<TipoCliente, number> = { comum: 1, premium: 2, corporativo: 3 };

export class PrioridadePorTipoCliente implements EstrategiaPrioridade {
  readonly nome = 'cliente';

  calcular(dados: DadosNovaColeta): number {
    return PESO_POR_TIPO[dados.tipoCliente];
  }
}
