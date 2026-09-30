<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (unversioned) → 1.0.0
Bump rationale: Initial ratification of the project constitution (MAJOR baseline).

Principles defined (initial set, 6):
  I.   Arquitetura Hexagonal no Backend
  II.  Backend como Fonte Única da Verdade
  III. Arquitetura por Features no Frontend
  IV.  Separação de Protocolos (WebSocket vs REST)
  V.   Strategy Pattern para Pontos de Variação
  VI.  Testabilidade e Código Limpo

Added sections:
  - Restrições Técnicas & de Persistência (SECTION_2)
  - Fluxo de Desenvolvimento & Quality Gates (SECTION_3)
  - Governance

Removed sections: none (template placeholders fully replaced)

Templates requiring updates:
  ✅ .specify/templates/plan-template.md   — Constitution Check gate aligns; no edit required
  ✅ .specify/templates/spec-template.md   — no constitution-driven mandatory section change
  ✅ .specify/templates/tasks-template.md  — task categories compatible with principles
  ✅ .specify/extensions.yml               — no constitution hooks; unaffected

Follow-up TODOs: none
-->

# Chess App Constitution

## Core Principles

### I. Arquitetura Hexagonal no Backend

O backend (Spring Boot) MUST seguir arquitetura hexagonal (ports & adapters) com quatro
camadas explícitas e separadas: `domain`, `application`, `infrastructure` e `presentation`.

- A camada `domain` MUST conter regras de negócio puras (entidades, value objects, regras
  do xadrez) e NÃO pode depender de frameworks, banco de dados, rede ou Spring.
- A camada `application` MUST orquestrar casos de uso através de ports (interfaces),
  sem conhecer detalhes de tecnologia.
- A camada `infrastructure` MUST conter adapters concretos (PostgreSQL, Redis, WebSocket,
  clientes externos) que implementam os ports definidos pela aplicação.
- A camada `presentation` (controllers REST/WebSocket) MUST se limitar a traduzir
  requisições e respostas; NENHUMA lógica de negócio é permitida em controllers.

**Rationale**: O isolamento do domínio garante que as regras do jogo sejam testáveis sem
infraestrutura e que tecnologias (banco, transporte) possam ser trocadas sem reescrever
regras — base para um produto seguro e expansível.

### II. Backend como Fonte Única da Verdade

O backend MUST ser a autoridade definitiva sobre o estado e as regras da partida.

- Toda jogada MUST ser validada no backend antes de ser aplicada ao estado da partida.
- O frontend MAY validar jogadas localmente APENAS para feedback de UX imediato; essa
  validação NUNCA é definitiva e MUST ser confirmada ou rejeitada pelo backend.
- O cliente NUNCA decide resultado de partida, xeque-mate, tempo esgotado ou variação de
  rating; o backend é a única fonte desses fatos.

**Rationale**: Confiar no cliente abre espaço para trapaça e estados inconsistentes; a
autoridade central é requisito de segurança e integridade competitiva.

### III. Arquitetura por Features no Frontend

O frontend (Next.js) MUST ser organizado por features (ex.: `features/game`,
`features/auth`, `features/ranking`, `features/matchmaking`), e não por tipo técnico global.

- Cada feature MUST agrupar seus próprios componentes, hooks, estado e chamadas de API.
- Código compartilhado entre features MUST residir em um espaço comum explícito (ex.:
  `shared/` ou `lib/`), evitando dependências cruzadas diretas entre features.

**Rationale**: A modularização por feature mantém o frontend coeso e escalável conforme o
MVP cresce, reduzindo acoplamento acidental.

### IV. Separação de Protocolos (WebSocket vs REST)

A comunicação MUST usar o protocolo adequado ao tipo de interação.

- Partidas em tempo real (jogadas, relógio, estado ao vivo) MUST usar WebSocket.
- Operações de request/response — autenticação, perfil, histórico, ranking e matchmaking —
  MUST usar REST.
- Misturar responsabilidades (ex.: jogadas em tempo real via REST polling) NÃO é permitido
  sem justificativa registrada em Complexity Tracking.

**Rationale**: Cada protocolo é otimizado para um padrão de comunicação distinto;
respeitá-los reduz latência no jogo e mantém APIs previsíveis e cacheáveis.

