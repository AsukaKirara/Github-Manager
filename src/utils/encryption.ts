import CryptoJS from 'crypto-js';

// Use a consistent encryption key (in a real app, this would be better secured)
const getEncryptionKey = (): string => {
  // We'll use a key stored in localStorage with a fallback to a generated one
  let key = localStorage.getItem('encryption_key');
  
  if (!key) {
    // Generate a random key if one doesn't exist
    key = CryptoJS.lib.WordArray.random(16).toString();
    localStorage.setItem('encryption_key', key);
  }
  
  return key;
};

export const encryptData = (data: string): string => {
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(data, key).toString();
};

export const decryptData = (encryptedData: string): string => {
  const key = getEncryptionKey();
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};