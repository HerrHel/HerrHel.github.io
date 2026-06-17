/**
 * crypto.js — 密码加密/解密（AES-GCM + PBKDF2）
 * 从 utils.js 提取，职责单一。
 */

export function safeAtob(s) { try { return atob(s); } catch (_) { return s; } }

/**
 * 从主密码派生 AES-GCM 密钥（PBKDF2）
 */
export async function deriveKey(masterPassword, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(masterPassword), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用 AES-GCM 加密密码
 */
export async function encryptPassword(password, masterPassword) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPassword, salt);
  const encoded = new TextEncoder().encode(password);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
    salt: Array.from(salt),
    encrypted: true
  };
}

/**
 * 使用 AES-GCM 解密密码
 */
export async function decryptPassword(stored, masterPassword) {
  if (!stored || !stored.encrypted) return stored ? safeAtob(stored) : '';
  const salt = new Uint8Array(stored.salt);
  const iv = new Uint8Array(stored.iv);
  const key = await deriveKey(masterPassword, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, key, new Uint8Array(stored.data)
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * 检测密码存储格式
 */
export function detectPasswordFormat(password) {
  if (!password) return 'empty';
  if (typeof password === 'object' && password.encrypted) return 'encrypted';
  if (typeof password === 'string') {
    try { atob(password); return 'base64'; } catch (_) { return 'plaintext'; }
  }
  return 'plaintext';
}

/**
 * 自动迁移密码格式：旧 base64 → 读取时直接返回明文
 */
export async function autoMigratePassword(storedPassword, masterPassword) {
  if (!storedPassword) return '';
  const fmt = detectPasswordFormat(storedPassword);
  if (fmt === 'encrypted') return decryptPassword(storedPassword, masterPassword);
  if (fmt === 'base64') return safeAtob(storedPassword);
  return storedPassword;
}

/**
 * 安全解码密码（带 try-catch，失败返回空字符串）
 */
export async function safeDecodePassword(storedPassword, masterPassword) {
  try { return await autoMigratePassword(storedPassword, masterPassword) } catch { return '' }
}
