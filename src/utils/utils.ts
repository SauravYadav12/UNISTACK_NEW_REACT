import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { iUser, UserShift } from '../Interfaces/iUser';

export const getJwtToken = async () => {
  if (isTokenExpired()) {
    // toast.warning('Session expired, please login again');
    return;
  }
  return localStorage.getItem('token');
};

export function isTokenExpired() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return true;
    }
    const decoded: any = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    console.log(error);
  }
  return false;
}

export function getUserDataFromToken(): iUser | undefined {
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }
  const decoded: any = jwtDecode(token);
  return decoded?.user;
}

export function getUserIdFromToken(): string | undefined {
  const user = getUserDataFromToken();
  return user?._id || user?.id;
}
export function getUserShiftFromToken(): UserShift | undefined {
  const user = getUserDataFromToken();
  return user?.shift;
}

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

export const myGeoLocation = async (): Promise<
  GeolocationPosition | undefined
> => {
  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  } catch (error) {
    return;
  }
};

export const myIp = async () => {
  try {
    const { data } = await axios.get('https://api.ipify.org?format=json');
    return data.ip;
  } catch (error) {
    console.log('Error fetching ip:', error);
    return null;
  }
};

export const myIpGeoLocation = async () => {
  // const position = await myGeoLocation();
  // const location = position ? JSON.stringify({ ...position?.coords }) : null;
  const ip = (await myIp()) || '';
  const data = { ip, location: undefined };
  return data;
};

export const downloadFile = async (file: File | string) => {
  if (typeof file === 'string') {
    const f = await getBlobFileByUrl(file);
    if (!f) {
      return false;
    }
    file = f;
  }
  const url = URL.createObjectURL(file);
  const name =
    typeof file === 'string' ? getFileMetaData(file).name : file.name;
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
  return true;
};

export const labelizeKey = (key: string) =>
  key
    .split(/(?=[A-Z])/)
    .map((word, i) =>
      i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(' ');

export function convertValuesToEmptyString(obj: any) {
  obj = JSON.parse(JSON.stringify(obj));
  const isObject = (value: any): boolean =>
    value && typeof value === 'object' && !Array.isArray(value);
  for (const key in obj) {
    if (isObject(obj[key])) {
      obj[key] = convertValuesToEmptyString(obj[key]);
    } else {
      obj[key] = '';
    }
  }

  return obj;
}
