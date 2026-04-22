import { axiosClient } from '../config/axios.config';
import { AiResponse } from '../Interfaces/ai';

export async function askAi(
  prompt: string,
  context?: Record<string, unknown>
): Promise<AiResponse> {
  const res = await axiosClient.post('/ai/ask', { prompt, context });
  return res.data;
}

export async function getAiInsights(
  module: string,
  data?: Record<string, unknown>
): Promise<AiResponse> {
  const res = await axiosClient.post('/ai/insights', { module, data });
  return res.data;
}

export async function getAiSuggestions(
  type: string,
  context?: Record<string, unknown>
): Promise<AiResponse> {
  const res = await axiosClient.post('/ai/suggestions', { type, context });
  return res.data;
}
