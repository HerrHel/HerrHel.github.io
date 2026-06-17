# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LinkVault — 单页书签管理器（PWA），Vue 3 + Pinia + TipTap 编辑器，Vite 构建。数据持久化于 localStorage + IndexedDB（Dexie），UI 为中文。

## 常用命令

```bash
npm run dev         # 开发服务器（自动打开浏览器）
npm run build       # 生产构建到 dist/（含 PurgeCSS）
npm run preview     # 预览生产构建
npm run lint        # ESLint 检查 src/
npm run test        # 运行所有测试（vitest run）
npm run test:watch  # 监听模式运行测试
```

运行单个测试文件：`npx vitest run src/__tests__/utils.test.js`

## 架构

### 数据流

- **Pinia Store** (`src/stores/app.js`)：唯一的全局状态源，持有 bookmarks、siblingGroups、categories、customAttributes 及所有 UI 状态
- **持久化** (`src/stores/persist.js`)：loadFromLocalStorage → runMigrations → 写回；IndexedDB (`src/stores/storage.js`, Dexie) 作为 localStorage 的增强，突破 5MB 限制
- **数据迁移** (`src/stores/migrations.js`)：旧格式兼容，在加载时自动执行

### Composables 层

composables 按职责分三组：

- `composables/domain/` — 业务逻辑：useBookmark、useGroup、useBatch、useAttrFilter、useDataIO、useUndo、useMention
- `composables/interaction/` — 交互行为：useKeyboard、useDragDrop、useMobileDragReorder、useResize、useScrollHeader、useLongPress、useKeyboardOps
- `composables/ui/` — UI 辅助：useUI、useSettings、useIconPreview、usePasswordVisibility

**bridge.js** 是模块级服务注册表（非 provide/inject），解决 composable 模块级代码无法使用 Vue 组件上下文的问题。组件 onMounted 注册 API，composable 消费方通过 bridge 引用。

### EditorManager

`src/lib/editor.js` 维护一个编辑器注册表 `_editors`。GroupEditor.vue 在 onMounted 时注册 TipTap 实例，EditorManager 提供格式化命令（bold/heading/list/taskList/color）和内容操作。Group 的 `notes` 字段存储 TipTap HTML。

### 组件结构

- `components/cards/` — BookmarkCard、GroupCard、CardGrid
- `components/editor/` — GroupEditor、FormatToolbar
- `components/modals/` — BookmarkModal、CategoryModal、AttributeModal、GroupEditModal、ConfirmModal、MasterPasswordModal
- `components/overlays/` — ContextMenu、ActionSheet、BatchPopover、SearchSuggest、ToastContainer、MentionDropdown
- `components/shell/` — AppHeader、AppNav、FilterBar、BatchBar、BatchBottom、DetailPanel、SettingsPanel

### 数据模型

类型定义见 `src/config/types.d.js`（JSDoc @typedef）：
- **Bookmark**：id, title, url, username, password（支持 base64 和 AES-GCM 加密）, notes, categoryId, parentId, order, attributes, useCount
- **SiblingGroup**：id, name, categoryId, bookmarkIds[], notes (HTML), attributes, order
- **Category**：id, name, icon, color
- **CustomAttribute**：id, name, type: 'boolean'

### 密码加密

`src/crypto.js`：AES-GCM + PBKDF2（100k 迭代）。旧 base64 密码通过 autoMigratePassword 自动迁移。

### 构建配置

- **路径别名**：`@/*` → `src/*`（jsconfig.json）
- **手动分包**：tiptap、sortable、dexie、dompurify、vue-vendor（vite.config.js）
- **PurgeCSS**：自定义 Vite 插件，safelist 保护动态类名（`/^card-/`, `/^modal-/`, `/^ctx-/` 等前缀）
- **PWA**：vite-plugin-pwa，缓存策略见 vite.config.js 中 workbox 配置

## 编码规范

- **禁止 var**，用 const/let
- 新 Vue 组件放入 `src/components/` 对应子目录
- UI 文本用中文，代码注释用中文
- 测试文件放 `src/__tests__/`，使用 vitest + jsdom + @vue/test-utils

## 移动端拖拽排序

`useMobileDragReorder.js` 是纯原生 pointer events 实现（非第三方库），iOS 原生风格：
- 原元素 `position: fixed` 跟手，无克隆体
- 仅 Y 轴移动，X 轴锁定
- 占位符在原位，其他卡片通过 CSS transition 平滑让位
- 所有 DOM 操作（卡片位置、占位符、边缘滚动）统一在 `requestAnimationFrame` 循环中执行，避免 pointer events 和 rAF 之间的竞争条件
- 仅在 `batchMode` 时通过 `.batch-drag-handle` 手柄触发
- 边缘滚动：靠近滚动容器边缘 60px 内自动滚动，速度与距离成正比