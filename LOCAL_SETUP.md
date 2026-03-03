# 🚀 Guia de Configuração Local - WODPULSE CRM

## Pré-requisitos

- **Node.js** 18+ e **pnpm** instalados
- **PostgreSQL** ou banco de dados compatível
- **Git** instalado

## 1️⃣ Clonar o Repositório

```bash
git clone <seu-repositorio>
cd wodpulse-crm
```

## 2️⃣ Instalar Dependências

```bash
pnpm install
```

## 3️⃣ Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/wodpulse_crm

# OAuth / Manus
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=sua_chave_secreta_aqui

# Google Maps (opcional, para busca de boxes)
GOOGLE_MAPS_API_KEY=sua_chave_google_maps

# Outros
OWNER_NAME=Seu Nome
OWNER_OPEN_ID=seu_open_id
```

## 4️⃣ Configurar Banco de Dados

### Opção A: PostgreSQL Local

```bash
# Criar banco de dados
createdb wodpulse_crm

# Executar migrations
pnpm db:push
```

### Opção B: Usar Neon (Cloud PostgreSQL)

Se quiser usar o banco que você já tem configurado:

```bash
# Atualize DATABASE_URL no .env.local com sua string de conexão Neon
DATABASE_URL=postgresql://neondb_owner:npg_0NGHXEs5YKSD@ep-gentle-silence-acxa7sa0-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Executar migrations
pnpm db:push
```

## 5️⃣ Executar em Desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em: **http://localhost:5173**

O servidor estará em: **http://localhost:3000**

## 6️⃣ Build para Produção

```bash
pnpm build
```

Isso gera os arquivos em:
- `dist/public/` - Frontend compilado
- `dist/index.js` - Servidor compilado

## 📁 Arquivos Importantes para Modificação Local

### Frontend
- **`client/src/pages/SearchEstablishments.tsx`** - Página de busca de boxes
- **`client/src/pages/Dashboard.tsx`** - Dashboard principal
- **`client/src/pages/ClientForm.tsx`** - Formulário de clientes

### Backend
- **`server/routers.ts`** - Todas as rotas tRPC
- **`server/db.ts`** - Funções de banco de dados
- **`server/_core/sdk.ts`** - Autenticação OAuth
- **`drizzle/schema.ts`** - Schema do banco de dados

### Configuração
- **`vite.config.ts`** - Configuração do Vite
- **`tsconfig.json`** - Configuração TypeScript
- **`.env.local`** - Variáveis de ambiente (criar localmente)

## 🔧 Troubleshooting

### Erro: "DATABASE_URL not set"
```bash
# Certifique-se de que .env.local existe e tem DATABASE_URL
cat .env.local | grep DATABASE_URL
```

### Erro: "Cannot find module"
```bash
# Reinstale dependências
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Erro: "Port 3000 already in use"
```bash
# Use uma porta diferente
PORT=3001 pnpm dev
```

### Erro: "Google Maps API error"
```bash
# Certifique-se de que GOOGLE_MAPS_API_KEY está configurado
# Ou desabilite a busca de maps localmente
```

## 📝 Estrutura de Pastas

```
wodpulse-crm/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas (Dashboard, ClientForm, etc)
│   │   ├── components/ # Componentes reutilizáveis
│   │   └── lib/        # Utilitários (tRPC client, etc)
│   └── index.html      # HTML principal
├── server/             # Backend Express + tRPC
│   ├── routers.ts      # Todas as rotas tRPC
│   ├── db.ts           # Funções de banco de dados
│   └── _core/          # Configuração interna
├── drizzle/            # Schema e migrations
├── shared/             # Código compartilhado
└── .env.local          # Variáveis de ambiente (criar localmente)
```

## 🚀 Deploy Local para Teste

```bash
# Build
pnpm build

# Servir localmente
NODE_ENV=production node dist/index.js
```

Acesse: **http://localhost:3000**

## 💡 Dicas

- Use `pnpm test` para rodar testes
- Use `pnpm lint` para verificar código
- Modifique `drizzle/schema.ts` e rode `pnpm db:push` para alterar banco
- Logs do servidor aparecem no console quando rodando com `pnpm dev`

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique se todas as dependências estão instaladas: `pnpm install`
2. Verifique se o banco de dados está rodando
3. Verifique se as variáveis de ambiente estão corretas
4. Verifique os logs no console

---

**Última atualização:** 02/03/2026
