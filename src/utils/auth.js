import { Platform } from 'react-native';

const STORAGE_KEY = 'looma_current_user';
let memoryUser = null;

const getCandidateUrls = () => {
  const host = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) 
    ? window.location.hostname 
    : 'localhost';
  
  const urls = [
    `http://${host}:8001`,
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    `http://${host}:8000`,
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];
  return Array.from(new Set(urls));
};

export const getStoredUser = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to read auth user from localStorage', e);
    }
  }
  return memoryUser;
};

export const setStoredUser = (user) => {
  memoryUser = user;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      if (user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to write auth user to localStorage', e);
    }
  }
};

export const clearStoredUser = () => {
  memoryUser = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (_e) {}
  }
};

const sendAuthRequest = async (path, bodyObj) => {
  const candidateUrls = getCandidateUrls();

  for (const base of candidateUrls) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bodyObj),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          message: data.detail || (res.status === 401 ? 'Username atau password salah!' : 'Permintaan gagal.'),
        };
      }

      return {
        success: true,
        status: res.status,
        data,
      };
    } catch (_err) {
      // Try next candidate URL
    }
  }

  return {
    success: false,
    status: 0,
    message: 'Tidak dapat terhubung ke server backend (port 8001 / 8000). Pastikan server backend sedang berjalan.',
  };
};

export const loginUser = async ({ username, password }) => {
  const cleanUsername = username?.trim?.() || '';
  if (!cleanUsername || !password) {
    return {
      success: false,
      message: 'Username dan password wajib diisi!',
    };
  }

  const result = await sendAuthRequest('/api/auth/login', {
    username: cleanUsername,
    password,
  });

  if (!result.success) {
    return result;
  }

  if (result.data?.user) {
    setStoredUser(result.data.user);
  }

  return {
    success: true,
    user: result.data.user,
    message: result.data.message || 'Login berhasil!',
  };
};

export const registerUser = async ({ fullName, username, password }) => {
  const cleanUsername = username?.trim?.() || '';
  if (!cleanUsername || !password) {
    return {
      success: false,
      message: 'Username dan password wajib diisi!',
    };
  }

  const result = await sendAuthRequest('/api/auth/register', {
    fullName: fullName?.trim?.() || '',
    username: cleanUsername,
    password,
  });

  if (!result.success) {
    return result;
  }

  if (result.data?.user) {
    setStoredUser(result.data.user);
  }

  return {
    success: true,
    user: result.data.user,
    message: result.data.message || 'Registrasi berhasil!',
  };
};
