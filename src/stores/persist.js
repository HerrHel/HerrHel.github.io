import { STORAGE_KEY, DEFAULTS } from '../config/constants.js'
import { runMigrations } from './migrations.js'
import { idbGet, idbSet } from './storage.js'

const IDB_KEY = 'linkvault_v2'

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      const result = {
        categories: d.categories || DEFAULTS.categories.slice(),
        bookmarks: d.bookmarks || [],
        customAttributes: d.customAttributes || [],
        siblingGroups: d.siblingGroups || []
      }
      const needsPersist = runMigrations(d, result)
      if (needsPersist) saveToLocalStorage(result)
      return result
    }
  } catch (e) { console.warn('[persist] localStorage load failed:', e.message) }
  return JSON.parse(JSON.stringify(DEFAULTS))
}

export async function loadFromIDB(currentData) {
  try {
    const idbData = await idbGet(IDB_KEY)
    if (idbData && idbData.bookmarks) {
      // Use bookmark count + group count as a simple "freshness" heuristic.
      // If IDB has >= the same number of items, consider it at least as fresh.
      const idbCount = (idbData.bookmarks?.length || 0) + (idbData.siblingGroups?.length || 0)
      const localCount = (currentData.bookmarks?.length || 0) + (currentData.siblingGroups?.length || 0)
      if (idbCount >= localCount) return idbData
    }
  } catch (e) { console.warn('[persist] IDB load fallback:', e.message) }
  return null
}

export function saveToLocalStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[persist] localStorage save failed:', e.message)
    return false
  }
  return true
}

let _idbTimer = null
export function saveToIDB(data) {
  if (_idbTimer) clearTimeout(_idbTimer)
  _idbTimer = setTimeout(() => {
    _idbTimer = null
    // Deep-clone to strip Pinia Proxy wrappers (IDB cannot structuredClone Proxy objects)
    const plain = JSON.parse(JSON.stringify(data))
    idbSet(IDB_KEY, plain).catch(e =>
      console.warn('[persist] IDB sync failed:', e.message))
  }, 500)
}

export function getStorageInfo(data) {
  try {
    const bytes = new Blob([JSON.stringify(data)]).size
    const sizeKB = bytes / 1024
    const percent = Math.min(100, Math.round(bytes / 5242880 * 100))
    return {
      size: sizeKB, percent,
      label: sizeKB < 1024
        ? sizeKB.toFixed(1) + ' KB'
        : (sizeKB / 1024).toFixed(1) + ' MB'
    }
  } catch (_) { return { size: 0, percent: 0, label: '0 KB' } }
}
