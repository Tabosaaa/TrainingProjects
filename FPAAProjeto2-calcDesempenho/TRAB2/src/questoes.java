import java.util.Arrays;
import java.util.Random;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.IOException;

public class questoes {

	public static final int[] TAMANHO_VETORES = { 62500, 125000, 250000, 375000 };
	private static final int VALOR_MAX = 1000000;
	private static final int NUM_TESTES = 50;
	public static final String ANSI_RESET = "\u001B[0m";
	public static final String ANSI_RED = "\u001B[31m";
	public static final String ANSI_GREEN = "\u001B[32m";
	public static final int NUM_TESTES_Q2 = 10;	
	public static final int TAM_VET_TEST_QUICK = 10000;

	public static void questao1() {

		long tempoInicialSelecao , tempoInicialMerge;
		long tempoFinalSelecao, tempoFinalMerge;
		long tempoMedioSelecao, tempoMediolMerge;
		long tempoTotalSelecao, tempoTotalMerge;
		int[] vetor;

		for (int i = 0; i < TAMANHO_VETORES.length; i++) {
			tempoInicialSelecao = System.currentTimeMillis();
			for (int j = 0; j < NUM_TESTES; j++) {
				vetor = criarVetorAleatorio(TAMANHO_VETORES[i]);
				try {
					metodos.selecao(vetor);

					System.out.println(
							ANSI_GREEN + "Teste " + (j + 1) + " do método de SELECAO e do vetor com tamanho de "
									+ TAMANHO_VETORES[i] + " posições foi um SUCESSO" + ANSI_RESET);
				} catch (Exception e) {
					System.out
							.println(ANSI_RED + "Teste " + (j + 1) + " do método de SELECAO e do vetor com tamanho de "
									+ TAMANHO_VETORES[i] + " posições foi um FRACASSO" + ANSI_RESET);
				}

			}
			tempoFinalSelecao = System.currentTimeMillis();
			tempoTotalSelecao = tempoFinalSelecao - tempoInicialSelecao;
			tempoMedioSelecao = tempoTotalSelecao/NUM_TESTES;
			
			
			tempoInicialMerge = System.currentTimeMillis();
			for (int j = 0; j < NUM_TESTES; j++) {
				vetor = criarVetorAleatorio(TAMANHO_VETORES[i]);
				try {
					metodos.mergeSort(vetor, vetor.length);

					System.out.println(
							ANSI_GREEN + "Teste " + (j + 1) + " do método de MERGE SORT e do vetor com tamanho de "
									+ TAMANHO_VETORES[i] + " posições foi um SUCESSO" + ANSI_RESET);
				} catch (Exception e) {
					System.out.println(
							ANSI_RED + "Teste " + (j + 1) + " do método de MERGE SORT e do vetor com tamanho de "
									+ TAMANHO_VETORES[i] + " posições foi um FRACASSO" + ANSI_RESET);
					e.printStackTrace();
				}
			}
			tempoFinalMerge = System.currentTimeMillis();
			tempoTotalMerge = tempoFinalMerge - tempoInicialMerge;
			tempoMediolMerge = tempoTotalMerge/NUM_TESTES; 
			
			salvarTemposEmArquivo(tempoTotalSelecao, tempoMedioSelecao, tempoTotalMerge, tempoMediolMerge, TAMANHO_VETORES[i]);

		}
	
	}

