# Feature Specification: Chess Live — Aplicativo Web de Xadrez ao Vivo

**Feature Branch**: `001-chess-live-app`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Criar um app web de xadrez ao vivo chamado Chess Live..."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cadastro e Login (Priority: P1)

Um novo usuário acessa o Chess Live, cria uma conta com e-mail e senha e faz login. A partir daí, pode acessar todas as funcionalidades do sistema. Um usuário existente pode fazer login a qualquer momento e retomar sua experiência.

**Why this priority**: Sem autenticação, nenhuma outra funcionalidade está disponível. É o ponto de entrada obrigatório do sistema.

**Independent Test**: Pode ser completamente testado ao criar uma conta, fazer logout e fazer login novamente — sem nenhuma outra feature implementada ainda entrega acesso ao sistema.

**Acceptance Scenarios**:

1. **Given** um visitante não autenticado, **When** preenche e-mail, senha e confirma o cadastro, **Then** sua conta é criada e ele é redirecionado ao lobby autenticado.
2. **Given** um usuário cadastrado, **When** informa suas credenciais corretamente, **Then** acessa o sistema com sua sessão ativa.
3. **Given** um usuário tentando fazer login com senha errada, **When** submete as credenciais, **Then** recebe mensagem de erro sem expor qual campo está errado.
4. **Given** um usuário já logado, **When** faz logout, **Then** sua sessão é encerrada e ele não pode acessar páginas autenticadas.

---

### User Story 2 — Matchmaking e Início de Partida (Priority: P1)

Um jogador logado quer encontrar um adversário. Ele escolhe um modo de jogo (casual ou ranqueado) e um controle de tempo, entra na fila e o sistema o emparelha com outro jogador disponível. A partida começa automaticamente assim que dois jogadores são emparelhados.

**Why this priority**: É o fluxo central do produto — sem matchmaking não há partidas, e sem partidas o app não tem valor.

**Independent Test**: Dois usuários entram na fila com o mesmo controle de tempo e modo; o sistema os emparelha e a partida inicia. Testável independentemente das features de histórico e ranking.

**Acceptance Scenarios**:

1. **Given** um jogador autenticado no lobby, **When** seleciona "Partida Rápida" com controle de tempo blitz, **Then** entra na fila de matchmaking e vê um indicador de busca.
2. **Given** dois jogadores na fila com o mesmo modo e controle de tempo, **When** o sistema os emparelha, **Then** ambos são redirecionados automaticamente à tela de jogo com seus respectivos lados (brancas/pretas) definidos pelo sistema.
3. **Given** um jogador na fila, **When** cancela a busca antes de ser emparelhado, **Then** é removido da fila e retorna ao lobby sem penalidade.
4. **Given** dois jogadores emparelhados, **When** a partida inicia, **Then** o tabuleiro é exibido na posição inicial e o relógio do jogador com as peças brancas começa a correr.

---

### User Story 3 — Jogo em Tempo Real (Priority: P1)

Dois jogadores emparelhados disputam uma partida de xadrez. Cada jogador faz suas jogadas na sua vez, o tabuleiro é atualizado em tempo real para ambos, o relógio de cada lado corre enquanto é a sua vez. O sistema detecta xeque, xeque-mate, empate por esgotamento de tempo e todas as condições de fim de jogo regulamentares.

**Why this priority**: É o núcleo do produto — a experiência de jogar xadrez em tempo real é o valor central do Chess Live.

**Independent Test**: Dois jogadores podem jogar uma partida completa do início ao fim, com todas as condições de término detectadas corretamente, sem nenhuma feature de histórico ou ranking necessária.

**Acceptance Scenarios**:

