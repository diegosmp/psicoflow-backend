import axios from 'axios';

export class N8nService {
  private baseUrl: string;
  private auth: { user: string; pass: string } | null;

  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    // Basic Auth if configured in n8n
    const user = process.env.N8N_USER;
    const pass = process.env.N8N_PASS;
    this.auth = user && pass ? { user, pass } : null;
  }

  async triggerWorkflow(webhookPath: string, data: any = {}) {
    try {
      const url = `${this.baseUrl}/${webhookPath}`;
      console.log(`Triggering n8n workflow: ${url}`);
      
      const config: any = {};
      if (this.auth) {
        config.auth = {
          username: this.auth.user,
          password: this.auth.pass
        };
      }

      const response = await axios.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error('Failed to trigger n8n workflow:', error);
      throw error;
    }
  }
}
