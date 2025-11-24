from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
import pika
import json
from datetime import datetime

app = FastAPI(title="List Service")

AMQP_URL = 'amqps://nmhyxrvi:pS0QFtoKMa5YsL87GZI9l_jOug4k-mAM@jackal.rmq.cloudamqp.com/nmhyxrvi'

class Item(BaseModel):
    name: str
    quantity: int
    price: float

class ShoppingList(BaseModel):
    id: int
    user_id: int
    user_email: EmailStr
    items: List[Item]
    status: str = "active"

shopping_lists_db = {
    1: ShoppingList(
        id=1,
        user_id=101,
        user_email="joao@email.com",
        items=[
            Item(name="Arroz", quantity=2, price=20.50),
            Item(name="Feijão", quantity=1, price=8.30),
            Item(name="Macarrão", quantity=3, price=4.50)
        ],
        status="active"
    ),
    2: ShoppingList(
        id=2,
        user_id=102,
        user_email="maria@email.com",
        items=[
            Item(name="Leite", quantity=2, price=5.00),
            Item(name="Café", quantity=1, price=12.00),
            Item(name="Açúcar", quantity=1, price=4.00)
        ],
        status="active"
    )
}

def conectar_rabbitmq():
    params = pika.URLParameters(AMQP_URL)
    params.socket_timeout = 5
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    
    channel.exchange_declare(
        exchange='shopping_events',
        exchange_type='topic',
        durable=True
    )
    
    return connection, channel

def publicar_evento_checkout(shopping_list: ShoppingList):
    connection, channel = conectar_rabbitmq()
    
    total_gasto = sum(item.quantity * item.price for item in shopping_list.items)
    
    evento = {
        "event_type": "checkout_completed",
        "list_id": shopping_list.id,
        "user_id": shopping_list.user_id,
        "user_email": shopping_list.user_email,
        "items": [item.dict() for item in shopping_list.items],
        "total_items": len(shopping_list.items),
        "total_amount": round(total_gasto, 2),
        "timestamp": datetime.now().isoformat()
    }
    
    channel.basic_publish(
        exchange='shopping_events',
        routing_key='list.checkout.completed',
        body=json.dumps(evento, ensure_ascii=False),
        properties=pika.BasicProperties(
            delivery_mode=2,
            content_type='application/json'
        )
    )
    
    connection.close()

@app.get("/")
def read_root():
    return {
        "service": "List Service",
        "version": "1.0.0"
    }

@app.get("/lists")
def get_lists():
    return {
        "total": len(shopping_lists_db),
        "lists": list(shopping_lists_db.values())
    }

@app.get("/lists/{list_id}")
def get_list(list_id: int):
    if list_id not in shopping_lists_db:
        raise HTTPException(status_code=404, detail=f"Lista {list_id} não encontrada")
    
    return shopping_lists_db[list_id]

@app.post("/lists/{list_id}/checkout", status_code=202)
def checkout_list(list_id: int):
    if list_id not in shopping_lists_db:
        raise HTTPException(status_code=404, detail=f"Lista {list_id} não encontrada")
    
    shopping_list = shopping_lists_db[list_id]
    
    if shopping_list.status == "completed":
        raise HTTPException(status_code=400, detail="Lista já foi finalizada")
    
    shopping_list.status = "completed"
    
    try:
        publicar_evento_checkout(shopping_list)
    except Exception as e:
        shopping_list.status = "active"
        raise HTTPException(status_code=500, detail=f"Erro ao processar checkout: {str(e)}")
    
    return {
        "status": "accepted",
        "message": f"Checkout da lista {list_id} aceito para processamento",
        "list_id": list_id,
        "processing": "async"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