1. **Given** um jogador na sua vez, **When** seleciona uma peça e um destino legal, **Then** o servidor valida a jogada, atualiza o estado da partida e ambos os jogadores veem o tabuleiro atualizado em menos de 500ms.
2. **Given** um jogador tentando mover uma peça para uma casa ilegal, **When** submete a jogada, **Then** o servidor rejeita a jogada, o tabuleiro não muda e o jogador é informado que a jogada é inválida.
3. **Given** um jogador cujo rei está em xeque, **When** o estado é atualizado, **Then** ambos os jogadores veem a indicação de xeque na interface.
4. **Given** uma posição de xeque-mate no tabuleiro, **When** o servidor valida a última jogada, **Then** o jogo termina imediatamente, o vencedor é declarado e nenhuma jogada adicional é aceita.
5. **Given** um jogador com o relógio esgotado, **When** o servidor detecta tempo zero, **Then** o oponente é declarado vencedor por tempo (exceto se o oponente não tiver material suficiente para dar xeque-mate — nesse caso é empate).
6. **Given** que uma posição de empate regulamentar ocorre (afogamento, repetição tripla, regra dos 50 movimentos, material insuficiente), **When** o servidor detecta a condição, **Then** o jogo termina em empate.
7. **Given** um jogador querendo desistir, **When** clica em "Desistir" e confirma, **Then** o oponente é declarado vencedor por desistência.
8. **Given** um jogador que ofereceu empate, **When** o oponente aceita, **Then** o jogo termina em empate; se o oponente recusar, o jogo continua.

---

### User Story 4 — Reconexão Durante Partida (Priority: P2)

Um jogador perde conexão durante uma partida em andamento. Ao retornar ao site dentro de um período de graça, ele consegue reconectar automaticamente à sua partida e continuar jogando do ponto onde parou. O relógio continua correndo durante a desconexão.

**Why this priority**: Essencial para a experiência de jogo — desconexões são comuns e um jogo perdido por problema técnico frustra o usuário. Sem reconexão, o MVP é jogável mas com experiência degradada em redes instáveis.

**Independent Test**: Um jogador desconecta deliberadamente (fecha a aba/perde rede), reconecta dentro do prazo e vê a partida no estado atual com o relógio correndo corretamente.

**Acceptance Scenarios**:

1. **Given** um jogador que perdeu conexão com partida em andamento, **When** retorna ao site dentro de 60 segundos, **Then** é automaticamente redirecionado à partida em andamento, vê o estado atual do tabuleiro e pode continuar jogando.
2. **Given** um jogador desconectado, **When** seu tempo de graça (60 segundos) expira sem reconexão, **Then** o jogo é encerrado por abandono, o oponente é declarado vencedor e o jogador ausente sofre consequências de rating equivalentes a uma derrota.
3. **Given** um jogador reconectado, **When** retoma a partida, **Then** o relógio reflete o tempo real decorrido durante a desconexão (o relógio não pausou).
4. **Given** uma partida com ambos os jogadores desconectados simultaneamente, **When** um reconecta dentro do prazo de graça, **Then** a partida continua; se nenhum reconectar dentro do prazo, a partida é encerrada em empate.

---

### User Story 5 — Sala Privada por Convite (Priority: P2)

Um jogador quer jogar contra um amigo específico. Ele cria uma sala privada, recebe um código ou link de convite, compartilha com o amigo e ambos entram na mesma partida.

**Why this priority**: Complementa o matchmaking público, permitindo partidas entre conhecidos. Importante para o MVP mas não bloqueia o núcleo do produto.

**Independent Test**: Um jogador cria uma sala privada, compartilha o código, o segundo jogador usa o código para entrar e a partida inicia — sem depender de matchmaking ou histórico.

**Acceptance Scenarios**:

1. **Given** um jogador logado, **When** seleciona "Criar Sala Privada" e escolhe as configurações da partida, **Then** recebe um código único de convite e aguarda o oponente.
2. **Given** um jogador com um código de convite válido, **When** o insere no sistema, **Then** entra na sala e a partida inicia imediatamente.
3. **Given** um código de convite expirado (mais de 24 horas) ou já utilizado, **When** um jogador tenta usá-lo, **Then** recebe mensagem informando que o convite é inválido.
4. **Given** uma sala privada criada, **When** o criador cancela antes de alguém entrar, **Then** o código de convite é invalidado.

---

### User Story 6 — Histórico de Partidas (Priority: P3)

Um jogador quer rever suas partidas anteriores. Ele acessa seu histórico e vê a lista de partidas disputadas com resultado, adversário, data e pode visualizar a sequência de movimentos de cada partida em notação PGN.

**Why this priority**: Agrega valor ao produto mas não é necessário para jogar. Pode ser adicionado ao MVP após as features P1 e P2 estarem funcionais.

**Independent Test**: Um jogador que disputou ao menos uma partida acessa seu histórico, vê a partida listada com o resultado correto e consegue visualizar os movimentos em PGN.

