/**
 * bridge.js — 模块级服务注册表
 *
 * 为什么用模块级单例而非 provide/inject？
 * ─────────────────────────────────────────
 * 本项目中多个 API 引用来自 composable 模块级代码（非 Vue 组件 setup 上下文），
 * 例如 toast.js、useUndo.js、useKeyboardOps.js 等。provide/inject 仅在组件 setup 中可用，
 * 无法满足这些模块的调用需求。因此模块级单例是当前架构下的正确选择。
 *
 * 注册方（Vue 组件 onMounted）：  ToastContainer、ContextMenu、ActionSheet、...
 * 消费方（composable / 组件）：   toast.js、useUndo.js、App.vue、...
 */

// --- Mention ---
export let mentionAPI = null
export function setMentionAPI(api) { mentionAPI = api }

// --- Toast / Confirm ---
export let toastAPI = null
export function setToastAPI(api) { toastAPI = api }

// --- Context Menu ---
export let ctxMenuAPI = null
export function setCtxMenuAPI(api) { ctxMenuAPI = api }

// --- Action Sheet ---
export let actionSheetAPI = null
export function setActionSheetAPI(api) { actionSheetAPI = api }

// --- Attr Dropdown ---
export let attrDropdownAPI = null
export function setAttrDropdownAPI(api) { attrDropdownAPI = api }

// --- Batch Move Popover ---
export let batchMoveAPI = null
export function setBatchMoveAPI(api) { batchMoveAPI = api }

// --- Mobile Format Bar ---
export let mfbAPI = null
export function setMfbAPI(api) { mfbAPI = api }
