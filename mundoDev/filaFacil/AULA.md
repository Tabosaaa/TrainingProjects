# Aula: Design de Software na prática com o FilaFácil

> **Como estudar esta aula:** leia na ordem. Cada seção traz o **problema**, a **ideia** e o **código real** do projeto. Deixe o arquivo citado aberto ao lado. No final há exercícios. Faça pelo menos dois, porque é fazendo que o conceito fica.

---

## Sumário

0. [O problema: código que funciona, mas não aceita mudança](#0-o-problema)
1. [Organização por domínio (feature-based)](#1-organização-por-domínio)
2. [Contratos (interfaces)](#2-contratos-interfaces)
3. [SOLID sem teoria](#3-solid-sem-teoria)
4. [Dependency Injection e Composition Root](#4-dependency-injection-e-composition-root)
5. [Factory Pattern](#5-factory-pattern)
6. [Strategy Pattern](#6-strategy-pattern)
7. [Observer Pattern](#7-observer-pattern)
8. [Testes com fakes](#8-testes-com-fakes)
9. [O caminho completo de uma requisição](#9-o-caminho-completo-de-uma-requisição)
10. [TypeScript que apareceu pelo caminho](#10-typescript-que-apareceu-pelo-caminho)
11. [O que NÃO fizemos, e por quê](#11-o-que-não-fizemos-e-por-quê)
12. [Exercícios](#12-exercícios)

---

## 0. O problema

O PDF descreve um sistema que **funciona**, mas qualquer mudança dói. Um código típico nessa situação é mais ou menos assim:

```ts
// ANTES: um service que faz tudo
class ColetaService {
  async cadastrar(dados: any) {
    const db = new PostgresClient();                 // (1) cria a própria dependência
    if (!dados.cliente) throw new Error('...');      // (2) validação misturada
    let prioridade;
    if (config.regra === 'pacotes') prioridade = dados.quantidadePacotes;      // (3) if por regra
    else if (config.regra === 'cliente') prioridade = dados.tipo === 'corporativo' ? 3 : 1;
    const coleta = { ...dados, id: uuid(), status: 'pendente', prioridade, criadaEm: new Date() };
    await db.insert(coleta);
    console.log('coleta criada');                    // (4) efeitos colaterais espalhados
    await new EmailService().send('rota@...', coleta);
    contador++;
    return coleta;
  }
}
```

Cada número é uma dor:

| # | Dor | Consequência |
|---|---|---|
| 1 | `new PostgresClient()` dentro do service | não dá para testar sem banco de verdade |
| 2 | a validação e a montagem da coleta ficam aqui | se outro lugar cria coleta, a lógica é copiada e diverge |
| 3 | um `if` para cada regra de prioridade | uma regra nova obriga a mexer no service e arrisca quebrar as outras |
| 4 | log, e-mail e contador dentro do fluxo | cada efeito novo também obriga a mexer no service |

**O objetivo da refatoração:** cada tipo de mudança deve mexer em **um lugar só**. Todo o resto desta aula é ferramenta para chegar nisso.

---

## 1. Organização por domínio

**Problema:** a organização por tipo técnico (`controllers/`, `services/`, `repositories/`) espalha uma única funcionalidade por cinco pastas. Para entender "coletas" você fica pulando pelo projeto inteiro.

**Ideia:** agrupe pelo **assunto do negócio**. Tudo que é de coleta mora em `src/coletas/`:

```
src/
├── server.ts                          sobe o HTTP e pluga as rotas do módulo
└── coletas/
    ├── coleta.model.ts                o que é uma coleta (tipos)
    ├── coleta.erros.ts                erros do domínio
    ├── coleta.contratos.ts            interfaces (contratos)
    ├── coleta.factory.ts              Factory
    ├── coleta.service.ts              orquestra o fluxo
    ├── coleta.controller.ts           HTTP <-> service
    ├── coleta.module.ts               Composition Root: monta as peças
    ├── prioridade/                    Strategy: uma regra por arquivo
    │   ├── prioridade-por-pacotes.ts
    │   └── prioridade-por-tipo-cliente.ts
    ├── eventos/                       Observer: o sujeito + um observador por arquivo
    │   ├── eventos-coleta.ts
    │   ├── log-operacional.ts
    │   ├── notificacao-rota.ts
    │   └── contador-eventos.ts
    ├── persistencia/                  implementações do Repository
    │   ├── coleta-repository-json.ts
    │   └── coleta-repository-memoria.ts
    └── *.test.ts                      testes, ao lado do que testam
```

Três regras deram forma a essa árvore:

1. **O prefixo diz o papel.** Os arquivos `coleta.<papel>.ts` na raiz do domínio são as peças centrais, e existe só uma de cada (model, erros, contratos, factory, service, controller, module).
2. **A subpasta agrupa o que varia.** Onde há várias implementações de um mesmo contrato (estratégias, observadores, repositórios), cada uma ganha **seu próprio arquivo** numa subpasta. Nova regra de prioridade = arquivo novo em `prioridade/`, sem editar nenhum arquivo existente. A árvore de pastas mostra o Aberto/Fechado funcionando.
3. **O domínio se monta sozinho.** O `coleta.module.ts` conecta as peças de coletas e entrega só as rotas prontas. O `server.ts` não conhece nenhuma classe interna, então para ele o domínio é uma caixa fechada.

> ⚠️ Repare no que **não** foi feito: não há subpastas `services/` ou `controllers/` dentro de `coletas/` (isso seria reorganizar por tipo técnico de novo, só que um nível abaixo), nem arquivos `index.ts` que só reexportam coisas.

**Regra prática:** se amanhã surgir o domínio "motoristas", ele ganha a própria pasta `src/motoristas/` com o seu `motorista.module.ts`, e o `server.ts` ganha uma linha. Se você quiser apagar uma feature, deve poder apagar uma pasta.

---

## 2. Contratos (interfaces)

**O que é:** uma interface diz **o que** algo faz e não diz **como**. Veja `coleta.contratos.ts`:

```ts
export interface ColetaRepository {
  salvar(coleta: Coleta): Promise<void>;
  buscarPorId(id: string): Promise<Coleta | undefined>;
  listar(filtro?: FiltroColeta): Promise<Coleta[]>;
  remover(id: string): Promise<boolean>;
}
```

O service depende disso. Ele não sabe se por baixo tem arquivo JSON, Postgres ou um `Map` em memória.

**A pergunta mais importante do módulo:** *quando criar uma interface?* Crie **só quando existe variação real**:

| Peça | Tem interface? | Por quê |
|---|---|---|
| Repository | ✅ | já existem 2 versões: JSON (produção) e memória (testes) |
| Estratégia de prioridade | ✅ | existem várias regras e mais vão surgir |
| Observador | ✅ | vários reagem ao mesmo evento, cada um de um jeito |
| Factory | ❌ | só existe um jeito de montar uma coleta válida |
| EventosColeta | ❌ | só existe um publicador |

> ⚠️ Interface com uma única implementação e sem perspectiva de outra é **abstração excessiva**, justamente o que o PDF pede para evitar. Ela só adiciona um arquivo a mais para ler.

---

## 3. SOLID sem teoria

O PDF cobra três letras de forma prática. Veja onde cada uma aparece no código:

### S: Responsabilidade Única
*"Uma classe deve ter um único motivo para mudar."*

| Se mudar... | ...só muda |
|---|---|
| a regra de validação ou os campos padrão | `coleta.factory.ts` |
| a regra de prioridade | `prioridade/` |
| onde os dados ficam salvos | `persistencia/` |
| o que acontece depois de criar a coleta | `eventos/` |
| o formato HTTP ou os status code | `coleta.controller.ts` |

Compare com o "antes": lá **tudo** isso mudava o service.

### O: Aberto/Fechado
*"Aberto para extensão, fechado para modificação."*

Para criar uma nova regra de prioridade você **adiciona** um arquivo em `prioridade/` e não **edita** o service. Para um novo efeito colateral você **adiciona** um observador. O código que já foi testado continua intocado.

### D: Inversão de Dependência
*"Dependa de abstrações, não de implementações."*

```ts
// coleta.service.ts: só importa TIPOS
import type { ColetaRepository, EstrategiaPrioridade } from './coleta.contratos.ts';
```

O service (alto nível, regra de negócio) não importa `ColetaRepositoryJson` (baixo nível, detalhe de disco). Quem conhece os detalhes é só o `coleta.module.ts`.

### Bônus: L e I
- **L (Liskov):** qualquer `EstrategiaPrioridade` precisa funcionar no lugar de outra. O teste `aceita qualquer estratégia que cumpra o contrato` prova isso com um objeto literal `{ nome, calcular }`.
- **I (Segregação de Interface):** as interfaces são pequenas. `ObservadorColeta` tem **um** método. Ninguém é obrigado a implementar algo que não usa.

---

## 4. Dependency Injection e Composition Root

**Problema:** se o service faz `new ColetaRepositoryJson()`, ele fica **preso** a arquivo. No teste não dá para trocar.

**Ideia:** o service **recebe** as dependências prontas. Ele não cria nada.

```ts
// coleta.service.ts
export interface DependenciasColetaService {
  repositorio: ColetaRepository;
  fabrica: ColetaFactory;
  estrategia: EstrategiaPrioridade;
  eventos: EventosColeta;
}

export class ColetaService {
  private readonly deps: DependenciasColetaService;
  constructor(deps: DependenciasColetaService) {
    this.deps = deps;
  }
  ...
}
```

Procure por `new` no `coleta.service.ts`. O único que aparece é `new ErroNaoEncontrado` / `new ErroValidacao`, que são valores (erros) e não dependências. Essa é a métrica **"0 new() dentro do service"** do PDF.

**E quem faz os `new`?** Um único lugar, chamado **Composition Root**: o `coleta.module.ts`.

```ts
// coleta.module.ts
export function criarModuloColetas(config: ConfigColetas) {
  const estrategia = ESTRATEGIAS[config.estrategia];   // tabela de estratégias disponíveis
  // ... inscreve os observadores em `eventos`
  const service = new ColetaService({
    repositorio: new ColetaRepositoryJson(config.arquivoDados),
    fabrica: new ColetaFactory(),
    estrategia,
    eventos,
  });
  return { rotas: criarRotasColetas(service), estrategia };
}
```

E o `server.ts` só lê o ambiente e pluga o resultado:

```ts
// server.ts
const coletas = criarModuloColetas({
  estrategia: process.env.ESTRATEGIA ?? 'pacotes',
  arquivoDados: process.env.ARQUIVO_DADOS ?? 'data/coletas.json',
});
app.use('/coletas', coletas.rotas);
```

Cada um tem uma responsabilidade: o **módulo** sabe *como o domínio se monta*, e o **server** sabe *de onde vem a configuração e como o HTTP sobe*. Nenhum dos dois tem regra de negócio.

Pense assim: o service é um **aparelho** com tomadas, e o `coleta.module.ts` é quem **liga os fios**. No teste você liga outros fios (fakes) no mesmo aparelho.

> **Por que um objeto `deps` e não `constructor(repo, fabrica, estrategia, eventos)`?**
> Com parâmetros nomeados fica impossível trocar a ordem sem querer, e a leitura fica clara nos testes.
> (Detalhe: o Node roda TypeScript "apagando" os tipos, então não aceitamos o atalho `constructor(private deps: ...)`, que gera código. É o `erasableSyntaxOnly` do `tsconfig.json`.)

> **DI não precisa de framework.** Não usamos InversifyJS, NestJS nem decorators. Passar pelo construtor **já é** injeção de dependência. O `criarRotasColetas(service)` do controller também é DI, só que via parâmetro de função.

---

## 5. Factory Pattern

**Problema:** montar uma coleta exige validar campos, gerar id, definir `status: 'pendente'`, data e prioridade. Se cada lugar monta à mão, um dia alguém esquece o status.

**Ideia:** **um único lugar sabe criar uma coleta válida.** Veja `coleta.factory.ts`:

```ts
criar(entrada: unknown, estrategia: EstrategiaPrioridade): Coleta {
  const dados = this.validar(entrada);           // 1. valida (ou lança ErroValidacao)
  return {
    id: randomUUID(),                            // 2. preenche o que o usuário não manda
    ...dados,
    status: 'pendente',
    prioridade: estrategia.calcular(dados),      // 3. prioridade vem da Strategy
    criadaEm: new Date().toISOString(),
  };
}
```

Pontos para reparar:
- A entrada é `unknown`, porque o dado vem da internet. Nunca confie nele antes de validar (ver seção 10).
- A Factory **cria** e não **salva**. O PDF pede explicitamente para "separar criação de persistência". Salvar é trabalho do repository.
- A Factory recebe a estratégia **como argumento**. Ela sabe *montar*, e o service decide *qual regra* usar.

---

## 6. Strategy Pattern

**Problema:** o `if (regra === 'pacotes') ... else if (regra === 'cliente') ...` cresce a cada regra nova, e toda mudança mexe no mesmo lugar.

**Ideia:** cada regra vira uma **classe própria** com o mesmo contrato. Quem usa chama `calcular()` sem saber qual é.

```ts
// coleta.contratos.ts
export interface EstrategiaPrioridade {
  readonly nome: string;
  calcular(dados: DadosNovaColeta): number;
}

// prioridade/prioridade-por-pacotes.ts
export class PrioridadePorPacotes implements EstrategiaPrioridade {
  readonly nome = 'pacotes';
  calcular(dados: DadosNovaColeta): number {
    return dados.quantidadePacotes;
  }
}

// prioridade/prioridade-por-tipo-cliente.ts
export class PrioridadePorTipoCliente implements EstrategiaPrioridade {
  readonly nome = 'cliente';
  calcular(dados: DadosNovaColeta): number {
    return PESO_POR_TIPO[dados.tipoCliente];   // comum 1, premium 2, corporativo 3
  }
}
```

**A troca acontece fora do service**, no `coleta.module.ts`, a partir da variável de ambiente:

```bash
npm start                      # por pacotes
ESTRATEGIA=cliente npm start   # por tipo de cliente
```

E o teste prova que o **mesmo** service produz filas diferentes:

```ts
test('trocar a estratégia muda a ordem da fila sem alterar o service', ...)
```

> 💡 Repare que o `if` não sumiu do mundo: ele virou uma **tabela** (`ESTRATEGIAS` no `coleta.module.ts`), que é consultada uma vez na inicialização em vez de a cada coleta. Strategy troca "decidir toda hora" por "decidir uma vez e injetar".

---

## 7. Observer Pattern

**Problema:** depois de criar uma coleta é preciso logar, avisar a rota e contar. Colocar tudo no service faz ele crescer a cada requisito novo, e ele passa a *conhecer* coisas que não são problema dele.

**Ideia:** o service só **anuncia** "aconteceu X". Quem se interessa **se inscreve** e reage.

Tem dois papéis:
- **Sujeito** (`EventosColeta`): guarda a lista e avisa todo mundo.
- **Observadores** (`LogOperacional`, `NotificacaoRota`, `ContadorEventos`): cada um reage do seu jeito.

```ts
// eventos/eventos-coleta.ts: o sujeito inteiro
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
        console.error(...);   // um observador quebrado não derruba os outros
      }
    }
  }
}
```

No service, o efeito colateral inteiro é **uma linha**:

```ts
this.deps.eventos.publicar({ tipo: 'coleta.criada', coleta });
```

Cada observador decide o que é relevante para ele. A `NotificacaoRota` só age quando o status vira `em_rota`:

```ts
if (evento.tipo === 'coleta.status_atualizado' && evento.coleta.status === 'em_rota') { ... }
```

E as inscrições ficam no `coleta.module.ts`, de novo no Composition Root:

```ts
eventos.inscrever(new LogOperacional());
eventos.inscrever(new NotificacaoRota());
eventos.inscrever(new ContadorEventos());
```

> **Observer ≠ mensageria.** Aqui tudo roda no mesmo processo, de forma síncrona. Kafka e RabbitMQ são a versão "entre processos" da mesma ideia, e o PDF proíbe usá-los neste módulo.
>
> **Por que o `try/catch`?** Sem ele, se o log falhar, a requisição falha, mesmo com a coleta já salva. Um efeito *secundário* não pode quebrar a operação *principal*. Existe um teste para isso.

---

## 8. Testes com fakes

É aqui que todo o design se paga. Como o service recebe tudo por injeção, no teste passamos **peças falsas**:

```ts
// coleta.service.test.ts
function montarService(estrategia = new PrioridadePorPacotes()) {
  const repositorio = new ColetaRepositoryMemoria();   // FAKE: no lugar do arquivo
  const espiao = new ObservadorEspiao();                 // ESPIÃO: anota os eventos
  const eventos = new EventosColeta();
  eventos.inscrever(espiao);
  const service = new ColetaService({ repositorio, fabrica: new ColetaFactory(), estrategia, eventos });
  return { service, repositorio, espiao, eventos };
}
```

Vocabulário:
- **Fake:** uma implementação de verdade, só que simplificada (o repositório em memória funciona, mas não usa disco).
- **Espião (spy):** anota o que recebeu para você verificar depois (o `ObservadorEspiao`).
- **Stub:** devolve um valor fixo (a estratégia `{ nome: 'fixa', calcular: () => 100 }`).

Todo teste segue o padrão **AAA**:

```ts
test('cadastrar salva a coleta e notifica os observadores', async () => {
  const { service, repositorio, espiao } = montarService();          // Arrange (preparar)

  const coleta = await service.cadastrar(MERCADO);                    // Act (agir)

  assert.equal(coleta.status, 'pendente');                            // Assert (verificar)
  assert.deepEqual(await repositorio.buscarPorId(coleta.id), coleta);
  assert.deepEqual(espiao.recebidos, [{ tipo: 'coleta.criada', coleta }]);
});
```

O que os testes cobrem, mapeado ao PDF:

| Exigência do PDF | Teste |
|---|---|
| "Estratégias são trocadas" | `trocar a estratégia muda a ordem da fila...` |
| "observadores são verificados" | `cadastrar ... notifica`, `atualizarStatus ... publica o status anterior` |
| "erros de validação testados de forma isolada" | `rejeita dados inválidos`, `cadastro inválido não salva nem notifica` |
| "sem depender de banco real" | tudo usa `ColetaRepositoryMemoria` |

Usamos o `node:test`, que já vem no Node. Não precisamos de Jest nem de Vitest. Rode com `npm test`.

> O único teste que toca o disco é o `persistencia/coleta-repository-json.test.ts`, e ele testa **o próprio repositório de arquivo** usando uma pasta temporária. Testar o adaptador de verdade separado, e o service com fake, é a divisão certa.

---

## 9. O caminho completo de uma requisição

`POST /coletas` com `{ "cliente": "Mercado Sol", "tipoCliente": "comum", "regiao": "Norte", "quantidadePacotes": 10 }`:

```
HTTP ──► coleta.controller.ts   rotas.post('/') → service.cadastrar(req.body)
            │
            ▼
        coleta.service.ts       cadastrar()
            │  1. fabrica.criar(body, estrategia)
            │        ├─ validar()             → ErroValidacao? vira 400 no tratarErros
            │        └─ estrategia.calcular() → prioridade 10
            │  2. repositorio.salvar(coleta)  → data/coletas.json
            │  3. eventos.publicar('coleta.criada')
            │        ├─ LogOperacional   → [log] coleta.criada ...
            │        ├─ NotificacaoRota  → (ignora, não é em_rota)
            │        └─ ContadorEventos  → +1
            ▼
HTTP ◄── 201 { id, ..., status: 'pendente', prioridade: 10 }
```

Repare como **cada caixa tem um único trabalho**. Faça o teste: aponte uma linha qualquer do fluxo e diga em qual arquivo ela mora. Se conseguir, a organização está cumprindo o papel dela.

**Tradução de erros:** o service lança `ErroValidacao` e `ErroNaoEncontrado`, que são erros **do domínio**. Quem traduz para 400/404 é o `tratarErros` no controller. Assim o service nunca fala "HTTP", e poderia ser usado por uma CLI ou por um job sem mudar nada.

---

## 10. TypeScript que apareceu pelo caminho

Alguns recursos de TS fizeram parte do design. Vale conhecer cada um:

**`as const` + tipo derivado:** a lista vira a fonte da verdade para o tipo e para a validação em tempo de execução.
```ts
export const STATUS_COLETA = ['pendente', 'em_rota', 'coletada', 'cancelada'] as const;
export type StatusColeta = (typeof STATUS_COLETA)[number]; // 'pendente' | 'em_rota' | ...
```

**Type guard (`valor is T`):** uma função que, quando retorna `true`, faz o TS *saber* o tipo.
```ts
export function ehStatusValido(valor: unknown): valor is StatusColeta { ... }
```

**`unknown` em vez de `any`:** `any` desliga o compilador. `unknown` obriga você a checar antes de usar, que é o certo para dados que vêm de fora.

**União discriminada:** o campo `tipo` diz qual formato o evento tem. Depois do `if (evento.tipo === 'coleta.status_atualizado')`, o TS sabe que `statusAnterior` existe.
```ts
export type EventoColeta =
  | { tipo: 'coleta.criada'; coleta: Coleta }
  | { tipo: 'coleta.status_atualizado'; coleta: Coleta; statusAnterior: Coleta['status'] };
```

**`import type`:** importa só o tipo, que some ao executar. É o sinal visível de que o service depende de **contratos**, não de código concreto.

**Imutabilidade:** `atualizarStatus` cria `{ ...atual, status }` em vez de fazer `atual.status = status`. O repositório em memória devolve cópias. Assim ninguém altera o "banco" por referência sem querer.

---

## 11. O que NÃO fizemos, e por quê

O PDF é enfático: **"SOLID prático, sem over-engineering"**. Saber o que não fazer também é uma hard skill.

| Tentação | Por que ficou de fora |
|---|---|
| `IColetaFactory` | a Factory não varia, então a interface seria só burocracia |
| container de DI (Inversify, tsyringe) | com 4 dependências, o `new` manual no `coleta.module.ts` é mais claro |
| camada `domain/`, `application/`, `infra/` (Clean Architecture completa) | para um único domínio, uma pasta basta |
| `AbstractBaseRepository<T>` genérico | só temos uma entidade. "Abstrações genéricas sem necessidade" estão proibidas no PDF |
| Kafka/RabbitMQ para eventos | o PDF proíbe mensageria real, e o Observer em memória resolve |
| banco de dados | um arquivo JSON persiste. Trocar por Postgres = escrever **um** repository novo, e o service nem percebe |

A regra por trás de tudo: **uma abstração só se paga quando já existe a variação que ela esconde.**

---

## 12. Exercícios

Cada exercício diz **quais arquivos você deveria precisar tocar**. Se precisar tocar mais do que isso, o design falhou (ou você errou o caminho 😉).

1. **Nova estratégia `PrioridadeManual`.** Aceite um campo opcional `prioridadeManual` na criação e use-o como prioridade.
   *Toca:* `coleta.model.ts` (campo), `coleta.factory.ts` (validar o campo), `prioridade/` (novo arquivo), `coleta.module.ts` (registrar na tabela). **O service não muda.**

2. **Novo observador `AlertaCancelamento`.** Loga um aviso quando uma coleta for cancelada.
   *Toca:* um arquivo novo em `eventos/` e o `coleta.module.ts`. Escreva um teste com o espião.

3. **Estratégia combinada.** Crie uma estratégia que **recebe outras duas** no construtor e soma os resultados. (Dica: isso é Strategy + composição. Repare que é DI de novo.)

4. **Repositório com SQLite.** O Node 24 tem `node:sqlite` embutido. Implemente `ColetaRepositorySqlite` com o mesmo contrato.
   *Toca:* um arquivo novo em `persistencia/` e uma linha do `coleta.module.ts`. Rode os testes do service: eles continuam passando sem mudança nenhuma.

5. **Desafio de leitura.** Abra o `coleta.service.ts` e, para cada linha, responda: *"Se isso mudar, quantos arquivos eu edito?"* Se a resposta for sempre 1, você entendeu o módulo.

---

### Glossário de bolso

| Termo | Em uma frase |
|---|---|
| Contrato / Interface | o "o quê" sem o "como" |
| Dependency Injection | receber as dependências prontas em vez de criá-las |
| Composition Root | o único lugar que monta as peças concretas (`coleta.module.ts`) |
| Factory | um lugar só para criar objetos válidos |
| Strategy | algoritmos intercambiáveis atrás de um mesmo contrato |
| Observer | o sujeito anuncia e os inscritos reagem, sem se conhecerem |
| Fake / Spy / Stub | peças de teste: versão simples, que anota, que devolve valor fixo |
| Over-engineering | abstração para uma variação que não existe |
