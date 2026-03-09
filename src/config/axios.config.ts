import axios from 'axios';
import ENV_VARS from './env.config';
import { getJwtToken } from '../utils/utils';

export const axiosClient = axios.create({
  baseURL: ENV_VARS.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(async (config) => {
  const token = await getJwtToken();
  config.headers.Authorization = token;
  return config;
});
