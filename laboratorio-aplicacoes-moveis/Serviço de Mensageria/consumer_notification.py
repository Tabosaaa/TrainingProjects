import pika
import json

def conectar_rabbitmq(amqp_url):
    params = pika.URLParameters(amqp_url)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    
    channel.exchange_declare(
        exchange='shopping_events',
        exchange_type='topic',
        durable=True
    )
    
    channel.queue_declare(queue='notification_queue', durable=True)
    
    channel.queue_bind(
        exchange='shopping_events',
        queue='notification_queue',
        routing_key='list.checkout.#'
    )
    
    return connection, channel

def processar_notificacao(ch, method, properties, body):
    try:
        evento = json.loads(body)
        
        list_id = evento.get('list_id')
        user_email = evento.get('user_email')
        total_amount = evento.get('total_amount')
        total_items = evento.get('total_items')
        
        print("\n" + "="*70)
        print("NOTIFICATION SERVICE - Processando evento de checkout")
        print("="*70)
        print(f"Enviando comprovante da lista [{list_id}] para o usuário [{user_email}]")
        print(f"Total de itens: {total_items}")
        print(f"Valor total: R$ {total_amount:.2f}")
        print(f"Email enviado com sucesso para {user_email}")
        print("="*70)
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"Erro ao processar notificação: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def iniciar_notification_service():
    amqp_url = 'amqps://nmhyxrvi:pS0QFtoKMa5YsL87GZI9l_jOug4k-mAM@jackal.rmq.cloudamqp.com/nmhyxrvi'
    
    print("Iniciando NOTIFICATION SERVICE (Consumer A)...")
    print("Escutando fila: notification_queue")
    print("Routing pattern: list.checkout.#")
    print("="*70)
    
    connection, channel = conectar_rabbitmq(amqp_url)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='notification_queue', on_message_callback=processar_notificacao)
    
    print("Aguardando eventos de checkout...\n")
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\nConsumer interrompido pelo usuário")
    finally:
        print("Fechando conexão...")
        channel.stop_consuming()
        connection.close()

if __name__ == "__main__":
    iniciar_notification_service()