**Acceptance Scenarios**:

1. **Given** um jogador logado com partidas disputadas, **When** acessa seu histórico, **Then** vê a lista de partidas com adversário, resultado, controle de tempo e data.
2. **Given** um jogador visualizando seu histórico, **When** seleciona uma partida específica, **Then** vê os movimentos em notação algébrica padrão (compatível com PGN) e o resultado final.
3. **Given** um jogador com nenhuma partida disputada, **When** acessa seu histórico, **Then** vê uma mensagem indicando que não há partidas registradas.

---

### User Story 7 — Ranking e Rating (Priority: P3)

Após cada partida ranqueada, o rating do jogador é atualizado. O jogador pode consultar seu rating atual, seu histórico de variação e uma tabela de liderança com os melhores jogadores da plataforma.

**Why this priority**: Essencial para o modo ranqueado ter sentido competitivo, mas pode ser ativado apenas quando as features P1/P2/P3-histórico estiverem prontas.

**Independent Test**: Após uma partida ranqueada, ambos os jogadores veem seus ratings atualizados na página de perfil, e a tabela de ranking reflete os novos valores.

**Acceptance Scenarios**:

1. **Given** uma partida ranqueada concluída, **When** o resultado é processado, **Then** o rating de ambos os jogadores é atualizado em até 5 segundos e ambos podem ver a variação (ganho ou perda de pontos).
2. **Given** um jogador logado, **When** acessa a tabela de ranking, **Then** vê os jogadores ordenados por rating decrescente com seus usernames, ratings e posições.
3. **Given** um jogador logado, **When** acessa seu perfil, **Then** vê seu rating atual, posição no ranking e número de partidas ranqueadas disputadas.

---

### User Story 8 — Partida contra Bot (Priority: P2)

Um jogador logado quer treinar sem depender de outro humano. Ele escolhe jogar contra o bot, define a cor das suas peças (brancas ou pretas) e o nível de dificuldade (0 a 10), e disputa a partida pelo mesmo tabuleiro e fluxo em tempo real do modo online. O backend calcula e executa as jogadas do bot — o frontend nunca escolhe a jogada do bot nem envia estado final.

**Why this priority**: Permite jogar a qualquer momento sem fila, aumenta retenção e reaproveita toda a infraestrutura existente (WebSocket, validação server-side, relógio).

**Independent Test**: Um jogador inicia partida contra o bot nível 0 jogando de brancas, faz um lance legal via WebSocket e recebe automaticamente a resposta do bot; jogando de pretas, o bot faz o primeiro lance sem nenhuma ação do jogador.

**Acceptance Scenarios**:

1. **Given** um jogador no lobby, **When** seleciona "Jogar contra o Bot", escolhe cor e nível 0–10 e confirma, **Then** a partida inicia imediatamente com o tabuleiro na posição inicial.
2. **Given** uma partida contra bot em que o humano joga de brancas, **When** o humano faz um lance legal, **Then** o servidor valida e aplica o lance, publica MOVE_MADE, publica BOT_THINKING, calcula a jogada do bot no servidor, aplica e publica novo MOVE_MADE.
3. **Given** uma partida contra bot em que o humano joga de pretas, **When** a partida inicia, **Then** o bot (de brancas) faz o primeiro lance automaticamente.
4. **Given** um lance ilegal submetido pelo humano, **When** o servidor valida, **Then** o lance é rejeitado (MOVE_REJECTED) e o bot não responde.
5. **Given** uma posição de fim de jogo (xeque-mate, empate, desistência), **When** detectada, **Then** GAME_OVER é publicado e nenhuma jogada adicional do bot ocorre.

---

### Edge Cases

- O que acontece se um jogador fechar a aba exatamente no momento em que é emparelhado? (o jogo começa mesmo sem conexão ativa — o período de graça de reconexão se aplica)
- O que acontece se o servidor detectar a mesma posição pela segunda vez consecutiva (repetição)? (o contador de repetições é incrementado pelo servidor; na terceira repetição, o jogador pode reclamar empate ou o servidor detecta automaticamente)
- O que acontece com o rating em partidas abandonadas? (abandono resulta em derrota para o jogador ausente, com penalidade equivalente)
- O que acontece se dois jogadores ficarem sem tempo simultaneamente? (o resultado depende do estado do tabuleiro — se o lado cujo tempo expirou primeiro tiver suficiente material no tabuleiro do oponente para dar xeque, é vitória; caso contrário, empate)
- O que acontece com partidas em andamento durante uma manutenção do servidor? (fora do escopo do MVP — documentado como limitação conhecida)

