# Sistema de Mensageria com RabbitMQ - Lista de Compras

Sistema de microsserviços para Lista de Compras com processamento assíncrono de eventos usando RabbitMQ/CloudAMQP.

## Como Executar

### 1. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 2. Iniciar os Serviços

Abra 3 terminais diferentes:

**Terminal 1 - Producer (List Service):**
```bash
python list_service.py
```

**Terminal 2 - Consumer A (Notification Service):**
```bash
python consumer_notification.py
```

**Terminal 3 - Consumer B (Analytics Service):**
```bash
python consumer_analytics.py
```

### 3. Executar os Testes

Abra um 4º terminal e execute:

```bash
python test_checkout.py
```

O script vai:
- Verificar se o List Service está rodando
- Listar todas as listas disponíveis
- Fazer checkout de todas as listas automaticamente
- Mostrar tempo de resposta

Para testar individualmente com menu interativo:

```bash
python test_checkout.py --menu
```

## O Que Acontece

1. **List Service** retorna **202 Accepted** imediatamente
2. Publica evento no exchange `shopping_events` com routing key `list.checkout.completed`
3. **Consumer A (Notification)** recebe o evento e exibe log de envio de email
4. **Consumer B (Analytics)** recebe o evento e calcula estatísticas do dashboard

## Monitoramento no CloudAMQP

Acesse: https://jackal.rmq.cloudamqp.com/#/queues

Durante os testes, você verá:
- **Exchanges Tab**: Exchange `shopping_events` (tipo: topic)
- **Queues Tab**: `notification_queue` e `analytics_queue`
- **Gráficos**: Mensagens sendo publicadas e consumidas
