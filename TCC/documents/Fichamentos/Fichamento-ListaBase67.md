# An Empirical Study of High Performance Computing (HPC) Performance Bugs

M. A. K. Azad, N. Iqbal, F. Hassan, and P. Roy, "An Empirical Study of High Performance Computing (HPC) Performance Bugs," in *2023 IEEE/ACM 20th International Conference on Mining Software Repositories (MSR)*, Melbourne, Australia, 2023, pp. 194-206. doi: [10.1109/MSR59073.2023.00037](https://doi.org/10.1109/MSR59073.2023.00037)

## 1. Fichamento de Conteúdo

Este artigo realiza um estudo empírico dos bugs relacionados ao desempenho em aplicações de computação de alto desempenho (HPC). O objetivo principal do estudo é identificar e categorizar os tipos mais comuns de problemas de desempenho encontrados em aplicações HPC, além de analisar como esses problemas são resolvidos e avaliar o esforço e a experiência necessários para sua correção. Os autores analisaram manualmente 1729 commits de desempenho, selecionando 186 commits reais de desempenho em 23 projetos de código aberto. Através dessa análise detalhada, identificaram que a implementação ineficiente de algoritmos (39,3%), código inadequado para microarquitetura específica (31,2%) e paralelismo ausente ou ineficiente (14,5%) são as categorias mais frequentes. Além disso, identificaram que as correções são geralmente complexas (mediana de 35 linhas modificadas por commit) e feitas por desenvolvedores com alta experiência técnica.

## 2. Fichamento Bibliográfico 

* _Implementação Ineficiente de Algoritmos e Estruturas de Dados_: categoria mais frequente de problemas de desempenho, responsável por 39,3% dos casos analisados, envolvendo operações desnecessárias, redundantes ou computacionalmente caras (página 196).

* _Código Ineficiente para Microarquitetura Específica_: segunda categoria mais prevalente (31,2%), abrangendo questões como acesso ineficiente à memória (CPU/GPU), geração subótima de código por compiladores, e falta de otimização específica para hardware (página 197).

* _Paralelismo Ausente ou Ineficiente_: responsável por 14,5% dos problemas, incluindo falhas em explorar o paralelismo disponível ou sua implementação inadequada, gerando sobrecarga e desequilíbrio na distribuição das tarefas (página 199).

* _Gerenciamento Ineficiente de Memória_: inclui vazamentos de memória, alocações repetidas ou redundantes, e uso inadequado de estruturas de dados que degradam o desempenho das aplicações HPC (página 200).

## 3. Fichamento de Citações 

* _"Performance bug fixes are complicated with a median patch size (LOC) of 35 lines and are mostly fixed by experienced developers." (página 194)_

* _"We identified 186 performance issues [...] Our analysis identifies that inefficient algorithm implementation (39.3%), inefficient code for target micro-architecture (31.2%), and missing parallelism and inefficient parallelization (14.5%) are the top three most prevalent categories." (página 194)_

* _"Highly skilled developers are limited in number. As a result, maintaining highly performant scientific applications becomes challenging." (página 202)_

* _"We created an HPC performance bug taxonomy with 10 main categories of performance bugs." (página 195)_

* _"The HPC developer community requires innovation in performance analysis tools, performance portable frameworks and runtimes, and recommender systems for writing high performance code." (página 203)_
