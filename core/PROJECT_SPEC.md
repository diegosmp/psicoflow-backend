# 🧠 PsiSaaS - Plataforma de Gestão e Chat para Psicólogos

## 1. Visão Geral
SaaS voltado para a área de saúde mental (HealthTech), focado em fornecer ferramentas de gestão de pacientes e comunicação em tempo real (estilo WhatsApp) entre psicólogos e clientes. O sistema conta com auxílio de Inteligência Artificial (Gemini) para o profissional e geração de relatórios de evolução.

**Plataformas:** Web (Dashboard do Psicólogo) e Mobile (App do Paciente/Psicólogo).

---

## 2. Arquitetura Técnica

O sistema segue uma arquitetura modular preparada para microsserviços, rodando em containers Docker.

### Componentes Principais:
1.  **API Gateway / Core Backend:** Responsável pela lógica de negócios, gestão de planos, tarefas e orquestração do chat.
2.  **Auth Service (Externo):** API de terceiros responsável pela autenticação (OAuth Google / JWT).
3.  **Service Discovery (Externo):** API responsável por mapear e localizar os serviços ativos.
4.  **Database:** PostgreSQL (Dados relacionais: Usuários, Prontuários, Tarefas).
5.  **Cache/PubSub:** Redis (Gerenciamento de sessões do Socket.io, Filas de processamento e Cache).
6.  **AI Engine:** Integração direta com Google Gemini API.

### Stack Tecnológica:
* **Linguagem:** TypeScript
* **Runtime:** Node.js
* **Framework:** Fastify
* **ORM:** Prisma
* **Validação:** Zod
* **Real-time:** Socket.io
* **PDF:** Pdfmake
* **Infra:** Docker & Docker Compose

---

## 3. Regras de Negócio e Planos

O acesso às funcionalidades é limitado pelo plano do Psicólogo.

| Funcionalidade | Plano Básico | Plano Intermediário | Plano Completo |
| :--- | :--- | :--- | :--- |
| **Limite de Clientes** | 10 Clientes | 30 Clientes | Ilimitado |
| **Integração IA (Gemini)** | ❌ Não | ✅ Sim | ✅ Sim |
| **Chat Tempo Real** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Geração de PDF** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Gestão de Tarefas** | ✅ Sim | ✅ Sim | ✅ Sim |

---

## 4. Fluxos Principais

### 4.1. Cadastro de Paciente (Invite System)
1.  Psicólogo gera link de convite único.
2.  Paciente acessa o link via Mobile ou Web.
3.  Sistema valida se o Psicólogo ainda tem "slots" livres no plano atual.
4.  Se válido, cria o usuário Paciente vinculado automaticamente ao Psicólogo.

### 4.2. Chat com IA (Copiloto)
1.  Paciente envia mensagem.
2.  Socket.io entrega ao Psicólogo.
3.  **Se Plano >= Intermediário:** O Backend envia o contexto da conversa para o Gemini.
4.  Gemini devolve uma *sugestão* de resposta empática ou técnica para o Psicólogo (visível apenas para ele).

### 4.3. Prontuário e PDF
1.  Psicólogo preenche "Melhorias" e "Pontos de Atenção".
2.  Backend gera PDF usando `pdfmake`.
3.  PDF é disponibilizado para download ou envio no chat.

---

## 5. Estrutura de Banco de Dados (Prisma Schema)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  role         Role     // PSYCHOLOGIST | PATIENT
  planType     PlanType? // BASIC | INTERMEDIATE | COMPLETE
  
  // Relação de Hierarquia
  psychologistId String?
  psychologist   User?   @relation("DoctorPatient", fields: [psychologistId], references: [id])
  patients       User[]  @relation("DoctorPatient")

  messagesSent     Message[] @relation("Sender")
  messagesReceived Message[] @relation("Receiver")
  
  tasks          Task[]
  medicalRecords MedicalRecord[]
}

model Message {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  senderId  String
  receiverId String
  sender    User     @relation("Sender", fields: [senderId], references: [id])
  receiver  User     @relation("Receiver", fields: [receiverId], references: [id])
}

---

### Instalação das Dependências

Aqui estão os comandos para você rodar no seu terminal e instalar exatamente o que definimos no documento acima. Separei em dependências de **produção** (que o app precisa para rodar) e de **desenvolvimento** (TypeScript, tipos, etc).

#### Opção 1: Usando NPM

```bash
# 1. Iniciar o projeto
npm init -y

# 2. Dependências de Produção
npm install fastify @fastify/cors @fastify/websocket socket.io fastify-socket.io @prisma/client dotenv zod axios @google/generative-ai pdfmake

# 3. Dependências de Desenvolvimento (TypeScript e Tipos)
npm install typescript @types/node tsx @types/ws @types/pdfmake prisma --save-dev

# 4. Inicializar o TypeScript
npx tsc --init

# 5. Inicializar o Prisma
npx prisma init

# 1. Iniciar o projeto
yarn init -y

# 2. Dependências de Produção
yarn add fastify @fastify/cors @fastify/websocket socket.io fastify-socket.io @prisma/client dotenv zod axios @google/generative-ai pdfmake

# 3. Dependências de Desenvolvimento
yarn add typescript @types/node tsx @types/ws @types/pdfmake prisma -D

# 4. Inicializar o TypeScript
yarn tsc --init

# 5. Inicializar o Prisma
yarn prisma init
```