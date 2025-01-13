import { iUser } from '../Interfaces/iUser';

export const getJwtToken = async () => {
  return localStorage.getItem('token');
};

export const getIUser = () => {
  const json = localStorage.getItem('user');
  if (!json) return;
  return JSON.parse(json) as iUser;
};

export   const getBlobFileByUrl = async (url?: string) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split('/').pop();
    const file = new File([blob], fileName || 'My file', { type: blob.type });

    return file;
  } catch (error) {
    console.error('Error fetching blob:', error);
    return null;
  }
};
