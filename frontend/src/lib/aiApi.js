/**
 * AquaWatch AI API Client
 * Calls the Next.js /api/predict proxy which forwards to the FastAPI AI service.
 * Never calls the AI service directly from the browser.
 */
import axios from 'axios';

const client = axios.create({ baseURL: '' }); // relative — same Next.js origin

/**
 * @param {object} payload - ShortageRequest fields
 * @returns {Promise<ShortageResponse>}
 */
export async function predictShortage(payload) {
  const { data } = await client.post('/api/predict', {
    type: 'shortage',
    payload,
  });
  return data;
}

/**
 * @param {object} payload - LeakRequest fields
 * @returns {Promise<LeakResponse>}
 */
export async function predictLeak(payload) {
  const { data } = await client.post('/api/predict', {
    type: 'leak',
    payload,
  });
  return data;
}

/**
 * @param {object} payload - PumpControlRequest fields
 * @returns {Promise<PumpControlResponse>}
 */
export async function predictPump(payload) {
  const { data } = await client.post('/api/predict', {
    type: 'pump',
    payload,
  });
  return data;
}