---

## Requirements *(mandatory)*

### Functional Requirements

**Autenticação e Conta**

- **FR-001**: O sistema MUST permitir que novos usuários criem uma conta fornecendo username único, e-mail único e senha.
- **FR-002**: O sistema MUST validar formato de e-mail e exigir senha com mínimo de 8 caracteres no cadastro.
- **FR-003**: O sistema MUST permitir que usuários cadastrados façam login com e-mail e senha.
- **FR-004**: O sistema MUST encerrar sessões de usuário: tokens JWT expiram em 24 horas após emissão; o logout revoga o token imediatamente via lista de revogação em Redis.
- **FR-005**: O sistema MUST proteger senhas com hash criptográfico — senhas nunca são armazenadas em texto plano.

**Matchmaking**

- **FR-006**: O sistema MUST permitir que um jogador autenticado entre em uma fila de matchmaking escolhendo o modo (casual ou ranqueado); o controle de tempo é fixo em 10+0 no MVP.
- **FR-007**: O sistema MUST emparelhar dois jogadores na mesma fila de modo e controle de tempo e iniciar a partida automaticamente.
- **FR-008**: O sistema MUST permitir que um jogador cancele a busca por adversário antes de ser emparelhado.
- **FR-009**: O sistema MUST permitir que um jogador crie uma sala privada com código único de convite.
- **FR-010**: O sistema MUST permitir que um jogador entre em uma sala privada usando o código de convite.
- **FR-011**: O sistema MUST expirar códigos de convite não utilizados após 24 horas.

**Jogo em Tempo Real**

- **FR-012**: O sistema MUST validar toda e qualquer jogada submetida no servidor antes de aplicá-la ao estado da partida.
- **FR-013**: O sistema MUST rejeitar jogadas ilegais e manter o estado da partida inalterado.
- **FR-014**: O sistema MUST transmitir o estado atualizado do tabuleiro a ambos os jogadores após cada jogada validada.
- **FR-015**: O sistema MUST manter e decrementar o relógio de cada jogador exclusivamente durante a sua vez.
- **FR-016**: O sistema MUST detectar e sinalizar xeque ao rei do jogador cuja vez está prestes a começar.
- **FR-017**: O sistema MUST detectar xeque-mate e encerrar a partida declarando o vencedor.
- **FR-018**: O sistema MUST detectar afogamento (stalemate) e encerrar a partida em empate.
- **FR-019**: O sistema MUST detectar repetição de posição pela terceira vez e encerrar em empate.
- **FR-020**: O sistema MUST detectar a regra dos 50 movimentos sem captura ou avanço de peão e encerrar em empate.
- **FR-021**: O sistema MUST detectar material insuficiente para xeque-mate e encerrar em empate.
- **FR-022**: O sistema MUST encerrar a partida em derrota por tempo quando o relógio de um jogador chegar a zero (salvo material insuficiente do oponente).
- **FR-023**: O sistema MUST permitir que um jogador desista, encerrando a partida com vitória do oponente.
- **FR-024**: O sistema MUST permitir que um jogador ofereça empate ao oponente durante a partida.
- **FR-025**: O sistema MUST permitir que o oponente aceite ou recuse uma oferta de empate.

**Reconexão**

- **FR-026**: O sistema MUST preservar o estado completo da partida (posição, relógio, vez) quando um jogador perde conexão.
- **FR-027**: O sistema MUST continuar decrementando o relógio do jogador desconectado durante o período de graça.
- **FR-028**: O sistema MUST permitir que um jogador desconectado reconecte à sua partida em andamento dentro de 60 segundos.
- **FR-029**: O sistema MUST encerrar a partida por abandono, com vitória do oponente presente, se o jogador não reconectar dentro do período de graça.

**Histórico e PGN**

