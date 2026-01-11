# 📋 Guia de Demonstração - Task Manager com LocalStack

## 🎯 Requisitos do Laboratório

| Requisito | Status | Como será provado |
|-----------|--------|-------------------|
| Docker Compose configurado | ✅ | `docker compose up` mostrando LocalStack subindo |
| Endpoint de Upload (S3) | ✅ | Criar tarefa com foto e verificar no S3 |
| DynamoDB | ✅ | Tarefa salva na tabela DynamoDB |
| SQS | ✅ | Mensagens na fila de processamento |
| SNS | ✅ | Eventos publicados no tópico |

---

## 🚀 PASSO A PASSO DA DEMONSTRAÇÃO

### 1️⃣ Preparação (antes da aula)

```bash
# Certifique-se de ter Docker rodando
docker --version

# Navegue até o projeto
cd /Users/tabosa/Documents/GitHub/TrainingProjects/laboratorio-aplicacoes-moveis/task_manager_offline_localStack
```

---

### 2️⃣ Demonstração 1: Infraestrutura (Docker Compose)

**Mostre o arquivo docker-compose.yml:**
```bash
cat docker-compose.yml
```

**Suba o LocalStack:**
```bash
docker compose up -d
```

**Aguarde ~30 segundos e verifique se está rodando:**
```bash
curl http://localhost:4566/_localstack/health | jq
```

**Saída esperada:** Serviços `s3`, `dynamodb`, `sns`, `sqs` como "available"

---

### 3️⃣ Demonstração 2: Criar Recursos AWS

```bash
cd server
npm run init-localstack
```

**Saída esperada:**
```
✅ Bucket S3 criado: task-images
✅ Tabela DynamoDB criada: Tasks
✅ Tópico SNS criado: arn:aws:sns:us-east-1:000000000000:task-notifications
✅ Fila SQS criada: http://localhost:4566/000000000000/task-processing-queue
```

---

### 4️⃣ Demonstração 3: Verificar Bucket S3 via AWS CLI

```bash
# Listar buckets (mostrar que task-images existe)
aws --endpoint-url=http://localhost:4566 s3 ls
```

**Saída esperada:**
```
2024-12-14 21:00:00 task-images
```

---

### 5️⃣ Demonstração 4: Verificar DynamoDB

```bash
# Listar tabelas
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
```

**Saída esperada:**
```json
{
    "TableNames": ["Tasks"]
}
```

---

### 6️⃣ Demonstração 5: Verificar SQS

```bash
# Listar filas
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

**Saída esperada:**
```json
{
    "QueueUrls": ["http://localhost:4566/000000000000/task-processing-queue"]
}
```

---

### 7️⃣ Demonstração 6: Iniciar Backend

```bash
cd server
npm start
```

**Mostrar na saída:**
```
╔═══════════════════════════════════════════════════════════╗
║       Task Manager API - LocalStack Integration           ║
╠═══════════════════════════════════════════════════════════╣
║  🚀 Servidor rodando em: http://localhost:3000            ║
║  ☁️  LocalStack: HABILITADO                               ║
╚═══════════════════════════════════════════════════════════╝
```

---

### 8️⃣ Demonstração 7: Iniciar App Flutter (outro terminal)

```bash
cd /Users/tabosa/Documents/GitHub/TrainingProjects/laboratorio-aplicacoes-moveis/task_manager_offline_localStack
flutter run
```

---

### 9️⃣ Demonstração 8: AÇÃO PRINCIPAL - Tirar Foto e Salvar

1. No app, toque em **"+"** para criar nova tarefa
2. Preencha:
   - **Título:** "Teste LocalStack"
   - **Descrição:** "Demonstração para o professor"
3. Toque em **"Adicionar Foto"**
4. **Tire uma foto** ou escolha da galeria
5. Toque em **"Criar Tarefa"**
6. Aguarde a sincronização (ícone verde ☁️✓)

---

### 🔟 Demonstração 9: VALIDAÇÃO - Provar que imagem está no S3

```bash
# Listar objetos no bucket S3
aws --endpoint-url=http://localhost:4566 s3 ls s3://task-images/ --recursive
```

**Saída esperada (algo como):**
```
2024-12-14 21:30:15    45234 tasks/abc123-xyz/1702655415000.jpg
```

**OU use o script de demonstração:**
```bash
cd server
npm run demo:images
```

**Saída esperada:**
```
📷 Listando todas as imagens no S3:

Total: 1 imagem(s)

📷 tasks/abc123-xyz/1702655415000.jpg
   Tamanho: 44.17 KB
   URL: http://localhost:4566/task-images/tasks/abc123-xyz/1702655415000.jpg
