// Modelo do domínio: o que é uma coleta.
// Nada aqui sabe de HTTP, arquivo ou banco.

export const STATUS_COLETA = ['pendente', 'em_rota', 'coletada', 'cancelada'] as const;
export const TIPOS_CLIENTE = ['comum', 'premium', 'corporativo'] as const;

export type StatusColeta = (typeof STATUS_COLETA)[number];
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];

export interface Coleta {
  id: string;
  cliente: string;
  tipoCliente: TipoCliente;
  regiao: string;
  quantidadePacotes: number;
  status: StatusColeta;
  prioridade: number;
  criadaEm: string; // ISO 8601 — string para sobreviver ao JSON sem conversão
}

// Dados que o usuário informa. O resto (id, status, prioridade, data) a Factory preenche.
export type DadosNovaColeta = Pick<Coleta, 'cliente' | 'tipoCliente' | 'regiao' | 'quantidadePacotes'>;

export interface FiltroColeta {
  status?: StatusColeta;
  regiao?: string;
  tipoCliente?: TipoCliente;
}

export function ehStatusValido(valor: unknown): valor is StatusColeta {
  return STATUS_COLETA.includes(valor as StatusColeta);
}

export function ehTipoClienteValido(valor: unknown): valor is TipoCliente {
  return TIPOS_CLIENTE.includes(valor as TipoCliente);
}
