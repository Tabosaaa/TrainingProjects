#!/bin/bash

# Script para criar recursos AWS no LocalStack
# Uso: ./scripts/create-resources.sh

set -e

echo "🚀 Criando recursos AWS no LocalStack..."
echo ""

# Configurar variáveis de ambiente
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
ENDPOINT="http://localhost:4566"
REGION="us-east-1"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Verificando LocalStack...${NC}"
if ! curl -s $ENDPOINT/_localstack/health > /dev/null 2>&1; then
    echo -e "${RED}❌ LocalStack não está rodando!${NC}"
    echo "Execute: npm run docker:up"
    exit 1
fi
echo -e "${GREEN}✅ LocalStack está ativo${NC}"
echo ""

# 1. Criar Tabela DynamoDB
echo -e "${YELLOW}📊 Criando tabela DynamoDB...${NC}"
aws --endpoint-url=$ENDPOINT --region $REGION \
  dynamodb create-table \
  --table-name ProcessedData \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tabela DynamoDB criada: ProcessedData${NC}"
else
    echo -e "${YELLOW}⚠️  Tabela DynamoDB já existe${NC}"
fi
echo ""

# 2. Criar Bucket S3
echo -e "${YELLOW}🪣 Criando bucket S3...${NC}"
aws --endpoint-url=$ENDPOINT --region $REGION \
  s3 mb s3://data-processing-bucket \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Bucket S3 criado: data-processing-bucket${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket S3 já existe${NC}"
fi
echo ""

# 3. Criar Tópico SNS
echo -e "${YELLOW}📢 Criando tópico SNS...${NC}"
TOPIC_ARN=$(aws --endpoint-url=$ENDPOINT --region $REGION \
  sns create-topic \
  --name data-processing-notifications \
  --output text --query 'TopicArn' 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tópico SNS criado${NC}"
    echo "   ARN: $TOPIC_ARN"
else
    echo -e "${YELLOW}⚠️  Tópico SNS já existe${NC}"
fi
echo ""

# 4. Verificar recursos criados
echo -e "${YELLOW}🔍 Verificando recursos...${NC}"
echo ""

echo "📊 Tabelas DynamoDB:"
aws --endpoint-url=$ENDPOINT --region $REGION \
  dynamodb list-tables \
  --query 'TableNames' \
  --output table

echo ""
echo "🪣 Buckets S3:"
aws --endpoint-url=$ENDPOINT --region $REGION \
  s3 ls

echo ""
echo "📢 Tópicos SNS:"
aws --endpoint-url=$ENDPOINT --region $REGION \
  sns list-topics \
  --query 'Topics[*].TopicArn' \
  --output table

echo ""
echo -e "${GREEN}✅ Todos os recursos foram criados/verificados com sucesso!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "   1. Upload CSV: npm run upload-csv"
echo "   2. Processar: npm run invoke"
echo "   3. Testar API: npm run invoke:api"
echo "   4. Ver dados: npm run scan-db"

