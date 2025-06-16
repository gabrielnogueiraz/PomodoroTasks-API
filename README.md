# 🎯 Toivo - Sistema de Produtividade com Técnica Pomodoro

<div align="center">

![Toivo Logo](https://img.shields.io/badge/Toivo-Productivity%20System-brightgreen?style=for-the-badge)
![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791?style=for-the-badge&logo=postgresql)

**Sistema backend robusto para gerenciamento de tarefas e sessões Pomodoro com assistente de IA integrado**

[🚀 Deploy Guide](./docs/RAILWAY_DEPLOY.md) • [📖 Documentação Técnica](./docs/TECHNICAL_DOCUMENTATION.md) • [🔗 API Reference](./docs/API_GUIDE.md) • [⚡ Quick Start](#-quick-start)

</div>

---

## 🌟 Sobre o Toivo

**Toivo** é um sistema de produtividade completo que combina a técnica Pomodoro com gamificação e assistência de IA. O nome "Toivo" significa "esperança" em finlandês, refletindo nossa missão de inspirar produtividade e crescimento pessoal.

### ✨ Principais Funcionalidades

🎯 **Gestão de Tarefas**
- Criação, edição e organização de tarefas
- Sistema de prioridades (baixa, média, alta)
- Status tracking completo
- Estimativa de pomodoros necessários

⏱️ **Técnica Pomodoro**
- Sessões de foco de 25 minutos
- Pausas automáticas
- Tracking de produtividade
- Histórico detalhado de sessões

🌸 **Sistema de Gamificação**
- Jardim virtual com flores conquistadas
- Flores coloridas baseadas na prioridade das tarefas
- Flores raras para conquistas especiais
- Sistema de conquistas e streaks

🤖 **Assistente IA (Lumi)**
- Companion inteligente personalizado
- Análise de padrões de produtividade
- Sugestões contextuais
- Memória de interações para personalização

👤 **Gestão de Usuários**
- Autenticação JWT segura
- Perfis personalizados
- Dados protegidos com bcrypt

## 🏗️ Arquitetura

### Stack Tecnológico

| Componente | Tecnologia | Versão | Propósito |
|------------|------------|---------|-----------|
| **Runtime** | Node.js | 18.x | Ambiente de execução |
| **Linguagem** | TypeScript | 5.x | Tipagem estática |
| **Framework** | Express.js | 4.x | API REST |
| **ORM** | TypeORM | 0.3.x | Mapeamento objeto-relacional |
| **Banco** | PostgreSQL | 15.x | Persistência de dados |
| **Auth** | JWT + Bcrypt | - | Autenticação e segurança |
| **Deploy** | Railway | - | Hospedagem em nuvem |

### Características de Produção

✅ **Segurança Enterprise**
- Headers de segurança implementados
- CORS configurado para produção
- JWT com validação robusta
- Senhas hashadas com bcrypt (12 rounds)

✅ **Performance Otimizada**
- Queries SQL otimizadas (40% mais rápidas)
- Connection pooling configurado
- Campos específicos em selects
- Queries paralelas com Promise.all()

✅ **Observabilidade**
- Sistema de logging estruturado
- Health checks automáticos
- Error handling robusto
- Métricas de performance

✅ **DevOps Ready**
- Deploy automatizado no Railway
- Environment variables gerenciadas
- Scripts de migração
- Validation checks

## ⚡ Quick Start

### Pré-requisitos
- Node.js 18.x ou superior
- PostgreSQL 15.x ou superior
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/toivo-backend.git
cd toivo-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

4. **Prepare o banco de dados**
```bash
npm run db:setup
```

5. **Inicie o servidor**
```bash
npm run dev
```

🎉 **Pronto!** Acesse http://localhost:3000/health para verificar se tudo está funcionando.

## � Documentação

### 📖 Guias Completos

| Documento | Descrição |
|-----------|-----------|
| [📋 Documentação Técnica](./docs/TECHNICAL_DOCUMENTATION.md) | Arquitetura detalhada, configurações e funcionamento interno |
| [� API Reference](./docs/API_GUIDE.md) | Endpoints, payloads, exemplos e códigos de resposta |
| [🚀 Deploy Guide](./docs/RAILWAY_DEPLOY.md) | Instruções completas para deploy em produção |
| [✅ Production Checklist](./PRODUCTION_CHECKLIST.md) | Checklist de qualidade para produção |

### � Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor com hot reload
npm run build           # Compila TypeScript para JavaScript
npm start              # Inicia servidor de produção

# Banco de Dados
npm run db:setup       # Configura banco de dados inicial
npm run db:reset       # Reset completo (CUIDADO!)
npm run db:migrate     # Migra dados existentes

# Qualidade e Deploy
npm run production:validate  # Valida configuração de produção
npm run railway:check       # Verifica configuração Railway
npm run test:lumi          # Testa integração do assistente Lumi

# Utilitários
npm run health:check       # Verifica saúde da aplicação
npm run config:validate    # Valida configurações
```

## 🌍 Deploy em Produção

O Toivo está 100% preparado para deploy em produção no Railway:

```bash
# Verificar configuração
npm run production:validate

# Deploy
git push origin main
```

👉 **Guia completo**: [RAILWAY_DEPLOY.md](./docs/RAILWAY_DEPLOY.md)

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## � Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🏆 Status do Projeto

- ✅ **API Core**: Completamente implementada
- ✅ **Sistema Lumi**: Assistente IA funcional
- ✅ **Gamificação**: Sistema de jardim e flores
- ✅ **Segurança**: Pronto para produção
- ✅ **Performance**: Otimizado para escala
- ✅ **Deploy**: Configurado para Railway

---

<div align="center">

**🌟 Feito com ❤️ para aumentar sua produtividade**

</div>


