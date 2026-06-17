# 组聚焦卡片右侧工具栏重构设计

## 一、设计目标

将组聚焦后的格式化工具栏（加粗、H1-H3、有序列表、无序列表、待办清单、文字颜色）从卡片内部移到卡片**右侧独立工具栏栏**，并修复点击工具栏按钮导致编辑器光标跳到开头的 bug。

## 二、现有架构

### 当前状态
- 组聚焦后，`.group-card` 内部结构为纵向排列：card-header → card-tags → **格式工具栏** → group-body（编辑器）
- 格式工具栏由 `buildFocusToolbarHTML(gid)` 生成，渲染在 `.group-card-toolbar` 容器内
- 筛选栏（`#focusBack`）内有上下文按钮（返回、书签数、添加、编辑、分享、撤销、重做）
- 事件委托通过 `data-action` 属性处理所有按钮点击

### 已知 Bug
- `mousedown.preventDefault()` 只覆盖 `#focusBack .ft-btn`，未覆盖 `.group-card-toolbar .ft-btn`
- 点击格式按钮时浏览器将焦点转移到按钮，ProseMirror `_mouseDown = false`，`.focus()` 重置光标到位置 0

## 三、设计需求

### 布局结构
```
┌──────────────────────────────────────────────────────┐
│  #focusBack（筛选栏：返回 | 书签数 | 添加 | 编辑 | 分享 | 撤销 | 重做） │
├──────────────────────────────────┬───────────────────┤
│                                  │  ┌─────────────┐  │
│   .group-card（主卡片区域）        │  │  右侧工具栏   │  │
│                                  │  │             │  │
│   ┌────────────────────────────┐ │  │   B  (加粗)  │  │
│   │  card-header (组名、图标)    │ │  │   H1 (大标题) │  │
│   ├────────────────────────────┤ │  │   H2 (中标题) │  │
│   │  card-tags                 │ │  │   H3 (小标题) │  │
│   ├────────────────────────────┤ │  │   ─────────  │  │
│   │                            │ │  │   1. (有序)   │  │
│   │  group-body (编辑器)        │ │  │   • (无序)    │  │
│   │  [contenteditable]         │ │  │   ☑ (待办)   │  │
│   │                            │ │  │   ─────────  │  │
│   │                            │ │  │   A (颜色)   │  │
│   │                            │ │  │  [色板弹出]   │  │
│   └────────────────────────────┘ │  └─────────────┘  │
│                                  │                    │
└──────────────────────────────────┴───────────────────┘
```

### CSS Grid / Flexbox
- 外层容器用 **Flexbox 横向布局**：`.group-card`（flex:1） + 右侧工具栏（固定宽度）
- 右侧工具栏：纵向排列，垂直居中，固定宽度约 44px
- 工具栏按钮：方形/圆形，40×40px，带 tooltip，hover/active 高亮

### 交互行为
- 右侧工具栏按钮使用 `mousedown.prevent`（在 Vue 中）防止编辑器失焦
- 按钮点击后保持编辑器焦点，光标不跳转
- 按钮 active 状态由 `onSelectionUpdate` 回调更新
- 按钮通过 `data-action` 属性与现有事件委托系统集成

### 技术约束
- 右侧工具栏由 `buildFocusToolbarHTML()` 生成（与现有机制兼容）
- 颜色选择器弹出层需正确定位（在工具栏左侧或下方弹出）
- 移动端不显示右侧工具栏（已有浮动格式栏 `_mfbBar`）
- 事件委托中的 `mousedown.preventDefault()` 选择器需覆盖新位置的 `.ft-btn`

### 变更范围
- **render.js**: 修改 `renderGroupCardHTML()`，将工具栏从卡片内部移到卡片右侧
- **group.js**: 更新 `buildFocusToolbarHTML()`，按钮布局改为纵向排列
- **style.css**: 新增 `.group-card-wrapper` flex 布局和 `.focus-toolbar-side` 样式
- **event-delegation.js**: 修复 `mousedown.preventDefault()` 选择器
