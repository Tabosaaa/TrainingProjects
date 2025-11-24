import requests
import time
import json

API_BASE_URL = "http://localhost:8000"

COLORS = {
    'HEADER': '\033[95m',
    'OKBLUE': '\033[94m',
    'OKCYAN': '\033[96m',
    'OKGREEN': '\033[92m',
    'WARNING': '\033[93m',
    'FAIL': '\033[91m',
    'ENDC': '\033[0m',
    'BOLD': '\033[1m',
}

def print_colored(text, color='ENDC'):
    print(f"{COLORS.get(color, '')}{text}{COLORS['ENDC']}")

def print_header(text):
    print("\n" + "="*80)
    print_colored(f"  {text}", 'BOLD')
    print("="*80 + "\n")

def verificar_servico():
    print_colored("Verificando se o List Service está rodando...", 'OKCYAN')
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=3)
        if response.status_code == 200:
            print_colored("List Service está online", 'OKGREEN')
            return True
        else:
            print_colored("List Service respondeu com status não esperado", 'WARNING')
            return False
    except requests.exceptions.ConnectionError:
        print_colored("List Service não está rodando", 'FAIL')
        print_colored("Execute: python list_service.py", 'WARNING')
        return False
    except Exception as e:
        print_colored(f"Erro ao conectar: {e}", 'FAIL')
        return False

def listar_compras():
    print_header("LISTANDO LISTAS DE COMPRAS DISPONÍVEIS")
    
    try:
        response = requests.get(f"{API_BASE_URL}/lists")
        
        if response.status_code == 200:
            data = response.json()
            print_colored(f"Total de listas: {data['total']}", 'OKBLUE')
            print()
            
            for lista in data['lists']:
                print_colored(f"Lista #{lista['id']}", 'BOLD')
                print(f"  Usuário: {lista['user_email']} (ID: {lista['user_id']})")
                print(f"  Status: {lista['status']}")
                print(f"  Itens ({len(lista['items'])}):")
                
                total = 0
                for item in lista['items']:
                    item_total = item['quantity'] * item['price']
                    total += item_total
                    print(f"     {item['name']}: {item['quantity']}x R$ {item['price']:.2f} = R$ {item_total:.2f}")
                
                print_colored(f"  Total: R$ {total:.2f}", 'OKGREEN')
                print()
            
            return data['lists']
        else:
            print_colored(f"Erro ao listar: Status {response.status_code}", 'FAIL')
            return []
            
    except Exception as e:
        print_colored(f"Erro: {e}", 'FAIL')
        return []

def fazer_checkout(list_id):
    print_header(f"FAZENDO CHECKOUT DA LISTA #{list_id}")
    
    try:
        inicio = time.time()
        response = requests.post(f"{API_BASE_URL}/lists/{list_id}/checkout")
        tempo_resposta = (time.time() - inicio) * 1000
        
        print_colored(f"Tempo de resposta: {tempo_resposta:.2f}ms", 'OKCYAN')
        print()
        
        if response.status_code == 202:
            data = response.json()
            print_colored("CHECKOUT ACEITO (202 Accepted)", 'OKGREEN')
            print(f"   Status: {data['status']}")
            print(f"   Mensagem: {data['message']}")
            print(f"   Processamento: {data['processing']}")
            print()
            print_colored("Verifique os terminais dos Consumers", 'WARNING')
            return True
            
        elif response.status_code == 400:
            data = response.json()
            print_colored(f"{data['detail']}", 'WARNING')
            return False
            
        elif response.status_code == 404:
            print_colored("Lista não encontrada", 'FAIL')
            return False
            
        else:
            print_colored(f"Erro: Status {response.status_code}", 'FAIL')
            print(response.text)
            return False
            
    except Exception as e:
        print_colored(f"Erro ao fazer checkout: {e}", 'FAIL')
        return False

def aguardar_processamento(segundos=3):
    print()
    print_colored(f"Aguardando {segundos} segundos para processamento dos eventos...", 'OKCYAN')
    for i in range(segundos):
        print(f"   {'#' * (i + 1)}{'-' * (segundos - i - 1)} {i + 1}s")
        time.sleep(1)
    print()

def teste_completo():
    print_colored("""
================================================================================
                 TESTE AUTOMATIZADO - SISTEMA DE MENSAGERIA
                        Lista de Compras + RabbitMQ
================================================================================
    """, 'HEADER')
    
    if not verificar_servico():
        return
    
    print()
    time.sleep(1)
    
    listas = listar_compras()
    
    if not listas:
        print_colored("Nenhuma lista disponível para teste", 'FAIL')
        return
    
    time.sleep(2)
    
    for lista in listas:
        list_id = lista['id']
        sucesso = fazer_checkout(list_id)
        
        if sucesso:
            aguardar_processamento(3)
        
        time.sleep(1)
    
    print_header("TESTE COMPLETO")
    print_colored("Verificações Recomendadas:", 'BOLD')
    print()
    print("1. Terminal do Consumer Notification:")
    print("   Deve mostrar mensagens de envio de email")
    print()
    print("2. Terminal do Consumer Analytics:")
    print("   Deve mostrar cálculos e estatísticas")
    print()
    print("3. CloudAMQP Management (https://jackal.rmq.cloudamqp.com):")
    print("   Verifique os gráficos de mensagens")
    print("   Aba Queues: veja as filas notification_queue e analytics_queue")
    print("   Aba Exchanges: veja o exchange shopping_events")
    print()
    print_colored("="*80, 'OKGREEN')

def teste_individual():
    print_header("TESTE INDIVIDUAL")
    
    if not verificar_servico():
        return
    
    while True:
        print()
        print_colored("Opções:", 'BOLD')
        print("1. Listar todas as listas")
        print("2. Fazer checkout da lista 1")
        print("3. Fazer checkout da lista 2")
        print("4. Fazer checkout de uma lista específica")
        print("0. Sair")
        print()
        
        try:
            opcao = input("Escolha uma opção: ").strip()
            
            if opcao == "0":
                print_colored("\nAté logo", 'OKCYAN')
                break
            elif opcao == "1":
                listar_compras()
            elif opcao == "2":
                fazer_checkout(1)
                aguardar_processamento(2)
            elif opcao == "3":
                fazer_checkout(2)
                aguardar_processamento(2)
            elif opcao == "4":
                list_id = input("ID da lista: ").strip()
                try:
                    fazer_checkout(int(list_id))
                    aguardar_processamento(2)
                except ValueError:
                    print_colored("ID inválido", 'FAIL')
            else:
                print_colored("Opção inválida", 'WARNING')
                
        except KeyboardInterrupt:
            print_colored("\n\nTeste interrompido pelo usuário", 'WARNING')
            break

if __name__ == "__main__":
    import sys
    
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--menu":
        teste_individual()
    else:
        teste_completo()
        
        print()
        print_colored("Dica: Execute com --menu para testar individualmente", 'OKCYAN')
        print_colored("   python test_checkout.py --menu", 'OKCYAN')
