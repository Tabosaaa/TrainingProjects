

# Faster sorting algorithms discovered using deep reinforcement learning
 
D. J. Mankowitz, A. Michi, A. Zhernov, M. Gelmi, M. Selvi, C. Paduraru, E. Leurent, S. Iqbal, J.-B. Lespiau, A. Ahern, et al., "Faster sorting algorithms discovered using deep reinforcement learning," in *Nature*, vol. 618, pp. 257-263, June 2023. doi: [10.1038/s41586-023-06004-9](https://doi.org/10.1038/s41586-023-06004-9)
 
## 1. Fichamento de Conteúdo
 
O artigo aborda a aplicação de aprendizado por reforço profundo (DRL) na descoberta automática de algoritmos de ordenação mais rápidos do que os existentes. Dado que algoritmos como ordenação são fundamentais para diversas aplicações e já se encontram altamente otimizados por especialistas humanos, melhorá-los é uma tarefa complexa. O método proposto pelos autores transforma o problema de otimização de algoritmos de ordenação em um jogo individual, denominado AssemblyGame, no qual um agente DRL chamado AlphaDev seleciona instruções assembly de baixo nível para criar algoritmos eficientes. AlphaDev, utilizando redes neurais baseadas em Transformers e busca em árvore Monte Carlo, foi capaz de descobrir novos algoritmos que superaram significativamente benchmarks humanos em termos de tamanho e latência, incluindo algoritmos fixos (sort 3, 4 e 5) e variáveis (VarSort3, 4 e 5). Esses algoritmos foram integrados na biblioteca padrão de ordenação em C++ do LLVM, marcando um avanço importante na aplicação prática de métodos automáticos de geração de código.
 
## 2. Fichamento Bibliográfico 
 
* _AssemblyGame_ é um modelo onde o problema de otimização de algoritmos é tratado como um jogo individual, em que o objetivo é criar algoritmos eficientes utilizando instruções de baixo nível (assembly). O agente precisa explorar um espaço combinatorial enorme para encontrar soluções corretas e eficientes (página 258).
  
* _AlphaDev_ é o agente de aprendizado por reforço profundo utilizado para descobrir algoritmos eficientes automaticamente, sendo composto por redes neurais baseadas em Transformers e uma busca guiada por árvore Monte Carlo (MCTS), sendo capaz de gerar algoritmos com desempenho superior ao de benchmarks humanos (página 259).
 
* _Algoritmos fixos de ordenação_ são aqueles que ordenam sequências de tamanho fixo (por exemplo, três elementos). AlphaDev obteve melhores resultados que os algoritmos tradicionais neste contexto, reduzindo o tamanho das soluções em termos de instruções e latência (página 260).
 
* _Algoritmos variáveis de ordenação_ podem ordenar sequências de diferentes tamanhos, até um máximo predefinido. Nesses algoritmos, AlphaDev também conseguiu melhorias consideráveis, especialmente no caso de VarSort4 e VarSort5, otimizando diretamente a latência real (página 260).
 
## 3. Fichamento de Citações 
 
* _"AlphaDev discovered small sorting algorithms from scratch that outperformed previously known human benchmarks. These algorithms have been integrated into the LLVM standard C++ sort library." (página 257)_
 
* _"The hardness of the AssemblyGame arises not only from the size of the search space [...] but also from the nature of the reward function. A single incorrect instruction in the AssemblyGame can potentially invalidate the entire algorithm." (página 257)_
 
* _"The AlphaDev learning algorithm can incorporate both DRL as well as stochastic search optimization algorithms to play AssemblyGame." (página 258)_
 
* _"We implemented a dual value function setup, whereby AlphaDev has two value function heads: one predicting algorithm correctness and the second predicting algorithm latency." (página 259)_
 
* _"We reverse engineered the low-level assembly sorting algorithms discovered by AlphaDev for sort 3, sort 4 and sort 5 to C++ and discovered that our sort implementations led to improvements of up to 70% for sequences of length five." (página 262)_