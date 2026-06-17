/**
 * app.js — 兼容层（组合 Store）
 * 组合 data / ui / security 三个子 Store，保持向后兼容。
 * 新代码建议直接使用 useDataStore / useUIStore / useSecurityStore。
 */
import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useDataStore } from './data.js'
import { useUIStore } from './ui.js'
import { useSecurityStore } from './security.js'
import * as persist from './persist.js'
import { cleanStaleUndoStacks } from '../composables/domain/useUndo.js'

export const useAppStore = defineStore('app', () => {
  const ds = () => useDataStore()
  const ui = () => useUIStore()
  const sec = () => useSecurityStore()

  // ── 数据（只读，委托 dataStore）──
  const bookmarks = computed(() => ds().bookmarks)
  const siblingGroups = computed(() => ds().siblingGroups)
  const categories = computed(() => ds().categories)
  const customAttributes = computed(() => ds().customAttributes)
  const bookmarkMap = computed(() => ds().bookmarkMap)
  const groupMap = computed(() => ds().groupMap)
  const childrenMap = computed(() => ds().childrenMap)
  const filteredBookmarks = computed(() => ds().filteredBookmarks)
  const filteredGroups = computed(() => ds().filteredGroups)
  const cardCounts = computed(() => ds().cardCounts)

  // ── 安全（只读，委托 securityStore）──
  const masterPassword = computed(() => sec().masterPassword)
  const masterPasswordOpen = computed(() => sec().masterPasswordOpen)

  // Helper: 可读写 computed，委托 uiStore
  const uiProp = (key) => computed({
    get: () => ui()[key],
    set: (v) => { ui()[key] = v }
  })

  return {
    bookmarks, siblingGroups, categories, customAttributes,
    bookmarkMap, groupMap, childrenMap,
    filteredBookmarks, filteredGroups, cardCounts,
    selectableCategories: computed(() => ds().selectableCategories),
    masterPassword, masterPasswordOpen,

    // ── UI 状态（可读写，委托 uiStore）──
    curCat: uiProp('curCat'),
    sortMode: uiProp('sortMode'),
    sortDir: uiProp('sortDir'),
    layoutMode: uiProp('layoutMode'),
    searchQuery: uiProp('searchQuery'),
    focusedGroupId: uiProp('focusedGroupId'),
    batchMode: uiProp('batchMode'),
    batchSelected: uiProp('batchSelected'),
    activeAttrs: uiProp('activeAttrs'),
    excludedAttrs: uiProp('excludedAttrs'),
    detailCards: uiProp('detailCards'),
    detailOpen: uiProp('detailOpen'),
    editingId: uiProp('editingId'),
    themeMode: uiProp('themeMode'),
    themeStyle: uiProp('themeStyle'),
    settingsOpen: uiProp('settingsOpen'),
    addDropdownOpen: uiProp('addDropdownOpen'),
    railOpen: uiProp('railOpen'),
    bmModalOpen: uiProp('bmModalOpen'),
    addBmPopoverOpen: uiProp('addBmPopoverOpen'),
    catModalOpen: uiProp('catModalOpen'),
    attrModalOpen: uiProp('attrModalOpen'),
    groupEditOpen: uiProp('groupEditOpen'),
    confirmModalOpen: uiProp('confirmModalOpen'),
    confirmModalMessage: uiProp('confirmModalMessage'),
    confirmModalCallback: uiProp('confirmModalCallback'),
    mentionGid: uiProp('mentionGid'),
    mentionQuery: uiProp('mentionQuery'),
    mentionIdx: uiProp('mentionIdx'),
    mentionActive: uiProp('mentionActive'),
    mentionType: uiProp('mentionType'),
    mentionSubMode: uiProp('mentionSubMode'),
    mentionSubIdx: uiProp('mentionSubIdx'),
    addToGid: uiProp('addToGid'),
    _addPopoverTrigger: uiProp('_addPopoverTrigger'),
    saveToGroup: uiProp('saveToGroup'),
    ctxGid: uiProp('ctxGid'),
    ctxCard: uiProp('ctxCard'),
    editingGeId: uiProp('editingGeId'),
    lastFocusedEl: uiProp('lastFocusedEl'),
    lpFired: uiProp('lpFired'),
    _prevLayoutMode: uiProp('_prevLayoutMode'),
    _cachedStorageInfo: uiProp('_cachedStorageInfo'),
    _storageInfoDirty: uiProp('_storageInfoDirty'),
    _saveCount: uiProp('_saveCount'),
    _saveTimer: uiProp('_saveTimer'),

    // ── CRUD（委托 dataStore）──
    addBookmark(bm) { ds().addBookmark(bm) },
    updateBookmark(id, changes) { ds().updateBookmark(id, changes) },
    deleteBookmark(id) { ds().deleteBookmark(id) },
    addGroup(g) { ds().addGroup(g) },
    updateGroup(id, changes) { ds().updateGroup(id, changes) },
    deleteGroup(id) { ds().deleteGroup(id) },
    addCategory(cat) { ds().addCategory(cat) },
    renameCategory(id, name) { ds().renameCategory(id, name) },
    deleteCategory(id) { ds().deleteCategory(id) },
    addAttribute(attr) { ds().addAttribute(attr) },
    renameAttribute(id, name) { ds().renameAttribute(id, name) },
    deleteAttribute(id) { ds().deleteAttribute(id) },
    importFromData(data) {
      ds().importFromData(data)
      const u = ui()
      u.curCat = 'all'; u.focusedGroupId = null
      u.activeAttrs = []; u.excludedAttrs = []; u.detailCards = []
      this.save()
    },

    // ── UI（委托 uiStore）──
    selectAllBatch() { ui().selectAllBatch() },
    saveUIState() { ui().saveUIState() },
    restoreUIState() { ui().restoreUIState() },

    // ── 安全（委托 securityStore）──
    setMasterPassword(pw) { sec().setMasterPassword(pw) },
    encryptFormPassword(plaintext) { return sec().encryptFormPassword(plaintext) },
    decryptStoredPassword(stored) { return sec().decryptStoredPassword(stored) },
    verifyMasterPassword(pw) { return sec().verifyMasterPassword(pw) },
    clearMasterPassword() { sec().clearMasterPassword() },

    // ── 持久化（协调多个 Store）──
    loadFromStorage() { ds().loadFromStorage() },
    tryLoadFromIDB() { return ds().tryLoadFromIDB() },

    save() {
      const u = ui()
      u._storageInfoDirty = true
      u._saveCount++
      const data = ds()._dataSnapshot()
      const ok = persist.saveToLocalStorage(data)
      if (!ok) { console.warn('[store] localStorage save failed') }
      persist.saveToIDB(data)
      if (u._saveCount % 10 === 0) cleanStaleUndoStacks()
    },

    debouncedSave() {
      const u = ui()
      if (u._saveTimer) clearTimeout(u._saveTimer)
      u._saveTimer = setTimeout(() => {
        u._saveTimer = null
        this.save()
      }, 300)
    },

    _dataSnapshot() { return ds()._dataSnapshot() },

    getStorageInfo() {
      const u = ui()
      if (!u._storageInfoDirty && u._cachedStorageInfo) return u._cachedStorageInfo
      u._cachedStorageInfo = persist.getStorageInfo(this._dataSnapshot())
      u._storageInfoDirty = false
      return u._cachedStorageInfo
    },

    _backupBeforeImport() { persist.saveToLocalStorage(this._dataSnapshot()) },
  }
})
