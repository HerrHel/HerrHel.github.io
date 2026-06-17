/**
 * security.js — 安全 Store
 * 职责：主密码管理、密码加密/解密、密码验证
 * 从 app.js 拆分而来
 */
import { defineStore } from 'pinia'
import { encryptPassword, autoMigratePassword } from '../crypto.js'
import { toast } from '../lib/toast.js'
import { useDataStore } from './data.js'

export const useSecurityStore = defineStore('security', {
  state: () => ({
    masterPassword: '',
    masterPasswordOpen: false,
  }),

  actions: {
    setMasterPassword(pw) { this.masterPassword = pw },

    async encryptFormPassword(plaintext) {
      if (!this.masterPassword) throw new Error('请先设置主密码')
      return await encryptPassword(plaintext, this.masterPassword)
    },

    async decryptStoredPassword(stored) {
      return await autoMigratePassword(stored, this.masterPassword || '')
    },

    /** 通过尝试解密已有加密书签来验证主密码 */
    async verifyMasterPassword(pw) {
      const ds = useDataStore()
      const canary = ds.bookmarks.find(b => b.password && typeof b.password === 'object' && b.password.encrypted)
      if (canary) {
        try {
          await autoMigratePassword(canary.password, pw)
          return true
        } catch (_) { return false }
      }
      return !!pw
    },

    clearMasterPassword() {
      this.masterPassword = ''
      toast('主密码已清除')
    },
  },
})