### V. Strategy Pattern para Pontos de Variação

Rating, relógio (clock) e matchmaking MUST ser implementados via Strategy Pattern.

- Cada um desses domínios MUST expor uma interface (port) e ter ao menos uma
  implementação concreta selecionável.
- Novas variações (ex.: novo algoritmo de rating, novo modo de relógio) MUST ser
  adicionadas como novas strategies, sem alterar os consumidores existentes.

**Rationale**: Esses são os eixos esperados de evolução do produto; isolá-los atrás de
strategies torna o sistema expansível sem reescrita e mantém o domínio aberto a extensão.

### VI. Testabilidade e Código Limpo

Todo código MUST ser testável, organizado e livre de lógica de negócio em controllers.

- Testes de integração MUST ser priorizados sobre testes unitários: eles verificam o
  comportamento real do sistema (banco, cache, WebSocket) e têm maior retorno por esforço.
- Testes unitários SHOULD ser escritos apenas para lógica de domínio isolada e para
  strategies (Elo, Matchmaking, Clock) — onde o teste é trivial e o valor é alto.
- A cobertura de testes MUST ser racional: não escrever testes apenas para atingir métricas;
  cada teste deve proteger um comportamento que, se quebrado, causaria problema real.
- Controllers, adapters e configuração MUST permanecer finos; qualquer regra de negócio
  encontrada neles é uma violação a ser corrigida.

**Rationale**: Testes de integração detectam falhas de contrato, mapeamento ORM e
comportamento real de infraestrutura — exatamente os bugs que custam mais em produção.
Testes unitários excessivos de coordenação (controllers, adapters) apenas replicam a
implementação sem agregar confiança.

## Restrições Técnicas & de Persistência

- **Stack**: Frontend em Next.js (TypeScript); Backend em Spring Boot.
- **TypeScript `any` proibido**: O tipo `any` MUST NOT ser usado em nenhum arquivo
  TypeScript do frontend. Usar `unknown` com narrowing explícito, tipos concretos ou
  generics. Violações MUST ser corrigidas antes do merge.
- **Persistência durável**: PostgreSQL MUST ser usado para dados persistentes (usuários,
  perfis, histórico de partidas, ranking).
- **Estado ao vivo**: Redis MUST ser usado para o estado das partidas em andamento (estado
  do tabuleiro ativo, relógios, sessões de jogo em tempo real).
- Dados de partidas finalizadas MUST ser persistidos no PostgreSQL; estado efêmero NÃO deve
  depender apenas do Redis para o registro histórico definitivo.
- Segredos e credenciais MUST ser fornecidos via configuração de ambiente, nunca
  hard-coded no repositório.

## Fluxo de Desenvolvimento & Quality Gates

- **Prioridade MVP**: As decisões MUST favorecer um MVP simples, seguro e expansível;
  complexidade que não serve ao MVP atual é adiada (YAGNI).
- **Constitution Check**: Todo plano (`/speckit-plan`) MUST passar pelo Constitution Check
  antes da fase de design e ser reavaliado após o design.
- **Revisão**: PRs MUST verificar conformidade com os princípios acima; violações MUST ser
  justificadas em Complexity Tracking ou corrigidas antes do merge.
- **Camadas**: Mudanças MUST respeitar as fronteiras das camadas hexagonais; dependências
  apontando do domínio para infraestrutura são proibidas.

## Governance

Esta constituição supersede outras práticas de desenvolvimento em caso de conflito.

- **Emendas**: Alterações MUST ser documentadas neste arquivo, com versão e data
  atualizadas, e aprovadas via revisão antes de entrar em vigor.
- **Versionamento (SemVer)**:
  - MAJOR: remoção ou redefinição incompatível de princípios/governança.
  - MINOR: adição de princípio/seção ou expansão material de orientação.
  - PATCH: esclarecimentos e refinamentos não-semânticos.
- **Conformidade**: Toda revisão de código e plano de feature MUST validar aderência a
  esta constituição; desvios exigem justificativa explícita registrada.
- **Orientação em runtime**: Os arquivos `CLAUDE.md` do repositório e o plano corrente
  servem como guia operacional complementar a esta constituição.

**Version**: 1.1.0 | **Ratified**: 2026-06-11 | **Last Amended**: 2026-06-11
