/**
 * utils.js — 通用工具函数
 * 职责：ID 生成、URL/域名处理、HTML 清理、UI 辅助
 * 密码加密 → crypto.js  |  拖拽辅助 → composables/useDragDrop.js
 */
import { toast } from './lib/toast.js';
import DOMPurify from 'dompurify';
import { nanoid } from 'nanoid';

// ── ID / URL / 域名 ──

export function gid() { return nanoid(12); }
export function domain(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return url; } }
export function favicon(url, customIcon) {
  if (customIcon) return customIcon
  const dm = domain(url)
  return dm ? 'https://api.xinac.net/icon/?url=' + dm : ''
}
export function fixUrl(u) { u = u.trim(); if (!u) return u; if (/^https?:\/\//i.test(u)) return u; return 'https://' + u; }

// ── HTML / 文本 ──

export function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

const _purifyConfig = {
  ADD_TAGS: ['details', 'summary'],
  ADD_ATTR: ['contenteditable', 'draggable', 'data-bm-id', 'data-gid', 'data-group-id'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'textarea', 'select'],
  FORBID_ATTR: ['onerror', 'onload'],
};

export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, _purifyConfig);
}

export function cleanZeroWidth(text) { return text.replace(/​{2,}/g, '​'); }

// ── UI 辅助 ──

export function swapOrder(a, b) { if (a.order === b.order) b.order++; const t = a.order; a.order = b.order; b.order = t; }

export function copyToClipboard(text, label) {
  if (navigator.clipboard) { navigator.clipboard.writeText(text).catch(function () {}); }
  else { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  toast((label || '') + ' 已复制');
}

export function isMobile() { return window.innerWidth <= 768; }

export function getTagNames(item, customAttributes) {
  if (!item.attributes) return []
  return customAttributes.filter(a => a.id !== 'is-group' && item.attributes[a.id]).map(a => a.name)
}

// ── 分类 ──

const CATEGORY_COLORS = ['#122E8A', '#E63948', '#d97706', '#7c3aed', '#0d9488', '#db2777', '#2563eb', '#059669']

export function createCategory(name) {
  return { id: gid(), name, icon: 'star', color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)] }
}

export function addNewCategory(name, store) {
  const trimmed = name.trim()
  if (!trimmed) { toast('请输入分类名称', false); return null }
  if (store.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) { toast('分类名称已存在', false); return null }
  const cat = createCategory(trimmed)
  store.addCategory(cat)
  store.save()
  toast('分类已添加')
  return cat
}

export function stripEntranceAnim(el) {
  if (!el) return null
  const onEnd = (e) => {
    if (e.animationName === 'listExpandIn') {
      el.style.animationName = el.style.animationName.replace(/listExpandIn\s*,?\s*/, '').trim() || 'none'
      return
    }
    if (e.animationName === 'listCardIn') {
      el.style.animationName = 'none'
      el.removeEventListener('animationend', onEnd)
    }
  }
  el.addEventListener('animationend', onEnd)
  return () => el.removeEventListener('animationend', onEnd)
}

