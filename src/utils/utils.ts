import { iUser } from '../Interfaces/iUser';

export const getJwtToken = async () => {
  return localStorage.getItem('token');
};

export const getIUser = () => {
  const json = localStorage.getItem('user');
  if (!json) return;
  return JSON.parse(json) as iUser;
};

export const getBlobFileByUrl = async (url?: string) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split('/').pop();
    const file = new File([blob], fileName || 'My file', { type: blob.type });

    return file;
  } catch (error) {
    console.log('Error fetching blob:', error);
    return null;
  }
};

export function isImage(input: any): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico)$/i;
  const imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/svg+xml',
    'image/tiff',
    'image/x-icon',
  ];

  if (input instanceof Blob) {
    return imageMimeTypes.includes(input.type);
  } else if (typeof input === 'string') {
    try {
      const parsedUrl = new URL(input);
      const pathname = parsedUrl.pathname;
      return imageExtensions.test(pathname);
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  }
  return false;
}

export function isPDF(input: any) {
  if (input instanceof Blob) {
    return input.type === 'application/pdf';
  } else if (typeof input === 'string') {
    try {
      const urlObj = new URL(input);
      return urlObj.pathname.toLowerCase().endsWith('.pdf');
    } catch (error) {
      console.log('Invalid URL:', error);
      return false;
    }
  }
  return false;
}

export const getFileMetaData = (input: File | string) => {
  if (input instanceof File) {
    return input;
  }

  const url = new URL(input);
  const name = url.pathname.split('/').pop() || 'unknown-file';
  return { name, size: undefined };
};
