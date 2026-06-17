/**
 * useIconPreview — 图标 URL 预览/清除通用逻辑
 * 供 useBookmark (bmForm) 和 useGroup (geForm) 复用。
 */

export function previewIconUrl(form) {
  const url = form.icon.trim()
  if (url) {
    form.clearIconVisible = true
    form.iconPreviewVisible = true
    form.iconPreviewUrl = url
  } else {
    form.clearIconVisible = false
    form.iconPreviewVisible = false
  }
}

export function clearIcon(form) {
  form.icon = ''
  form.clearIconVisible = false
  form.iconPreviewVisible = false
}
