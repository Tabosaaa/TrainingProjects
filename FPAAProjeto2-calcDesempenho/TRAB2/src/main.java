import java.util.Scanner;

public class main {

	public static void main(String[] args) {
		menu();
	}
	
	public static void menu() {
	 	Scanner scanner = new Scanner(System.in);
        System.out.println("Digite a questão (1 ou 2) do trabalho que deseja executar: ");

        int escolha = scanner.nextInt();

        switch (escolha) {
            case 1:
            	questoes.questao1();
                break;
        
            case 2:
                questoes.questao2();
                break;

            default:
                System.out.println("Opção inválida!");
                break;
        }
	}
}