- **FR-030**: O sistema MUST registrar a sequência completa de movimentos de cada partida em formato PGN ou notação algébrica equivalente.
- **FR-031**: O sistema MUST persistir o resultado final, jogadores, controle de tempo e data de cada partida concluída.
- **FR-032**: O sistema MUST exibir ao jogador a lista de suas partidas passadas com resultado, adversário e data.
- **FR-033**: O sistema MUST permitir que o jogador visualize os movimentos de uma partida passada em notação algébrica.

**Rating e Ranking**

- **FR-034**: O sistema MUST calcular e atualizar o rating de ambos os jogadores ao término de cada partida ranqueada.
- **FR-035**: O sistema MUST exibir a variação de rating (pontos ganhos ou perdidos) ao jogador após cada partida ranqueada.
- **FR-036**: O sistema MUST manter uma tabela de ranking com todos os jogadores ordenados por rating.
- **FR-037**: O sistema MUST exibir no perfil do jogador seu rating atual e posição no ranking.
- **FR-038**: O sistema MUST atribuir rating inicial de 1200 a todo jogador no momento do cadastro.

**Interface e Experiência de Uso**

- **FR-039**: A interface MUST ser responsiva: todas as páginas (login, cadastro, lobby, jogo, histórico, ranking) devem ser utilizáveis em viewports de 360px (mobile) a 1440px+ (desktop), sem scroll horizontal e sem elementos cortados.
- **FR-040**: O tabuleiro MUST renderizar 64 casas perfeitamente quadradas e de tamanho idêntico em qualquer viewport e proporção de tela; o tabuleiro inteiro deve permanecer visível junto com os dois relógios em telas mobile.
- **FR-041**: A interface MUST seguir diretrizes de qualidade de design web (Web Interface Guidelines): alvos de toque ≥ 44px em ações primárias, estados de foco visíveis para navegação por teclado, contraste de texto adequado (WCAG AA), feedback visual em estados de carregamento/erro, e hierarquia tipográfica consistente.
- **FR-042**: Ao selecionar uma peça própria na sua vez, o tabuleiro MUST destacar todas as casas de destino legais daquela peça (incluindo capturas, roque e en passant), calculadas no cliente como pré-validação visual — a validação autoritativa permanece exclusivamente no servidor (FR-012). As peças MUST ser renderizadas com corpo sólido e cor integral (brancas totalmente claras, pretas totalmente escuras), nunca com corpo vazado/transparente.

**Partida contra Bot**

- **FR-043**: O sistema MUST oferecer o modo de partida BOT (HUMAN vs BOT), em que o jogador escolhe a cor das suas peças (brancas ou pretas) e o nível de dificuldade do bot em escala de 0 a 10. O controle de tempo é o mesmo do MVP (10+0).
- **FR-044**: As jogadas do bot MUST ser calculadas exclusivamente no backend; o frontend MUST NOT escolher a jogada do bot nem enviar FEN/estado final. Toda jogada — humana ou do bot — passa pela mesma validação server-side (FR-012).
- **FR-045**: Quando for a vez do bot em uma partida ativa, o backend MUST publicar o evento BOT_THINKING no tópico da partida antes de calcular a jogada, e MOVE_MADE após aplicá-la; se a partida terminar, MUST publicar GAME_OVER.
- **FR-046**: A seleção da jogada do bot MUST usar Strategy Pattern (`BotMoveStrategy` resolvida por `BotDifficultyResolver`), com força estritamente crescente por nível. Níveis 0–3 usam estratégias locais (0 = aleatório; 1–2 = aleatório com preferência por capturas; 3 = guloso por material+posição). Níveis 4–10 MUST usar Stockfish com força **calibrada por Elo** (`UCI_LimitStrength`/`UCI_Elo`) e tempo de cálculo crescente, sendo o nível 10 a força máxima do engine sem limitação. Quando o binário do Stockfish não estiver disponível, cada nível MUST cair para a estratégia local equivalente mais próxima (guloso ou minimax de profundidade 2 a 4) — nunca para jogadas aleatórias. O binário MUST ser compilado na imagem container para funcionar em qualquer arquitetura.
- **FR-047**: Partidas contra bot MUST NOT afetar o rating Elo dos jogadores (apenas partidas RANKED afetam rating). Se o humano joga de pretas, o bot MUST fazer o primeiro lance automaticamente. O modo online existente MUST permanecer funcionando sem alterações de comportamento.

