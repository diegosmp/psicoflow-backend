# Psicoflow Backend

Psicoflow is a SaaS platform for psychologists, providing tools for patient management, medical records, and scheduling. This repository contains the backend microservices architecture.

## 🏗️ Architecture

The backend is built using a microservices architecture with the following components:

- **Service Discovery (Gateway)**: Acts as the entry point (API Gateway) and manages service registration.
- **Auth Service**: Handles user authentication, registration, and JWT generation.
- **Core Service**: Manages core business logic (Patients, Medical Records, Tasks).
- **Redis**: Used for service registry storage and caching.
- **PostgreSQL**: Primary database for all services.

### Service Communication
- Services automatically register with the **Service Discovery** on startup.
- The **Gateway** proxies requests to the appropriate service based on the URL prefix.
- **Auth Service** -> `/auth/*`
- **Core Service** -> `/api/*`

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Yarn

### Installation

1.  Clone the repository.
2.  Install dependencies for all services:
    ```bash
    cd backend/service-discovery && yarn install
    cd ../auth && yarn install
    cd ../core && yarn install
    ```

### Unified Startup

You can start all services with a single command from the `backend` root:

```bash
cd backend
yarn dev
```

This uses `concurrently` to run:
- Service Discovery (3001)
- Auth Service (3002)
- Core Service (3333)

### Infrastructure Setup

Start Redis, PostgreSQL, and Redis Commander using Docker Compose:

```bash
cd backend/core
docker-compose up -d
```

- **Redis Commander** (GUI) will be available at `http://localhost:8081`.

### Running Services

You need to run each service in a separate terminal.

**1. Service Discovery (Gateway)**
```bash
cd backend/service-discovery
yarn dev
```
*Runs on Port 3001*

**2. Auth Service**
```bash
cd backend/auth
yarn dev
```
*Runs on Port 3002*

**3. Core Service**
```bash
cd backend/core
yarn dev
```
*Runs on Port 3333*

## 🤖 Marketing Automation (n8n)

**n8n** is configured in `docker-compose.yml` and runs on port `5678`.

### Accessing n8n
- **URL**: [http://localhost:5678](http://localhost:5678)
- **Username**: `admin`
- **Password**: `password`

### Marketing Endpoints
The Core service exposes endpoints for automation workflows:
- `GET /api/marketing/expiring-trials?days=7`: Returns users whose trial ends in X days.
- `GET /api/marketing/overdue-users`: Returns users with overdue subscriptions.

## 📚 API Documentation (Swagger)

Interactive API documentation is available for each service:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Service Discovery** | [http://localhost:3001/docs](http://localhost:3001/docs) | Gateway & Registry API |
| **Auth Service** | [http://localhost:3002/docs](http://localhost:3002/docs) | Authentication API |
| **Core Service** | [http://localhost:3333/docs](http://localhost:3333/docs) | Business Logic API |

## ⚙️ Configuration

### Service Discovery (`backend/service-discovery/.env`)
```env
PORT=3001
NODE_ENV=development
HOST=0.0.0.0
REDIS_HOST=localhost
REDIS_PORT=6379
GATEWAY_SERVICES="auth,core"

# Dynamic Gateway Config
SERVICE_AUTH_UPSTREAM="http://localhost:3002"
SERVICE_AUTH_PREFIX="/auth"
SERVICE_AUTH_REWRITE="/"

SERVICE_CORE_UPSTREAM="http://localhost:3333"
SERVICE_CORE_PREFIX="/api"
SERVICE_CORE_REWRITE="/api"
```

### Auth Service (`backend/auth/.env`)
```env
PORT=3002
NODE_ENV=development
SERVICE_DISCOVERY_URL="http://localhost:3001"
SERVICE_URL="http://localhost:3002"
DATABASE_URL="postgresql://admin:password@localhost:5432/psisaas?schema=public"
JWT_SECRET="supersecret"
GOOGLE_CLIENT_ID="..."
```

### Core Service (`backend/core/.env`)
```env
PORT=3333
NODE_ENV=development
SERVICE_DISCOVERY_URL="http://localhost:3001"
SERVICE_URL="http://localhost:3333"
DATABASE_URL="postgresql://admin:password@localhost:5432/psisaas?schema=public"
```

## 🛠️ Adding a New Service

1.  Create the new service (e.g., `billing`).
2.  Implement `registerService` on startup to notify Service Discovery.
3.  Add the service configuration to `backend/service-discovery/.env`:
    ```env
    GATEWAY_SERVICES="auth,core,billing"
    SERVICE_BILLING_UPSTREAM="http://localhost:4000"
    SERVICE_BILLING_PREFIX="/billing"
    SERVICE_BILLING_REWRITE="/"
    ```
4.  Restart Service Discovery.
