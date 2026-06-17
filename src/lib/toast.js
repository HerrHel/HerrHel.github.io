// toast.js — 兼容层
// 此文件通过 bridge.js 调用 ToastContainer.vue 注册的实现

import { toastAPI } from '../composables/bridge.js'

export function toast(msg, ok = true) {
  toastAPI?.toast(msg, ok)
}

export function toastWithUndo(msg, undoFn, duration = 6000) {
  toastAPI?.toastWithUndo(msg, undoFn, duration)
}

export function showConfirm(msg, onConfirm) {
  toastAPI?.showConfirm(msg, onConfirm)
}