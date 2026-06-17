import { reactive, watch } from 'vue'
import { useAppStore } from '../../stores/app.js'
import { favicon, domain, fixUrl } from '../../utils.js'
import { autoMigratePassword } from '../../crypto.js'
import { toast, toastWithUndo } from '../../lib/toast.js'
import { pushNavState } from '../interaction/useKeyboardOps.js'
import { previewIconUrl as previewIconUrlBase, clearIcon as clearIconBase } from '../ui/useIconPreview.js'

/** Async decode — handles AES-GCM encrypted passwords with master password */
async function _decodePasswordForFormAsync(stored, masterPassword) {
  if (!stored) return ''
  if (typeof stored === 'object' && stored.encrypted) {
    if (!masterPassword) return ''
    try { return await autoMigratePassword(stored, masterPassword) } catch (_) { return '' }
  }
  if (typeof stored === 'string') { try { return atob(stored) } catch (_) { return stored } }
  return ''
}

/**
 * Reactive form state for BookmarkModal.
 * Replaces all DOM getElementById/readElementById operations.
 */
export const bmForm = reactive({
  id: '',
  title: '',
  url: '',
  username: '',
  password: '',
  notes: '',
  icon: '',
  categoryId: '',
  parentId: null,
  attributes: {},
  isOpen: false,
  isEdit: false,
  addToGroupMode: false,
  showPassword: false,
  logoPreviewVisible: false,
  logoPreviewUrl: '',
  logoPreviewText: '',
  iconPreviewVisible: false,
  iconPreviewUrl: '',
  clearIconVisible: false,
})

export function openBookmark(bm) {
  if (!bm?.url) return
  const store = useAppStore()
  bm.useCount = (bm.useCount || 0) + 1
  store.debouncedSave()
  window.open(fixUrl(bm.url), '_blank')
}

export function visit(e, id) {
  if (e?.target?.closest?.('button, input, .btn-xs, .card-actions, .group-body, [contenteditable="true"]')) return
  const bmId = id || e?.target?.closest?.('.card[data-id]')?.dataset?.id
  if (!bmId) return
  const store = useAppStore()
  openBookmark(store.bookmarkMap[bmId])
}

export async function openBmModal(editId) {
  const store = useAppStore()
  const bm = editId ? store.bookmarkMap[editId] : null

  // If bookmark has AES-GCM encrypted password, ensure master password is available
  if (bm?.password && typeof bm.password === 'object' && bm.password.encrypted && !store.masterPassword) {
    // Open master password modal first; after verification, re-open this modal
    const _pendingEditId = editId
    store.masterPasswordOpen = true
    const unwatch = watch(
      () => store.masterPassword,
      (pw) => {
        if (pw) { unwatch(); openBmModal(_pendingEditId) }
      }
    )
    return
  }

  // Set all synchronous form fields BEFORE await, so that addSub() can
  // override parentId etc. without being overwritten when this async function resumes.
  bmForm.id = bm?.id || ''
  bmForm.title = bm?.title || ''
  bmForm.url = bm?.url || ''
  bmForm.username = bm?.username || ''
  bmForm.notes = bm?.notes || ''
  bmForm.icon = bm?.icon || ''
  bmForm.categoryId = bm?.categoryId || ''
  bmForm.parentId = bm?.parentId || null
  bmForm.attributes = bm?.attributes ? { ...bm.attributes } : {}
  bmForm.isEdit = !!editId
  bmForm.showPassword = false
  bmForm.logoPreviewVisible = false
  bmForm.logoPreviewUrl = ''
  bmForm.logoPreviewText = ''
  bmForm.iconPreviewVisible = !!bm?.icon
  bmForm.iconPreviewUrl = bm?.icon || ''
  bmForm.clearIconVisible = !!bm?.icon

  // Async password decode (AES-GCM with master password, or legacy base64)
  bmForm.password = await _decodePasswordForFormAsync(bm?.password, store.masterPassword)

  store.editingId = editId || null
  store.lastFocusedEl = document.activeElement
  pushNavState()
  store.bmModalOpen = true
  bmForm.isOpen = true
}

export function closeBmModal() {
  bmForm.isOpen = false
  bmForm.addToGroupMode = false
  const store = useAppStore()
  store.bmModalOpen = false
  store.editingId = null
  if (store.lastFocusedEl) store.lastFocusedEl.focus()
  store.lastFocusedEl = null
}