	public static void questao2() {
		long tempoInicial,tempoFinal,tempoMedio,tempoTotal,tempoFinalOrdenado = 0,tempoInicialOrdenado,tempoMedioOrdenado,tempoTotalOrdenado = 0,tempoAux  = 0;
		int[] vetor;
		
		tempoInicial = System.currentTimeMillis();
		for(int i = 0 ; i < NUM_TESTES_Q2; i++ ) {
			 try {
				vetor = criarVetorAleatorio(TAM_VET_TEST_QUICK);
				 metodos.quickSort(vetor, 0, vetor.length - 1);
				 System.out.println(
							ANSI_GREEN+ "Teste " + (i + 1) + " do método de QUICK SORT NÃO ORDENADO do vetor com tamanho de "
									+ TAM_VET_TEST_QUICK + " posições foi um SUCESSO" + ANSI_RESET);
			} catch (Exception e) {
				System.out.println(
						ANSI_RED + "Teste " + (i + 1) + " do método de QUICK SORT NÃO ORDENADO do vetor com tamanho de "
								+ TAM_VET_TEST_QUICK + " posições foi um FRACASSO" + ANSI_RESET);
				e.printStackTrace();
			}
		} 
		tempoFinal = System.currentTimeMillis();
		tempoTotal = tempoFinal - tempoInicial;
		tempoMedio = tempoTotal / NUM_TESTES_Q2;
		
		
		
		tempoInicialOrdenado = System.currentTimeMillis();
		for(int i = 0 ; i < NUM_TESTES_Q2; i++ ) {
			 try {
				 vetor = criarVetorAleatorioOrdenado(TAM_VET_TEST_QUICK);
				 metodos.quickSort(vetor, 0, vetor.length - 1);
				 System.out.println(
							ANSI_GREEN+ "Teste " + (i + 1) + " do método de QUICK SORT ORDENADO do vetor com tamanho de "
									+ TAM_VET_TEST_QUICK + " posições foi um SUCESSO" + ANSI_RESET);
			} catch (Exception e) {
				System.out.println(
						ANSI_RED + "Teste " + (i + 1) + " do método de QUICK SORT ORDENADO e do vetor com tamanho de "
								+ TAM_VET_TEST_QUICK + " posições foi um FRACASSO" + ANSI_RESET);
				e.printStackTrace();
			}
		} 
		tempoFinalOrdenado = System.currentTimeMillis();
		tempoTotalOrdenado = tempoFinalOrdenado - tempoInicialOrdenado;
		tempoMedioOrdenado = tempoTotalOrdenado / NUM_TESTES_Q2;
		
		salvarTemposEmArquivoQDois(tempoTotal , tempoMedio , tempoTotalOrdenado, tempoMedioOrdenado , TAM_VET_TEST_QUICK);
	}
	

	public static int[] criarVetorAleatorio(int tamanho) {
		int[] vetor = new int[tamanho];
		Random random = new Random();

		for (int i = 0; i < tamanho; i++) {
			vetor[i] = 1 + random.nextInt(VALOR_MAX);
		}

		return vetor;
	}
	
	public static int[] criarVetorAleatorioOrdenado(int tamanho) {
		int[] vetor = new int[tamanho];
		vetor = criarVetorAleatorio(tamanho);
		Arrays.sort(vetor);
		
		return vetor;
	}

	public static void salvarTemposEmArquivo(long tempoTotalSelecao, long tempoMedioSelecao, long tempoTotalMergeSort,
			long tempoMedioMergeSort, int tamanhoDoVetor) {
		String nomeArquivo = "temposDeExecucao" + tamanhoDoVetor + ".txt";

		try (PrintWriter writer = new PrintWriter(new FileWriter(nomeArquivo, true))) {
			writer.println("Tempo total de execução do Selecao: " + tempoTotalSelecao + " ms");
			writer.println("Tempo médio de execução do Selecao: " + tempoMedioSelecao + " ms");
			writer.println("Tempo total de execução do Merge Sort: " + tempoTotalMergeSort + " ms");
			writer.println("Tempo médio de execução do Merge Sort: " + tempoMedioMergeSort + " ms");
			System.out.println("Tempos de execução salvos com sucesso!");
		} catch (IOException e) {
			System.out.println("Ocorreu um erro ao salvar os tempos de execução: " + e.getMessage());
		}
	}
	
	public static void salvarTemposEmArquivoQDois(long tempoTotal, long tempoMedio, long tempoTotalOrdenado, long tempoMedioOrdenado , int tamanhoDoVetor) {
		String nomeArquivo = "temposDeExecucaoQDois" + tamanhoDoVetor + ".txt";
		try (PrintWriter writer = new PrintWriter(new FileWriter(nomeArquivo, true))) {
			writer.println("Tempo total de execução do Quick Sort NÃO ORDENADO: " + tempoTotal + " ms");
			writer.println("Tempo médio de execução do Quick Sort NÃO ORDENADO: " + tempoMedio + " ms");
			writer.println("Tempo total de execução do Quick Sort ORDENADO: " + tempoTotalOrdenado+ " ms");
			writer.println("Tempo médio de execução do Quick Sort ORDENADO: " + tempoMedioOrdenado + " ms");
			System.out.println("Tempos de execução salvos com sucesso!");
		} catch (IOException e) {
			System.out.println("Ocorreu um erro ao salvar os tempos de execução: " + e.getMessage());
		}
		
	}

}
