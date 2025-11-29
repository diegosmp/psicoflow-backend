import axios from 'axios';

export async function registerService(
  serviceName: string,
  serviceUrl: string,
  discoveryUrl: string
) {
  try {
    const response = await axios.post(`${discoveryUrl}/register`, {
      name: serviceName,
      url: serviceUrl,
    });
    console.log(`Registered with Service Discovery: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error('Failed to register service:', error);
    return null;
  }
}

export async function sendHeartbeat(
  serviceName: string,
  serviceId: string,
  discoveryUrl: string
) {
  try {
    await axios.post(`${discoveryUrl}/heartbeat`, {
      name: serviceName,
      id: serviceId,
    });
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}
