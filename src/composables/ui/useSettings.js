import { useAppStore } from '../../stores/app.js'

export function hideSettingsMenu() {
  useAppStore().settingsOpen = false
}

export function hideAddDropdown() {
  useAppStore().addDropdownOpen = false
}