**Robustez e Sessão (Fase 14)**

- **FR-048**: O sistema MUST permitir renovar a sessão sem novo login: um token válido pode ser trocado por um novo token com validade completa (`POST /api/auth/refresh`, com rotação — o token anterior é revogado). O frontend MUST renovar silenciosamente ao carregar a aplicação e MUST redirecionar para o login quando a autenticação WebSocket falhar repetidamente (em vez de reconectar indefinidamente).
- **FR-049**: O evento `GAME_OVER` MUST incluir o PGN final da partida (gerado sincronamente no encerramento), honrando o contrato WebSocket; o processamento assíncrono via fila fica restrito a estatísticas de usuário.
- **FR-050**: Toda modificação do estado vivo de uma partida (Redis) MUST ser serializada por partida (lock por `gameId`, reentrante, com expiração) para eliminar perda de atualização entre lances concorrentes, schedulers e desistências simultâneas.
- **FR-051**: O usuário-sistema do bot MUST NOT aparecer na tabela de ranking nem ser contado no total de jogadores ou no cálculo de posição de perfis.

**Prontidão para Produção (Fase 15)**

- **FR-052**: O sistema MUST recusar-se a iniciar quando o segredo JWT não for fornecido por ambiente ou for igual ao valor de desenvolvimento, e MUST exigir no mínimo 32 bytes.
- **FR-053**: O token de sessão MUST ser transportado em cookie `HttpOnly`, `SameSite=Lax` e `Secure` (fora de desenvolvimento), inacessível a JavaScript; a autenticação do WebSocket MUST usar o mesmo cookie no handshake.
- **FR-054**: As origens permitidas por CORS MUST ser configuráveis por variável de ambiente.
- **FR-055**: Endpoints de autenticação (`/api/auth/login`, `/api/auth/register`, `/api/auth/password-reset/**`) MUST ter limite de tentativas por IP, respondendo `429` quando excedido.
- **FR-056**: Respostas HTTP MUST incluir cabeçalhos de segurança: HSTS (produção), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e CSP.
- **FR-057**: O sistema MUST expor endpoint de saúde (`/actuator/health`) para orquestradores e métricas para observabilidade.
- **FR-058**: O sistema MUST ser distribuível como imagens container (backend e frontend) e subir integralmente via `docker compose`.
- **FR-059**: Tarefas agendadas MUST usar lock distribuído, garantindo execução única mesmo com múltiplas instâncias.
- **FR-060**: O sistema MUST permitir recuperação de senha por token de uso único com validade curta (`POST /api/auth/password-reset/request` e `/confirm`).
- **FR-061**: O sistema MUST permitir que o usuário exclua a própria conta (LGPD) e MUST publicar Termos de Uso e Política de Privacidade acessíveis sem autenticação.
- **FR-062**: Na promoção de peão, o jogador MUST escolher a peça (dama, torre, bispo ou cavalo) em vez de promoção automática.
- **FR-063**: O matchmaking MUST parear preferencialmente jogadores de rating próximo, com janela que aumenta conforme o tempo de espera.
- **FR-064**: O link de recuperação de senha MUST ser entregue por e-mail via SMTP quando o servidor estiver configurado, em mensagem multipart (texto e HTML) contendo o link, o prazo de validade e aviso de que o pedido pode ser ignorado se não foi feito pelo titular. O envio MUST ser assíncrono, para não bloquear a resposta HTTP nem permitir enumeração de contas por diferença de tempo de resposta. Sem SMTP configurado, o sistema MUST continuar operando com a entrega por log (desenvolvimento). Falha de envio MUST NOT expor erro ao solicitante.

**Internacionalização (Fase 17)**

- **FR-065**: A interface MUST estar disponível em inglês e português, com **inglês como idioma padrão** para novos visitantes. A troca MUST estar acessível no canto superior direito de qualquer página e MUST persistir entre visitas e recarregamentos.
- **FR-066**: A tradução MUST cobrir toda a interface visível: navegação, formulários, mensagens de erro e validação, estados do jogo, histórico, ranking, perfil, e-mail de recuperação de senha e as páginas de Termos de Uso e Política de Privacidade. Rótulos de acessibilidade (`aria-label`) MUST ser traduzidos junto. Datas e números MUST ser formatados conforme o idioma ativo, e o atributo `lang` do documento MUST refletir o idioma selecionado.

