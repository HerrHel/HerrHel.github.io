/**
 * storage.js — IndexedDB 持久化层（Dexie.js）
 * 作为 localStorage 的增强方案，突破 5MB 限制
 */
import Dexie from 'dexie'

const DB_NAME = 'linkvault'
const DB_VERSION = 1

const db = new Dexie(DB_NAME)
db.version(DB_VERSION).stores({
  data: 'key',
})

export async function idbSet(key, value) {
  try {
    await db.data.put({ key, value, updatedAt: Date.now() })
  } catch (e) {
    console.warn('[IDB] set error:', e)
  }
}

export async function idbGet(key) {
  try {
    const row = await db.data.get(key)
    return row?.value ?? null
  } catch (e) {
    console.warn('[IDB] get error:', e)
    return null
  }
}
