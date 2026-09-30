// REPOSITORY de produção: persiste num arquivo JSON para os dados sobreviverem ao restart.
// ponytail: regrava o arquivo inteiro a cada mudança — ok para centenas de coletas; troque por um banco
// (novo repository implementando o mesmo contrato) quando o volume crescer.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Coleta, FiltroColeta } from '../coleta.model.ts';
import type { ColetaRepository } from '../coleta.contratos.ts';
import { ColetaRepositoryMemoria } from './coleta-repository-memoria.ts';

export class ColetaRepositoryJson implements ColetaRepository {
  private readonly caminho: string;
  private readonly memoria = new ColetaRepositoryMemoria();
  private carregado = false;
  private fila: Promise<void> = Promise.resolve(); // serializa escritas para não corromper o arquivo

  constructor(caminho: string) {
    this.caminho = caminho;
  }

  async salvar(coleta: Coleta): Promise<void> {
    await this.carregar();
    await this.memoria.salvar(coleta);
    await this.persistir();
  }

  async buscarPorId(id: string): Promise<Coleta | undefined> {
    await this.carregar();
    return this.memoria.buscarPorId(id);
  }

  async listar(filtro?: FiltroColeta): Promise<Coleta[]> {
    await this.carregar();
    return this.memoria.listar(filtro);
  }

  async remover(id: string): Promise<boolean> {
    await this.carregar();
    const removida = await this.memoria.remover(id);
    if (removida) await this.persistir();
    return removida;
  }

  private async carregar(): Promise<void> {
    if (this.carregado) return;
    try {
      const coletas: Coleta[] = JSON.parse(await readFile(this.caminho, 'utf8'));
      for (const coleta of coletas) await this.memoria.salvar(coleta);
    } catch (erro) {
      // Arquivo ainda não existe = começa vazio. Qualquer outro erro (JSON corrompido) sobe.
      if ((erro as NodeJS.ErrnoException).code !== 'ENOENT') throw erro;
    }
    this.carregado = true;
  }

  private async persistir(): Promise<void> {
    const conteudo = JSON.stringify(await this.memoria.listar(), null, 2);
    const escrita = this.fila.then(async () => {
      await mkdir(dirname(this.caminho), { recursive: true });
      await writeFile(this.caminho, conteudo);
    });
    this.fila = escrita.catch(() => {}); // uma falha não trava as próximas escritas...
    return escrita; // ...mas quem pediu esta escrita recebe o erro
  }
}
