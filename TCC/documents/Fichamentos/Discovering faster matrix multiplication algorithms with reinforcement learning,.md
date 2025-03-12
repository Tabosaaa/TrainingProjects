# Discovering faster matrix multiplication algorithms with reinforcement learning

* A. Fawzi, M. Balog, A. Huang, T. Hubert, B. Romera-Paredes, M. Barekatain, A. Novikov, F. J. R. Ruiz, J. Schrittwieser, G. Swirszcz, D. Silver, D. Hassabis, and P. Kohli, "Discovering faster matrix multiplication algorithms with reinforcement learning," in *Nature*, vol. 610, pp. 47-53, Oct. 2022. doi: [10.1038/s41586-022-05172-4](https://doi.org/10.1038/s41586-022-05172-4)

## 1. Fichamento de Conteúdo

O artigo apresenta o uso de aprendizado por reforço profundo para descobrir algoritmos de multiplicação de matrizes mais rápidos que os algoritmos conhecidos anteriormente. Os autores desenvolveram o agente AlphaTensor, baseado no método AlphaZero, que joga um jogo chamado TensorGame, no qual a multiplicação de matrizes é representada por decomposições tensoriais. Este método automático conseguiu descobrir algoritmos que superam os métodos tradicionais, incluindo a melhoria histórica sobre o algoritmo de Strassen para multiplicação de matrizes 4×4, que permaneceu imbatível por mais de 50 anos. AlphaTensor também mostrou flexibilidade, podendo otimizar algoritmos específicos para diferentes arquiteturas de hardware, proporcionando melhor desempenho prático em GPUs e TPUs.

## 2. Fichamento Bibliográfico

* _AlphaTensor e TensorGame_: Trata o problema de multiplicação de matrizes como um jogo (TensorGame), em que o agente escolhe operações para decompor tensores, buscando o menor número de passos possível (página 48).

* _Algoritmo de Strassen_: O algoritmo de Strassen é um método eficiente para multiplicar matrizes. Ao invés do método tradicional que utiliza oito multiplicações para multiplicar duas matrizes 2x2, o algoritmo de Strassen realiza a operação com apenas sete multiplicações, reduzindo o tempo computacional significativamente para matrizes grandes. A ideia básica é combinar somas e subtrações das matrizes originais para formar sete novos produtos intermediários, a partir dos quais é possível recompor o resultado final com menos operações do que o método convencional. Essa abordagem reduz o custo computacional geral, especialmente em matrizes maiores, apesar de ser mais complexo e consumir mais memória devido ao uso adicional dessas operações intermediárias. (página 49).

* _Flexibilidade de aplicação_: AlphaTensor demonstrou capacidade em diversos contextos, incluindo otimização específica para hardware (GPUs e TPUs), atingindo ganhos significativos de eficiência prática (página 52).

* _Uso de aprendizado por reforço profundo (DRL)_: Combinou aprendizado por reforço profundo com busca em árvore Monte Carlo, estratégias de mudança de base e demonstrações sintéticas, superando limitações das abordagens tradicionais na descoberta automática de algoritmos (página 50).

## 3. Fichamento de Citações

* _"AlphaTensor discovered algorithms that outperform the state-of-the-art complexity for many matrix sizes." (página 47)_

* _"AlphaTensor’s algorithm improves on Strassen’s two-level algorithm for the first time, to our knowledge, since its discovery 50 years ago." (página 47)_

* _"AlphaTensor generates a large database of matrix multiplication algorithms—up to thousands of algorithms for each size, indicating that the space of algorithms is richer than previously thought." (página 51)_

* _"Our results highlight AlphaTensor’s ability to accelerate the process of algorithmic discovery on a range of problems, and to optimize for different criteria." (página 47)_
