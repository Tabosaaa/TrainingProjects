# FilaFácil Logística

API de coletas (Node 24 + TypeScript + Express) refatorada com **SOLID, Dependency Injection, Factory, Strategy e Observer**.

> Quer entender o *porquê* de cada decisão? Leia a **[AULA.md](AULA.md)**.

## Rodando

```bash
npm install
npm start                      # http://localhost:3000, prioridade por pacotes
ESTRATEGIA=cliente npm start   # troca a regra de prioridade sem mudar código
npm test                       # testes unitários (node:test, sem banco)
npm run typecheck              # checagem de tipos (tsc)
```

O Node 24 executa `.ts` direto, então não existe etapa de build. Os dados ficam em `data/coletas.json` (ou onde apontar `ARQUIVO_DADOS`).

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| POST | `/coletas` | cadastra `{ cliente, tipoCliente, regiao, quantidadePacotes }` |
| GET | `/coletas?status=&regiao=&tipoCliente=` | lista e filtra, as mais urgentes primeiro |
| GET | `/coletas/resumo` | resumo operacional |
| GET | `/coletas/:id` | busca uma coleta |
| PATCH | `/coletas/:id/status` | `{ status }` = `pendente`, `em_rota`, `coletada` ou `cancelada` |
| DELETE | `/coletas/:id` | remove |

## Organização (por domínio)

```
src/
├── server.ts                          lê o ambiente, sobe o HTTP e pluga as rotas do módulo
└── coletas/                           tudo do domínio de coletas, junto
    ├── coleta.model.ts                tipos da coleta
    ├── coleta.erros.ts                erros do domínio
    ├── coleta.contratos.ts            interfaces (contratos)
    ├── coleta.factory.ts              Factory
    ├── coleta.service.ts              coordena o fluxo; recebe tudo por DI
    ├── coleta.controller.ts           HTTP <-> service; erros viram 400/404
    ├── coleta.module.ts               Composition Root: único lugar com `new` das peças
    ├── prioridade/                    Strategy (uma regra por arquivo)
    ├── eventos/                       Observer (sujeito + um observador por arquivo)
    ├── persistencia/                  Repository: JSON (produção) e memória (fake de teste)
    └── *.test.ts                      testes ao lado do código
```

- **Peças centrais** (`coleta.<papel>.ts`) ficam na raiz do domínio, uma de cada.
- **Variações** de um mesmo contrato ficam numa subpasta, uma por arquivo. Uma nova variação é um arquivo novo.
- **O domínio se monta sozinho** (`coleta.module.ts`). O `server.ts` não conhece as classes internas.

## Contratos e onde cada pattern está

| Conceito | Onde | Por quê |
|---|---|---|
| Contrato `ColetaRepository` | `coleta.contratos.ts` | existem 2 implementações (JSON e memória) |
| Contrato `EstrategiaPrioridade` | `coleta.contratos.ts` | as regras de prioridade variam |
| Contrato `ObservadorColeta` | `coleta.contratos.ts` | vários efeitos colaterais independentes |
| **Factory** | `coleta.factory.ts` | só ela monta uma coleta válida (id, status, data, prioridade) |
| **Strategy** | `prioridade/` | `PrioridadePorPacotes`, `PrioridadePorTipoCliente` |
| **Observer** | `eventos/` | `EventosColeta` (sujeito); `LogOperacional`, `NotificacaoRota`, `ContadorEventos` |
| **DI** | `coleta.service.ts` + `coleta.module.ts` | o service recebe as dependências e tem **zero** `new` |