### Key Entities

- **Usuário**: representa um jogador cadastrado; possui username único, e-mail, rating, estatísticas de partidas (vitórias, derrotas, empates).
- **Partida**: representa um jogo disputado ou em andamento; associada a dois jogadores, com modo (casual/ranqueado), controle de tempo, cor de cada jogador, status (aguardando, em andamento, encerrada) e resultado.
- **Movimento**: representa uma jogada dentro de uma partida; possui notação algébrica, timestamp e ordem sequencial.
- **SessãoDeJogo**: representa o estado ao vivo de uma partida em andamento; inclui posição atual do tabuleiro (FEN), relógio de cada jogador, vez do jogador ativo e status de conexão de cada jogador.
- **ConviteDePartida**: representa um convite para sala privada; associado ao criador, configurações da partida, código único e data de expiração.
- **Rating**: representa o rating competitivo de um jogador; inclui valor atual e histórico de variações por partida.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um novo usuário consegue criar conta, entrar em uma fila e iniciar sua primeira partida em menos de 5 minutos a partir do primeiro acesso.
- **SC-002**: O matchmaking em fila pública encontra um adversário e inicia a partida em até 60 segundos durante operação normal da plataforma.
- **SC-003**: Ambos os jogadores veem o tabuleiro atualizado com a nova jogada em menos de 500ms após a submissão de um movimento válido.
- **SC-004**: 100% das jogadas ilegais submetidas são rejeitadas pelo sistema — nenhuma jogada inválida é aplicada ao estado da partida.
- **SC-005**: Um jogador que perde conexão e retorna dentro de 60 segundos consegue retomar a partida em andamento sem perder o jogo por abandono.
- **SC-006**: Todas as condições de término de partida (xeque-mate, tempo, afogamento, empate por acordo, desistência, abandono) são detectadas e processadas corretamente em 100% dos casos.
- **SC-007**: O rating de ambos os jogadores é atualizado e visível dentro de 5 segundos após o encerramento de uma partida ranqueada.
- **SC-008**: Um jogador consegue acessar e visualizar a notação PGN de qualquer partida de seu histórico a qualquer momento após o encerramento da partida.
- **SC-009**: A tabela de ranking reflete os ratings mais recentes em até 10 segundos após qualquer atualização.
- **SC-010**: Todas as páginas são utilizáveis em viewport de 360px sem scroll horizontal; o tabuleiro mantém casas perfeitamente quadradas (variação 0px entre casas) em qualquer largura de tela.

---

## Assumptions

- Regras FIDE padrão de xadrez se aplicam, incluindo roque (kingside e queenside), en passant, promoção de peão (com escolha de peça pelo jogador) e todas as condições de empate regulamentares.
- O único controle de tempo do MVP é 10+0 (10 minutos por jogador, sem incremento); controles adicionais são adicionados em futuras iterações.
- A atribuição de cor (brancas/pretas) é determinada aleatoriamente pelo sistema tanto no matchmaking público quanto em salas privadas.
- O algoritmo de cálculo de rating padrão é o sistema Elo; o sistema é projetado para suportar algoritmos alternativos no futuro.
- O período de graça para reconexão é de 60 segundos; este valor pode ser ajustado por configuração do sistema.
- Todo jogador inicia com rating 1200 ao se cadastrar.
- A validade de um convite de sala privada é de 24 horas a partir da criação.
- Partidas casuais não afetam o rating dos jogadores.
- Social login (Google, GitHub etc.) está fora do escopo do MVP.
- Funcionalidades de espectadores, chat, bots, análise de partidas e torneios estão fora do escopo do MVP, mas a arquitetura deve permitir sua adição futura sem reescrita do núcleo.
- O aplicativo é acessível via navegador web desktop e mobile (interface responsiva); apps nativos estão fora do escopo do MVP.
- Anti-trapaça no MVP consiste em: (1) validação completa de jogadas no servidor (nenhuma jogada ilegal é aceita) e (2) rate limiting de submissão de jogadas. Análise comportamental avançada é fora do escopo do MVP.
- Manutenção do servidor pode interromper partidas em andamento — este é um risco conhecido e aceito para o MVP, sem mecanismo de recuperação automática nesse cenário.
