# 🎯 RAILWAY SETUP - PASSO A PASSO VISUAL

```
📊 RAILWAY PROJECT DASHBOARD
┌─────────────────────────────────────────┐
│  🏗️  Projeto: PomodoroTasks-API        │
├─────────────────────────────────────────┤
│                                         │
│  [Add Service] 👈 CLIQUE AQUI          │
│                                         │
│  Services:                              │
│  ├── 🖥️  backend server (seu app)       │
│  └── 📦 [FALTANDO] PostgreSQL          │
│                                         │
└─────────────────────────────────────────┘
```

## 🔄 FLUXO DE CORREÇÃO:

```
1️⃣ CLIQUE "Add Service"
    ↓
2️⃣ SELECIONE "Database"
    ↓  
3️⃣ SELECIONE "PostgreSQL"
    ↓
4️⃣ AGUARDE CRIAÇÃO (1-2 min)
    ↓
5️⃣ VERIFIQUE VARIABLES
    ↓
6️⃣ FORCE REDEPLOY
```

## 📋 ANTES vs DEPOIS:

### ❌ ANTES (Estado Atual):
```
Railway Project:
├── backend server ✅ (build OK, runtime failed)
└── [sem banco] ❌
```

### ✅ DEPOIS (Estado Correto):
```
Railway Project:  
├── backend server ✅ (build + runtime OK)
└── PostgreSQL ✅ (DATABASE_URL configurado)
```

## 🔗 CONEXÃO DATABASE_URL:

```
postgresql://[usuário]:[senha]@[host]:[porta]/[database]
           ↑                    ↑
    Railway gera          Railway host
    automaticamente       interno
```

## 🚀 COMANDOS PARA DEPOIS:

```bash
# Após adicionar PostgreSQL, force redeploy:
git commit --allow-empty -m "redeploy with postgresql"  
git push origin main

# Para verificar se funcionou:
curl https://seu-app.railway.app/health
```

---
**🎯 Objetivo**: Ter backend + PostgreSQL funcionando no Railway
