import axios from 'axios';

export async function registerService(serviceName: string, serviceUrl: string, discoveryUrl: string) {
  const maxRetries = 5;
  const retryDelay = 2000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(`${discoveryUrl}/register`, {
        name: serviceName,
        url: serviceUrl,
      });
      console.log(`Registered with Service Discovery: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      console.error(`Failed to register with Service Discovery (attempt ${i + 1}/${maxRetries}):`, (error as any).message);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error('Max retries reached. Could not register service.');
  return null;
}

export async function sendHeartbeat(serviceName: string, id: string, discoveryUrl: string) {
  try {
    await axios.post(`${discoveryUrl}/heartbeat`, {
      name: serviceName,
      id: id,
    });
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}
