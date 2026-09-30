// FACTORY: o ÚNICO lugar que sabe montar uma coleta válida.
// Valida os dados obrigatórios e preenche id, status inicial, data e prioridade.
// Ninguém mais no sistema escreve `{ status: 'pendente', criadaEm: ... }` na mão.

import { randomUUID } from 'node:crypto';
import { ehTipoClienteValido, type Coleta, type DadosNovaColeta } from './coleta.model.ts';
import type { EstrategiaPrioridade } from './coleta.contratos.ts';
import { ErroValidacao } from './coleta.erros.ts';

export class ColetaFactory {
  // `unknown` porque o dado vem de fora (HTTP) — não confiamos até validar.
  criar(entrada: unknown, estrategia: EstrategiaPrioridade): Coleta {
    const dados = this.validar(entrada);
    return {
      id: randomUUID(),
      ...dados,
      status: 'pendente',
      prioridade: estrategia.calcular(dados),
      criadaEm: new Date().toISOString(),
    };
  }

  private validar(entrada: unknown): DadosNovaColeta {
    if (typeof entrada !== 'object' || entrada === null) {
      throw new ErroValidacao('Corpo da coleta deve ser um objeto');
    }
    const { cliente, tipoCliente, regiao, quantidadePacotes } = entrada as Record<string, unknown>;

    if (typeof cliente !== 'string' || cliente.trim() === '') {
      throw new ErroValidacao('cliente é obrigatório');
    }
    if (!ehTipoClienteValido(tipoCliente)) {
      throw new ErroValidacao('tipoCliente deve ser comum, premium ou corporativo');
    }
    if (typeof regiao !== 'string' || regiao.trim() === '') {
      throw new ErroValidacao('regiao é obrigatória');
    }
    if (!Number.isInteger(quantidadePacotes) || (quantidadePacotes as number) <= 0) {
      throw new ErroValidacao('quantidadePacotes deve ser um inteiro maior que zero');
    }

    return {
      cliente: cliente.trim(),
      tipoCliente,
      regiao: regiao.trim(),
      quantidadePacotes: quantidadePacotes as number,
    };
  }
}
