import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class metodosTest {

	@Test
	public void mergeSortTest() {
	    int[] actual = { 5, 1, 6, 2, 3, 4 };
	    int[] expected = { 1, 2, 3, 4, 5, 6 };
	    metodos.mergeSort(actual, actual.length);
	    assertArrayEquals(expected, actual);
	}
	
	@Test
	public void selecaoTest() {
	    int[] actual = { 5, 1, 6, 2, 3, 4 };
	    int[] expected = { 1, 2, 3, 4, 5, 6 };
	    metodos.selecao(actual);
	    assertArrayEquals(expected, actual);
	}
	
	@Test
	public void quickTest() {
		int[] actual = { 5, 1, 6, 2, 3, 4 };
	    int[] expected = { 1, 2, 3, 4, 5, 6 };
	    metodos.quickSort(actual, 0 , actual.length - 1);
	    assertArrayEquals(expected, actual);
	}
}
