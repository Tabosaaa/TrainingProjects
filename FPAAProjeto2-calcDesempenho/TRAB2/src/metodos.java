
public class metodos {

	public static void selecao(int[] vetor) {
		for (int i = 0; i < vetor.length - 1; i++) {
			int min = i;
			for (int j = i + 1; j < vetor.length; j++) {
				if (vetor[j] < vetor[min]) {
					min = j;
				}
			}
			int aux = vetor[min];
			vetor[min] = vetor[i];
			vetor[i] = aux;
		}
	}

	public static void mergeSort(int[] a, int n) {
		if (n < 2) {
			return;
		}
		int mid = n / 2;
		int[] l = new int[mid];
		int[] r = new int[n - mid];

		for (int i = 0; i < mid; i++) {
			l[i] = a[i];
		}
		for (int i = mid; i < n; i++) {
			r[i - mid] = a[i];
		}
		mergeSort(l, mid);
		mergeSort(r, n - mid);

		merge(a, l, r, mid, n - mid);
	}

	private static void merge(int[] a, int[] l, int[] r, int left, int right) {

		int i = 0, j = 0, k = 0;
		while (i < left && j < right) {
			if (l[i] <= r[j]) {
				a[k++] = l[i++];
			} else {
				a[k++] = r[j++];
			}
		}
		while (i < left) {
			a[k++] = l[i++];
		}
		while (j < right) {
			a[k++] = r[j++];
		}
	}
	
	
	public static void quickSort(int[] vetor, int inicio, int fim) {
	    if(fim > inicio) {
	        int indexPivo = dividir(vetor, inicio, fim);
	    
	        quickSort(vetor, inicio, indexPivo - 1);

	        quickSort(vetor, indexPivo + 1, fim);
	      }
	    }
	
	private static int dividir(int[] vetor, int inicio, int fim) {
	    int pivo, pontEsq, pontDir = fim;
	    pontEsq = inicio + 1;
	    pivo = vetor[inicio];

	    while(pontEsq <= pontDir) {
	      while(pontEsq <= pontDir && vetor[pontEsq] <= pivo) {
	        pontEsq++;
	      }
	      while(pontDir >= pontEsq && vetor[pontDir] > pivo) {
	        pontDir--;
	      }
	      if(pontEsq < pontDir) {
	        trocar(vetor, pontDir, pontEsq);
	        pontEsq++;
	        pontDir--;
	      }
	    }

	    trocar(vetor, inicio, pontDir);
	    return pontDir;
	  }
	
	private static void trocar(int[] vetor, int i, int j) {
	    int temp = vetor[i];
	    vetor[i] = vetor[j];
	    vetor[j] = temp;
	  }
}
