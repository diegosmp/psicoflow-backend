# Automation Service

This service handles automation tasks for Psicoflow, including marketing workflows and integrations with n8n.

## Features

- **Marketing Automation**: Endpoints to retrieve users with expiring trials or overdue subscriptions.
- **n8n Integration**: Triggers and supports n8n workflows for email dispatch and other automated tasks.

## API Endpoints

### Marketing

- `GET /api/marketing/expiring-trials`: Returns a list of users whose trials are expiring in a specified number of days (default: 7).
  - Query Params: `days` (number)
  - Response: `{ data: User[] }`

- `GET /api/marketing/overdue-users`: Returns a list of users with overdue subscriptions.
  - Response: `{ data: User[] }`

- `POST /api/marketing/trigger`: Manually triggers an n8n workflow.
  - Body: `{ workflowId: string, data?: object }`

## n8n Workflow

The marketing automation workflow is defined in `backend/n8n/marketing-workflow.json`.

### Setup

1. Import the `marketing-workflow.json` into your n8n instance.
2. Configure the HTTP Request nodes to point to this service (e.g., `http://host.docker.internal:3003`).
3. Configure the SMTP credentials in the "Send Email" nodes.

### Workflow Logic

1. **Daily Trigger**: Runs every day at 9:00 AM.
2. **Get Expiring Trials**: Fetches users from `/api/marketing/expiring-trials`.
3. **Get Overdue Users**: Fetches users from `/api/marketing/overdue-users`.
4. **Split & Send**: Iterates over the results and sends appropriate emails.

## Development

Run the service:

```bash
yarn dev
```

The service runs on port `3003` by default.
