import { setActivePinia, createPinia } from 'pinia'
import { vi, beforeEach } from 'vitest'

const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString() }),
    removeItem: vi.fn(key => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn(index => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  setActivePinia(createPinia())
  localStorageMock.clear()
  vi.clearAllMocks()
})

export { localStorageMock }
