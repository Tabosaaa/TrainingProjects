# Implementation Plan: Chess Live — Aplicativo Web de Xadrez ao Vivo

**Branch**: `001-chess-live-app` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-chess-live-app/spec.md`

## Summary

Chess Live é um app web de xadrez ao vivo com matchmaking público (casual e ranqueado), salas
privadas por convite, jogo em tempo real via WebSocket, reconexão em até 60 segundos, rating Elo
e histórico em PGN. O backend (Spring Boot, Java 21) é a fonte única de verdade para validação de
jogadas e segue arquitetura hexagonal. O frontend (Next.js, TypeScript) usa App Router com
componentes organizados por feature. Monólito modular para MVP, preparado para crescer.

## Technical Context

**Backend Language/Version**: Java 21

**Frontend Language/Version**: TypeScript, Next.js 14+ (App Router)

**Backend Dependencies**: Spring Boot 3.x, Spring Web, Spring Security, Spring Data JPA,
Spring WebSocket (STOMP), Spring Data Redis, Spring Cache, `com.github.bhlangonijr:chesslib` (validação FIDE)

**Frontend Dependencies**: Next.js App Router, `@stomp/stompjs`, `sockjs-client`

**Storage**: PostgreSQL 16+ (dados persistentes) / Redis 7+ (estado ao vivo das partidas)

**Testing (backend)**: JUnit 5, Spring Boot Test, Testcontainers (PostgreSQL + Redis) — integração
tem prioridade; testes unitários apenas para domain puro e strategies

**Testing (frontend)**: Jest, React Testing Library — foco em integração de hooks críticos;
sem testes de componente triviais

**Target Platform**: Web browser — desktop e mobile responsivo

**Project Type**: Web application — backend monolítico REST+WebSocket + frontend Next.js

**Performance Goals**: < 500ms para atualização do tabuleiro pós-jogada (SC-003);
matchmaking ≤ 60s sob carga normal (SC-002)

**Constraints**: Controle de tempo único 10+0; janela de reconexão 60s; rating inicial 1200;
MVP sem microserviços; monólito modular

**Scale/Scope**: MVP — instância única, equipe pequena; sem requisito de escala horizontal para
a primeira versão

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Evidência no Plano |
|---|---|---|
| I. Hexagonal Architecture | ✅ PASS | domain / application / infrastructure / presentation separados; camada domain sem dependência de Spring ou frameworks |
| II. Backend como Fonte Única da Verdade | ✅ PASS | Toda jogada passa por `MakeMoveUseCase` com validação via `MoveValidatorPort`; frontend pré-valida apenas visualmente |
| III. Frontend por Features | ✅ PASS | `features/auth`, `features/game`, `features/matchmaking`, `features/history`, `features/ranking` com shared isolado |
| IV. Separação de Protocolos | ✅ PASS | WebSocket (STOMP) para jogadas e relógio; REST para auth, perfil, histórico, ranking e convites |
| V. Strategy Pattern | ✅ PASS | `RatingStrategy` (Elo), `ClockStrategy` (10+0), `MatchmakingStrategy` (FIFO por modo) — injetáveis via Spring |
| VI. Testabilidade e Código Limpo | ✅ PASS | Integração (Testcontainers) priorizada; unitários apenas para domain e strategies; TypeScript `any` proibido (ESLint `no-explicit-any`); controllers sem lógica de negócio |

**Constitution Check pós-design (Phase 1)**: Contratos REST e WebSocket respeitam fronteiras
de camada. Entidades JPA confinadas à camada `infrastructure`. ✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-chess-live-app/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas e bibliotecas (Phase 0)
├── data-model.md        # Modelo de dados completo (Phase 1)
├── quickstart.md        # Guia de validação end-to-end (Phase 1)
├── contracts/
│   ├── rest.md          # Contratos REST (Phase 1)
│   └── websocket.md     # Contratos WebSocket STOMP (Phase 1)
└── tasks.md             # Gerado por /speckit-tasks
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── main/java/com/chesslive/
    │   ├── domain/                        # Java puro — sem Spring, sem JPA
    │   │   ├── game/
    │   │   │   ├── Game.java
    │   │   │   ├── Board.java
    │   │   │   ├── Move.java
    │   │   │   ├── GameStatus.java
    │   │   │   ├── Clock.java
    │   │   │   └── rules/                 # ChessRules.java, DrawDetector.java
    │   │   ├── player/                    # Player.java, Rating.java
    │   │   ├── matchmaking/               # MatchmakingEntry.java
    │   │   ├── events/                    # GameStartedEvent, MoveMadeEvent,
    │   │   │                              #   GameFinishedEvent, PlayerDisconnectedEvent
    │   │   └── shared/                    # GameId, PlayerId, Color (value objects)
    │   ├── application/
    │   │   ├── game/
    │   │   │   ├── MakeMoveUseCase.java
    │   │   │   ├── ResignUseCase.java
    │   │   │   ├── OfferDrawUseCase.java
    │   │   │   ├── RespondDrawUseCase.java
    │   │   │   └── commands/              # MakeMoveCommand, ResignCommand,
    │   │   │                              #   OfferDrawCommand, AcceptDrawCommand
    │   │   ├── matchmaking/
    │   │   │   ├── JoinQueueUseCase.java
    │   │   │   └── LeaveQueueUseCase.java
    │   │   ├── auth/
    │   │   │   ├── RegisterUseCase.java
    │   │   │   └── LoginUseCase.java
    │   │   ├── history/
    │   │   │   └── GetGameHistoryUseCase.java
    │   │   ├── ranking/
    │   │   │   └── GetRankingUseCase.java
    │   │   └── ports/
    │   │       ├── inbound/               # interfaces chamadas pela presentation
    │   │       └── outbound/              # MoveValidatorPort, GameSessionPort,
    │   │                                  #   MatchmakingQueuePort, UserRepositoryPort,
    │   │                                  #   GameRepositoryPort, EventPublisherPort
    │   ├── infrastructure/
    │   │   ├── persistence/               # JPA entities + Spring Data repos
    │   │   │   ├── UserJpaEntity.java
    │   │   │   ├── GameJpaEntity.java
    │   │   │   ├── MoveJpaEntity.java
    │   │   │   ├── RatingHistoryJpaEntity.java
    │   │   │   └── GameInviteJpaEntity.java
    │   │   ├── cache/
    │   │   │   └── RedisGameSessionAdapter.java
    │   │   ├── queue/                     # Redis Streams producers/consumers
    │   │   │   ├── GameFinishedQueueProducer.java
    │   │   │   └── GameFinishedQueueConsumer.java
    │   │   ├── chess/
    │   │   │   └── ChesslibMoveValidatorAdapter.java
    │   │   └── security/                  # Spring Security config, JWT filter
    │   └── presentation/
    │       ├── rest/
    │       │   ├── AuthController.java
    │       │   ├── GameController.java
    │       │   └── RankingController.java
    │       └── websocket/
    │           └── GameWebSocketController.java
    └── test/
        ├── unit/
        │   ├── domain/                    # Game, Board, Clock, ChessRules
        │   └── strategies/                # EloRatingStrategy, FifoMatchmakingStrategy
        └── integration/
            ├── usecases/                  # MakeMoveUseCase, etc. com Testcontainers
            └── endpoints/                 # REST + WebSocket com Spring Boot Test

frontend/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── lobby/page.tsx
    │   ├── game/[id]/page.tsx             # Client Component (WebSocket ativo)
    │   ├── history/page.tsx               # Server Component
    │   └── ranking/page.tsx               # Server Component
    ├── features/
    │   ├── auth/                          # LoginForm, RegisterForm, useAuth
    │   ├── game/                          # Board, Piece, Clock, GameActions
    │   ├── matchmaking/                   # QueueButton, useMatchmaking
    │   ├── history/                       # GameHistoryList, PgnViewer
    │   └── ranking/                       # RankingTable
    └── shared/
        ├── components/                    # Button, Modal, Spinner
        ├── hooks/                         # useWebSocket, useSession
        └── lib/                           # apiClient, types, constants
```

**Structure Decision**: Dois projetos (`backend/` e `frontend/`) no mesmo repositório (monorepo
simples, sem ferramentas de workspace para o MVP). Backend monolítico modular com hexagonal
architecture. Frontend Next.js App Router com arquitetura por features.

### Mapeamento MVC ↔ Hexagonal

A arquitetura hexagonal (Constituição, Princípio I) realiza o padrão MVC da seguinte forma —
as duas visões coexistem, não competem:

| MVC | Hexagonal (este projeto) | Regra prática |
|---|---|---|
| **Model** | `domain/` (entidades e regras puras) + `application/` (use cases, strategies, ports) | Toda lógica de negócio vive aqui; nunca em controllers |
| **View** | DTOs de resposta tipados em `presentation/rest/dto/` (ex.: `GameViews`) + frontend Next.js | Controllers nunca montam JSON à mão (`Map`/`LinkedHashMap` proibidos como resposta) |
| **Controller** | `presentation/rest/` e `presentation/websocket/` | Apenas: extrair entrada, delegar ao use case, mapear para a View — métodos curtos, sem branching de negócio |

## Complexity Tracking

> Nenhuma violação de constituição identificada. Seção não aplicável para este plano.
