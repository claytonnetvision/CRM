# 🏋️ WODPULSE CRM — Guia de Instalação Local

Este guia explica como rodar o sistema WODPULSE CRM no seu computador, mantendo o banco de dados PostgreSQL na nuvem (Neon).

---

## 📋 Pré-requisitos

Antes de começar, instale:

| Software | Versão | Download |
|----------|--------|----------|
| **Node.js** | 18 ou superior | https://nodejs.org |
| **pnpm** | Qualquer versão | `npm install -g pnpm` |
| **Git** | Qualquer versão | https://git-scm.com |

---

## 🚀 Passo a Passo

### 1. Extrair o projeto

Descompacte o arquivo `wodpulse-crm.zip` em uma pasta de sua preferência.

```bash
# Exemplo: descompactar na pasta Documentos
cd ~/Documentos
unzip wodpulse-crm.zip
cd wodpulse-crm
```

### 2. Instalar dependências

```bash
pnpm install
```

> ⏳ Aguarde — pode demorar alguns minutos na primeira vez.

### 3. Configurar variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Banco de Dados PostgreSQL (Neon) — USE A URL DO SEU PAINEL NEON
NEON_DATABASE_URL=postgresql://neondb_owner:npg_0NGHXEs5YKSD@ep-gentle-silence-acxa7sa0-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret — pode ser qualquer string longa e aleatória
JWT_SECRET=wodpulse-crm-local-2026

# Porta do servidor
PORT=3000
```

> ⚠️ **Importante:** O arquivo `.env` não é incluído no ZIP por segurança. Você precisa criá-lo manualmente.

### 4. Executar as migrações do banco

As tabelas já existem no seu banco Neon, mas caso precise recriar:

```bash
NEON_DATABASE_URL="sua_url_aqui" pnpm db:push
```

### 5. Iniciar o sistema

```bash
pnpm dev
```

O sistema estará disponível em: **http://localhost:3000**

### 6. Login no sistema

Como o sistema está rodando localmente (sem o servidor de autenticação do Manus), será exibida uma tela de senha simples.

- **Senha padrão:** `wodpulse2026`

Para alterar a senha, adicione ao arquivo `.env`:
```env
LOCAL_LOGIN_PASSWORD=sua_senha_aqui
```

---

## 📁 Estrutura do Projeto

```
wodpulse-crm/
├── client/              # Frontend React + Tailwind
│   └── src/
│       ├── pages/       # Páginas do sistema
│       ├── components/  # Componentes reutilizáveis
│       └── lib/         # Configurações (tRPC, etc.)
├── server/              # Backend Express + tRPC
│   ├── routers.ts       # Todas as rotas da API
│   └── db.ts            # Funções de banco de dados
├── drizzle/             # Schema e migrações do banco
│   └── schema.ts        # Definição das tabelas
├── package.json         # Dependências do projeto
└── INSTALACAO_LOCAL.md  # Este arquivo
```

---

## 🗄️ Banco de Dados (Neon PostgreSQL)

O sistema usa o banco PostgreSQL hospedado no Neon. As tabelas criadas são:

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `clients` | Clientes (BOX/Studios) |
| `leads` | Leads encontrados via Google Maps |
| `consultants` | Consultores de vendas |
| `financials` | Registros financeiros |
| `monthlyPayments` | Cobranças mensais por BOX |
| `commissionPayments` | Comissões dos consultores |

---

## 🔧 Comandos Úteis

```bash
# Iniciar em modo desenvolvimento (com hot-reload)
pnpm dev

# Compilar para produção
pnpm build

# Iniciar em modo produção (após build)
pnpm start

# Executar testes
pnpm test

# Atualizar schema do banco
pnpm db:push
```

---

## ❓ Solução de Problemas

### Erro: "Cannot connect to database"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Confirme que a `NEON_DATABASE_URL` está correta (copie direto do painel Neon)
- Verifique se o banco Neon está ativo (pode hibernar após inatividade)

### Erro: "Port 3000 already in use"
- Mude a porta no `.env`: `PORT=3001`
- Ou encerre o processo que está usando a porta 3000

### Erro: "pnpm not found"
- Instale o pnpm: `npm install -g pnpm`

### Erro de SSL ao conectar ao Neon
- A URL deve conter `?sslmode=require` no final
- Copie a URL exatamente como aparece no painel do Neon

---

## 📞 Suporte

Em caso de dúvidas, acesse o sistema online em:
**https://wodpulsecrm-yuzfcqcc.manus.space**

---

*WODPULSE CRM — Sistema de Controle de Clientes*
