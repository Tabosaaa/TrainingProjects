import pika
import json

analytics_db = {
    "total_checkouts": 0,
    "total_revenue": 0.0,
    "total_items_sold": 0,
    "checkouts_by_user": {}
}

def conectar_rabbitmq(amqp_url):
    params = pika.URLParameters(amqp_url)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    
    channel.exchange_declare(
        exchange='shopping_events',
        exchange_type='topic',
        durable=True
    )
    
    channel.queue_declare(queue='analytics_queue', durable=True)
    
    channel.queue_bind(
        exchange='shopping_events',
        queue='analytics_queue',
        routing_key='list.checkout.#'
    )
    
    return connection, channel

def atualizar_dashboard(evento):
    user_email = evento.get('user_email')
    total_amount = evento.get('total_amount', 0.0)
    total_items = evento.get('total_items', 0)
    
    analytics_db['total_checkouts'] += 1
    analytics_db['total_revenue'] += total_amount
    analytics_db['total_items_sold'] += total_items
    
    if user_email not in analytics_db['checkouts_by_user']:
        analytics_db['checkouts_by_user'][user_email] = {
            'count': 0,
            'total_spent': 0.0
        }
    
    analytics_db['checkouts_by_user'][user_email]['count'] += 1
    analytics_db['checkouts_by_user'][user_email]['total_spent'] += total_amount
    
    return analytics_db

def processar_analytics(ch, method, properties, body):
    try:
        evento = json.loads(body)
        
        list_id = evento.get('list_id')
        user_email = evento.get('user_email')
        total_amount = evento.get('total_amount', 0.0)
        total_items = evento.get('total_items', 0)
        items = evento.get('items', [])
        
        print("\n" + "="*70)
        print("ANALYTICS SERVICE - Processando evento de checkout")
        print("="*70)
        print(f"Lista #{list_id} - Usuário: {user_email}")
        print(f"Total gasto: R$ {total_amount:.2f}")
        print(f"Total de itens: {total_items}")
        
        print(f"\nBreakdown dos itens:")
        for item in items:
            item_total = item['quantity'] * item['price']
            print(f"   {item['name']}: {item['quantity']}x R$ {item['price']:.2f} = R$ {item_total:.2f}")
        
        stats = atualizar_dashboard(evento)
        
        print(f"\nDashboard Atualizado:")
        print(f"   Total de checkouts realizados: {stats['total_checkouts']}")
        print(f"   Receita total: R$ {stats['total_revenue']:.2f}")
        print(f"   Total de itens vendidos: {stats['total_items_sold']}")
        print(f"   Ticket médio: R$ {stats['total_revenue'] / stats['total_checkouts']:.2f}")
        
        user_stats = stats['checkouts_by_user'][user_email]
        print(f"\nEstatísticas do usuário {user_email}:")
        print(f"   Checkouts realizados: {user_stats['count']}")
        print(f"   Total gasto: R$ {user_stats['total_spent']:.2f}")
        
        print(f"\nAnalytics processado com sucesso")
        print("="*70)
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"Erro ao processar analytics: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def iniciar_analytics_service():
    amqp_url = 'amqps://nmhyxrvi:pS0QFtoKMa5YsL87GZI9l_jOug4k-mAM@jackal.rmq.cloudamqp.com/nmhyxrvi'
    
    print("Iniciando ANALYTICS SERVICE (Consumer B)...")
    print("Escutando fila: analytics_queue")
    print("Routing pattern: list.checkout.#")
    print("="*70)
    
    connection, channel = conectar_rabbitmq(amqp_url)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='analytics_queue', on_message_callback=processar_analytics)
    
    print("Aguardando eventos de checkout...\n")
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\nConsumer interrompido pelo usuário")
        print("\nEstatísticas Finais:")
        print(json.dumps(analytics_db, indent=2, ensure_ascii=False))
    finally:
        print("Fechando conexão...")
        channel.stop_consuming()
        connection.close()

if __name__ == "__main__":
    iniciar_analytics_service()
