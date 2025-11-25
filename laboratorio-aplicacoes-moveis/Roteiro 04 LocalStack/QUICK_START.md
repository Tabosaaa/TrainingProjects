# 🚀 Guia Rápido - Roteiro 04 LocalStack

## ⚡ Início em 5 Minutos

### 1️⃣ Instalar Dependências (30 segundos)

```bash
npm install
```

### 2️⃣ Iniciar LocalStack (40 segundos)

```bash
npm run docker:up
sleep 40  # Aguardar inicialização
```

### 3️⃣ Criar Recursos AWS (10 segundos)

```bash
npm run create-resources
```

### 4️⃣ Testar Processamento de CSV (5 segundos)

```bash
# Upload + Processar
npm run upload-csv
npm run invoke

# Ver resultados
npm run scan-db
```

### 5️⃣ Testar API REST (2 segundos)

```bash
npm run invoke:api
```

---

## 🎯 Comandos Principais

| Comando | Descrição |
|---------|-----------|
| `npm run docker:up` | Iniciar LocalStack |
| `npm run docker:down` | Parar LocalStack |
| `npm run create-resources` | Criar DynamoDB, S3 e SNS |
| `npm run upload-csv` | Upload de produtos.csv |
| `npm run invoke` | Processar CSV |
| `npm run invoke:api` | Testar API REST |
| `npm run scan-db` | Ver dados no DynamoDB |
| `npm run docker:logs` | Ver logs do LocalStack |

---

## 📊 O Que Cada Teste Faz

### Teste 1: `npm run invoke`
**Processa arquivo CSV do S3**

✅ Lê 10 produtos do `produtos.csv`  
✅ Valida e enriquece dados  
✅ Salva no DynamoDB  
✅ Envia notificação SNS

**Output esperado:**
```
✅ Linha 2 processada: Notebook Dell XPS 15
✅ Linha 3 processada: Mouse Logitech MX Master
...
✅ Processamento concluído
📊 10 registros processados (100% sucesso)
```

### Teste 2: `npm run invoke:api`
**Cria registro via API REST**

✅ Valida requisição HTTP POST  
✅ Gera UUID automático  
✅ Salva no DynamoDB  
✅ Envia notificação SNS  
✅ Retorna HTTP 201 Created

**Output esperado:**
```
🌐 Lambda API Handler iniciada
✅ Item inserido no DynamoDB
✅ Status Code: 201
```

### Teste 3: `npm run scan-db`
**Visualiza dados salvos**

✅ Lista todos os registros  
✅ Mostra campos: id, nome, preco, estoque, etc.  
✅ Count total de registros

**Output esperado:**
```json
{
  "Count": 11,
  "Items": [...]
}
```

---

## 🔧 Troubleshooting Rápido

### LocalStack não inicia?

```bash
# Verificar Docker
docker ps

# Reiniciar
npm run docker:down
npm run docker:up
```

### Recursos não existem?

```bash
npm run create-resources
```

### Ver logs de erro?

```bash
npm run docker:logs
```

### Limpar tudo e recomeçar?

```bash
npm run docker:down
docker volume prune -f
npm run docker:up
sleep 40
npm run create-resources
```

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | 📖 Documentação completa |
| `TESTE_REALIZADO.md` | 🧪 Relatório de testes |
| `PROJETO_COMPLETO.md` | 📋 Sumário do projeto |
| `src/handlers/dataProcessor.js` | 🔥 Lambda CSV |
| `src/handlers/createRecord.js` | 🌐 Lambda API |
| `data/input/produtos.csv` | 📊 Dados de teste |

---

## ✅ Checklist de Validação

Depois de executar os comandos acima, você deve ter:

- [x] LocalStack rodando em `http://localhost:4566`
- [x] Tabela DynamoDB `ProcessedData` criada
- [x] Bucket S3 `data-processing-bucket` criado
- [x] Tópico SNS `data-processing-notifications` criado
- [x] 11 registros no DynamoDB (10 CSV + 1 API)
- [x] Ambas as Lambdas funcionando corretamente

**Verifique:**

```bash
# 1. LocalStack ativo?
curl http://localhost:4566/_localstack/health

# 2. Tabela DynamoDB existe?
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test \
  aws --endpoint-url=http://localhost:4566 --region us-east-1 \
  dynamodb list-tables

# 3. Bucket S3 existe?
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test \
  aws --endpoint-url=http://localhost:4566 --region us-east-1 \
  s3 ls

# 4. Quantos registros no DynamoDB?
npm run scan-db
```

---

## 🎓 Próximos Passos

1. ✅ Projeto funcionando? → Leia `README.md` para detalhes
2. 🧪 Quer entender os testes? → Veja `TESTE_REALIZADO.md`
3. 📚 Quer visão completa? → Leia `PROJETO_COMPLETO.md`
4. 🔨 Quer modificar? → Estude `src/handlers/` e `src/utils/`
5. 🚀 Deploy real? → Adapte para AWS (remova LocalStack config)

---

## 💡 Dicas Úteis

### Desenvolvimento Rápido

```bash
# Modificou o código?
# Não precisa redeploy, apenas invoque novamente:
npm run invoke
npm run invoke:api
```

### Ver Dados em Tempo Real

```bash
# Terminal 1: Logs do LocalStack
npm run docker:logs

# Terminal 2: Executar testes
npm run invoke

# Terminal 3: Ver dados salvos
npm run scan-db
```

### Reset Completo

```bash
# Limpar tudo e recomeçar do zero
npm run docker:down
docker system prune -af --volumes
npm run docker:up
sleep 40
npm run create-resources
```

---

## 🎯 Comandos Resumidos

### Setup Inicial
```bash
npm install && npm run docker:up && sleep 40 && npm run create-resources
```

### Teste Completo
```bash
npm run upload-csv && npm run invoke && npm run invoke:api && npm run scan-db
```

### Cleanup
```bash
npm run docker:down
```

---

## 📞 Precisa de Ajuda?

1. 📖 Leia `README.md` - Documentação completa
2. 🐛 Veja seção "Troubleshooting" no README
3. 🧪 Compare com `TESTE_REALIZADO.md` - O que é esperado

---

**✅ Projeto 100% Funcional - Roteiro 04 Completo!**

🎉 Agora você tem uma aplicação serverless completa rodando localmente!

