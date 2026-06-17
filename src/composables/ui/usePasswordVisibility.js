/**
 * usePasswordVisibility — 密码显示/隐藏状态管理
 * 避免在 BookmarkCard.vue 和 DetailPanel.vue 中重复实现
 */
import { ref, onUnmounted } from 'vue'

export function usePasswordVisibility(autoHideMs = 5000) {
  const visibleIds = ref(new Set())
  let timer = null

  function toggle(id) {
    if (visibleIds.value.has(id)) {
      visibleIds.value.delete(id)
    } else {
      visibleIds.value.add(id)
      clearTimeout(timer)
      timer = setTimeout(() => { visibleIds.value.clear() }, autoHideMs)
    }
  }

  function isVisible(id) {
    return visibleIds.value.has(id)
  }

  function hideAll() {
    visibleIds.value.clear()
    clearTimeout(timer)
  }

  onUnmounted(() => {
    clearTimeout(timer)
  })

  return { visibleIds, toggle, isVisible, hideAll }
}
