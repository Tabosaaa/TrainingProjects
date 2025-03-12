# Playing Atari with Deep Reinforcement Learning

* V. Mnih, K. Kavukcuoglu, D. Silver, A. Graves, I. Antonoglou, D. Wierstra, and M. Riedmiller, "Playing Atari with Deep Reinforcement Learning," *arXiv preprint*, 2013. Disponível em: [https://arxiv.org/abs/1312.5602](https://arxiv.org/abs/1312.5602)

## 1. Fichamento de Conteúdo

O artigo apresenta um modelo inovador de aprendizado profundo por reforço (Deep Reinforcement Learning - DRL) capaz de aprender políticas de controle diretamente a partir de entradas sensoriais complexas, especificamente imagens de jogos Atari 2600. O método combina redes neurais convolucionais com o algoritmo Q-learning, gerando um agente (Deep Q-Network ou DQN) que aprende exclusivamente a partir dos pixels das imagens e dos sinais de recompensa do ambiente. A abordagem se destaca por não utilizar informações específicas dos jogos ou características visuais pré-definidas, sendo treinada com técnicas como experiência de repetição (experience replay) para reduzir problemas associados à alta correlação entre as amostras. Os resultados demonstram que este modelo superou os métodos anteriores em seis dos sete jogos testados e superou o desempenho humano especialista em três deles, destacando o potencial do DRL em tarefas de controle baseadas em dados visuais complexos.

## 2. Fichamento Bibliográfico

* **Deep Q-Network (DQN)**: Rede neural convolucional que aprende a estimar o valor das ações possíveis em cada estado do jogo, baseada em entradas visuais de alta dimensão, usando o algoritmo Q-learning com gradiente descendente estocástico e experience replay (página 4).

* **Experience Replay**: Técnica que armazena experiências passadas do agente (transições de estado, ação e recompensa) e as reutiliza de forma aleatória para treinar a rede neural, reduzindo a correlação das amostras e melhorando a estabilidade do aprendizado (página 4).

* **Entrada Visual Direta**: Ao contrário de métodos anteriores que exigiam pré-processamento manual das imagens, o DQN aprende diretamente dos pixels das imagens, permitindo que a rede neural descubra automaticamente características importantes para o desempenho do jogo (página 5).

* **Política ε-Greedy**: Durante o treinamento, a ação do agente é selecionada de maneira exploratória (aleatória) com probabilidade ε, garantindo um equilíbrio entre exploração e exploração efetiva dos conhecimentos adquiridos (página 5).

## 3. Fichamento de Citações

* _"We present the first deep learning model to successfully learn control policies directly from high-dimensional sensory input using reinforcement learning."_ (página 1)

* _"The network was not provided with any game-specific information or hand-designed visual features, and was not privy to the internal state of the emulator; it learned from nothing but the video input, the reward and terminal signals, and the set of possible actions."_ (página 1)

* _"We use an experience replay mechanism which randomly samples previous transitions, and thereby smooths the training distribution over many past behaviors."_ (página 1)

* _"So far the network has outperformed all previous RL algorithms on six of the seven games we have attempted and surpassed an expert human player on three of them."_ (página 1)

* _"Our approach gave state-of-the-art results in six of the seven games it was tested on, with no adjustment of the architecture or hyperparameters."_ (página 7)