export async function saveBm() {
  const store = useAppStore()
  const title = bmForm.title.trim()
  const url = fixUrl(bmForm.url)
  if (!title || !url) { toast('请填写名称和网址', false); return }

  // Encrypt password with AES-GCM if master password is set, else fall back to base64
  let storedPassword = ''
  if (bmForm.password) {
    if (store.masterPassword) {
      try {
        storedPassword = await store.encryptFormPassword(bmForm.password)
      } catch (e) {
        toast('密码加密失败: ' + e.message, false)
        return
      }
    } else {
      // Legacy base64 fallback (auto-migrated to AES-GCM when master password is set later)
      storedPassword = btoa(bmForm.password)
    }
  }

  const data = {
    title, url,
    username: bmForm.username.trim(),
    password: storedPassword,
    notes: bmForm.notes.trim(),
    icon: bmForm.icon.trim(),
    categoryId: bmForm.categoryId,
    parentId: bmForm.parentId || null,
    attributes: { ...bmForm.attributes },
  }

  if (bmForm.id) {
    const bm = store.bookmarkMap[bmForm.id]
    if (bm) Object.assign(bm, data)
    toast('书签已更新')
  } else {
    data.id = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    data.order = store.bookmarks.length
    data.useCount = 0
    data.isExpanded = false
    data.createdAt = Date.now()
    store.addBookmark(data)
    store.save()
    toast('书签已添加')
    if (store.saveToGroup) {
      const targetGid = store.saveToGroup
      store.saveToGroup = null
      const sg = store.groupMap[targetGid]
      if (sg && sg.bookmarkIds.indexOf(data.id) === -1) {
        sg.bookmarkIds.push(data.id)
        sg.updatedAt = Date.now()
        store.save()
        toast('已添加到组')
      }
    }
  }
  if (bmForm.id) store.save()
  closeBmModal()
}

export function addSub(parentId) {
  useAppStore().saveToGroup = null
  openBmModal()
  bmForm.parentId = parentId
  bmForm.categoryId = ''
  bmForm.username = ''
  bmForm.password = ''
  bmForm.icon = ''
  bmForm.clearIconVisible = false
  bmForm.iconPreviewVisible = false
}

export function previewLogo() {
  const url = bmForm.url
  const fixed = url.startsWith('http') ? url : 'https://' + url
  if (url && url.length > 3) {
    bmForm.logoPreviewVisible = true
    bmForm.logoPreviewUrl = favicon(fixed)
    bmForm.logoPreviewText = domain(fixed)
  } else {
    bmForm.logoPreviewVisible = false
  }
}

export function previewIconUrl() { previewIconUrlBase(bmForm) }

export function clearIcon() { clearIconBase(bmForm) }

/** Collect all sub-bookmark IDs recursively */
function collectSubIds(id) {
  const store = useAppStore()
  let ids = [id]
  store.bookmarks.filter(b => b.parentId === id).forEach(c => {
    ids = ids.concat(collectSubIds(c.id))
  })
  return ids
}

export function deleteBookmarkWithUndo(id, skipRender) {
  const store = useAppStore()
  const ids = collectSubIds(id)
  const snapshot = { bookmarks: [], groups: {} }
  ids.forEach(bid => {
    const b = store.bookmarkMap[bid]
    if (b) { snapshot.bookmarks.push(JSON.parse(JSON.stringify(b))); }
  })
  ids.forEach(id => {
    store.siblingGroups.forEach(g => {
      if (g.bookmarkIds.indexOf(id) > -1) {
        if (!snapshot.groups[id]) snapshot.groups[id] = []
        if (snapshot.groups[id].indexOf(g.id) === -1) snapshot.groups[id].push(g.id)
      }
      g.bookmarkIds = g.bookmarkIds.filter(x => x !== id)
    })
  })
  for (let bi = store.bookmarks.length - 1; bi >= 0; bi--) {
    if (ids.indexOf(store.bookmarks[bi].id) !== -1) store.bookmarks.splice(bi, 1)
  }
  store.debouncedSave()
  toastWithUndo('书签已删除', () => {
    snapshot.bookmarks.forEach(b => store.bookmarks.push(b))
    Object.keys(snapshot.groups).forEach(bid => {
      snapshot.groups[bid].forEach(gid => {
        const sg = store.groupMap[gid]
        if (sg && sg.bookmarkIds.indexOf(bid) === -1) sg.bookmarkIds.push(bid)
      })
    })
    store.debouncedSave()
    toast('已恢复')
  })
}