```

---

### 1️⃣1️⃣ Demonstração 10: Verificar Tarefa no DynamoDB

```bash
# Scan da tabela para ver a tarefa
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name Tasks
```

**Ou formatado:**
```bash
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name Tasks | jq '.Items[] | {title: .title.S, imageUrl: .imageUrl.S}'
```

**Saída esperada:**
```json
{
  "title": "Teste LocalStack",
  "imageUrl": "http://localhost:4566/task-images/tasks/abc123/1702655415000.jpg"
}
```

---

### 1️⃣2️⃣ Demonstração 11: Verificar Mensagens SQS

```bash
# Ver mensagens na fila
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/task-processing-queue \
  --max-number-of-messages 10
```

**Ou formatado:**
```bash
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/task-processing-queue \
  --max-number-of-messages 10 | jq '.Messages[].Body | fromjson'
```

**Saída esperada:**
```json
{
  "eventType": "TASK_CREATED",
  "payload": {
    "taskId": "abc123-xyz",
    "title": "Teste LocalStack",
    "hasImage": true
  }
}
```

---

## ✅ Checklist de Demonstração

| # | Passo | Comando/Ação | ✓ |
|---|-------|--------------|---|
| 1 | Docker Compose | `docker compose up -d` | ☐ |
| 2 | Verificar saúde | `curl localhost:4566/_localstack/health` | ☐ |
| 3 | Criar recursos | `npm run init-localstack` | ☐ |
| 4 | Listar bucket S3 | `aws --endpoint-url=http://localhost:4566 s3 ls` | ☐ |
| 5 | Listar tabela DynamoDB | `aws --endpoint-url=http://localhost:4566 dynamodb list-tables` | ☐ |
| 6 | Listar fila SQS | `aws --endpoint-url=http://localhost:4566 sqs list-queues` | ☐ |
| 7 | Iniciar backend | `npm start` | ☐ |
| 8 | Iniciar Flutter | `flutter run` | ☐ |
| 9 | **Criar tarefa com foto** | App mobile | ☐ |
| 10 | **Provar imagem no S3** | `aws s3 ls s3://task-images/` | ☐ |
| 11 | Verificar DynamoDB | `aws dynamodb scan` | ☐ |
| 12 | Verificar SQS | `aws sqs receive-message` | ☐ |

---

## 💡 Dica: Alias para Facilitar

Crie um alias para os comandos AWS:
```bash
alias awslocal='aws --endpoint-url=http://localhost:4566'
```

Assim você pode usar:
```bash
awslocal s3 ls
awslocal dynamodb list-tables
awslocal sqs list-queues
awslocal s3 ls s3://task-images/ --recursive
```

---

## 🛠️ Comandos Úteis

### Parar LocalStack
```bash
docker compose down
```

### Parar e limpar dados
```bash
docker compose down -v
```

### Ver logs do LocalStack
```bash
docker compose logs -f localstack
```

### Reiniciar tudo do zero
```bash
docker compose down -v && docker compose up -d && sleep 30 && cd server && npm run init-localstack
```

### Verificar status completo
```bash
cd server
npm run demo
```

---

## 🎬 Resumo para Apresentar ao Professor

> "Professor, este projeto demonstra uma arquitetura **Offline-First** com integração **LocalStack** simulando serviços AWS localmente.
>
> Quando o usuário tira uma foto no app e salva a tarefa:
> 1. A imagem é enviada em **Base64** para o backend
> 2. O backend armazena a imagem no **Amazon S3** (simulado)
> 3. Os metadados da tarefa são salvos no **DynamoDB**
> 4. Um evento é publicado no **SNS** para notificações
> 5. Uma mensagem é enviada para a fila **SQS** para processamento assíncrono
>
> Tudo isso rodando localmente via **LocalStack** em um container Docker."

---

## 📊 Arquitetura do Sistema

```
┌─────────────────┐
│   App Flutter   │
│   (Mobile)      │
└────────┬────────┘
         │ HTTP (Base64 image)
         ▼
┌─────────────────┐
│   Backend       │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │    LocalStack (Docker)   │
    │                          │
    │  ┌──────┐ ┌──────────┐  │
    │  │  S3  │ │ DynamoDB │  │
    │  │      │ │          │  │
    │  │ 📷   │ │   📝     │  │
    │  └──────┘ └──────────┘  │
    │                          │
    │  ┌──────┐ ┌──────────┐  │
    │  │ SNS  │ │   SQS    │  │
    │  │      │ │          │  │
    │  │ 📢   │ │   📨     │  │
    │  └──────┘ └──────────┘  │
    │                          │
    └──────────────────────────┘
```

---

## 🆘 Troubleshooting

### Porta em uso
```bash
docker compose down -v
docker stop $(docker ps -aq --filter name=localstack)
docker rm $(docker ps -aq --filter name=localstack)
docker compose up -d
```

### LocalStack não responde
```bash
# Verificar se container está rodando
docker ps

# Ver logs
docker compose logs localstack
```

### Recursos não existem
```bash
cd server
npm run init-localstack
```

### Backend não conecta ao LocalStack
Certifique-se que está usando:
```bash
npm start  # (não npm run start:local)
```

---

**Boa sorte na demonstração! 🚀**
