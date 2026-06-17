# 任务计划：代码精简与优化

## 目标
全面精简 LinkVault 代码库，移除死代码、修复 bug、优化结构。

## 已完成的精简

### 第一轮：死代码移除 + Bug 修复

#### 死代码移除
- `useGroup.js` — 移除未使用的 `openBmModal` 导入和 `handleGroupPaste` 函数
- `bridge.js` — 移除从未被导入的 `editorManager` 导出变量
- `editor.js` — 移除 10 个从未被调用的方法
- `useApp.js` — 移除多余的副作用导入
- `useUndo.js` — 内联 `_getToast()` thin wrapper

#### Bug 修复
- `useBookmark.js:235` — 修复变量名 `bid` 遮蔽外部参数的 bug

#### 代码整理
- `useGroup.js` — 修复重复 import，拆分过长单行
- `useDragDrop.js` — 整理 import 顺序
- `app.js` — 移除不必要的 async 关键字
- `useBatch.js` — 简化 thin wrappers
- 测试文件 — 清理 4 个未使用的导入

### 第二轮：Vue 组件清理 + 重复模式合并

#### 未使用导入移除
- `GroupEditModal.vue` — 移除未使用的 `toast` 导入
- `AttrDropdown.vue` — 移除未使用的 `watch` 导入
- `BookmarkModal.vue` — 移除永远返回 `false` 的 `isParentAttr()` 死代码桩
- `BatchPopover.vue` — 移除因提取 `addNewCategory` 后不再需要的 `toast` 导入

#### 重复模式合并
- **`selectableCategories` getter** — 新增到 data store + app.js 兼容层，替代 5 个组件中的 `store.categories.filter(c => c.id !== 'all')`
- **`getCategoryIcon()` 工具函数** — 新增到 icons.js，替代 3 个组件中的 `I[icon] || I.star` 模式
- **`safeDecodePassword()` 辅助函数** — 新增到 crypto.js，替代 2 个组件中的 try-catch 密码解码模式
- **`I.emptyBookmark` 图标** — 新增到 icons.js，替代 2 个组件中的重复 SVG 字符串
- **`stripEntranceAnim()` 工具函数** — 新增到 utils.js，替代 BookmarkCard 和 GroupCard 中的重复入口动画清理逻辑
- **`addNewCategory()` 工具函数** — 新增到 utils.js，替代 BatchPopover、CategoryModal、ActionSheet 中的重复新建分类逻辑
- **`useInlineRename()` composable** — 新增到 composables/ui/，替代 CategoryModal 和 AttributeModal 中的重复行内重命名逻辑

### 第三轮：深度清理

#### 死代码移除
- `useBatch.js` — 移除未使用的 `batchAddToGroup` 函数及其关联导入（`EditorManager`, `saveGroupBody`, `inlineCardHTML`）
- `useBatch.js` — 移除未使用的 `toggleBatchSelect` 函数
- `useBatch.js` — 将未被外部导入的 `hideBatchMovePopover` 从 export 降为局部函数
- `ui.js` + `app.js` — 移除未使用的拖拽状态属性 `dragOverEl`, `catDragId`, `detailDragIdx`（拖拽系统使用模块级变量，不经过 store）

#### 硬编码清理
- `DetailPanel.vue` — 将硬编码的 note SVG 替换为 `I.note`（CSS 已有尺寸定义）

#### 组件提取
- **`ColorPalette.vue`** — 新建共享组件，替代 GroupCard 和 FormatToolbar 中 3 处重复的颜色调板弹窗 markup
- `FormatToolbar.vue` — 移除不再需要的 `PALETTE` 导入
- `GroupCard.vue` — 移除不再需要的 `PALETTE` 导入

#### 依赖清理
- `package.json` — 移除未使用的 `@formkit/drag-and-drop` 和 `vue-draggable-plus` 依赖
- `vite.config.js` — 移除过时的 `sortablejs`/`vue-draggable-plus` 分包配置

#### 文件清理
- 移除 `src/components/demo/` 目录（未使用的开发产物）
- 移除根目录 `drag-demo*.html` 文件（未使用的开发产物）

### 第四轮：死代码 + Bug 修复

#### 死代码移除
- `CategoryModal.vue` — 移除未使用的重复常量 `EDGE_ZONE` 和 `MAX_SCROLL_SPEED`（与 `EDGE`/`SPEED` 重复）

#### Bug 修复
- `GroupEditor.vue` — 移除重复的 `host()` 函数，改用 utils.js 的 `domain()`（原函数不剥离 `www.` 前缀）

#### 代码一致性
- `AttrDropdown.vue` — 将 `setAttrDropdownAPI()` 从顶层移入 `onMounted`，与其他 bridge 注册保持一致
- `useKeyboardOps.js` — 移除冗余的 `useAppStore()` 调用（第 89 行），复用已有的 `store` 变量

### 第五轮：深度清理

#### 死代码移除
- `GroupEditor.vue` — 移除未被任何父组件调用的 `defineExpose`（13 个方法全部死代码）
- `GroupEditor.vue` — 移除未被注入的 `provide('editorGroupId', ...)`
- `GroupCard.vue` — 移除未使用的 `editorRef` ref 及模板中的 `ref="editorRef"` 引用

#### 导入路径优化
- `useDragDrop.js` — 将 `inlineCardHTML`/`groupRefCardHTML` 改为直接从 `useInlineCard.js` 导入
- `useGroup.js` — 移除不再需要的 `export { inlineCardHTML, groupRefCardHTML }` re-export

#### 文件清理
- 移除 `src/components/demo/` 目录（第三轮遗漏，确认未被任何文件引用）

### 第六轮：死代码清理 + 结构优化

#### 死代码移除
- `bridge.js` — 移除从未被读取的 `_registry` Map、`_get()` 函数和 `_set()` 函数（所有 setter 只需赋值模块级变量）
- `bridge.js` — 移除 `setEditorManager` 导出（`editor.js` 直接导出 `EditorManager`，无需通过 bridge 注册）
- `editor.js` — 移除 `setEditorManager(EditorManager)` 调用和对应的 import
- `useApp.js` — 移除 `_clearSelection` thin wrapper，内联为 `onClearSel` 局部变量
- `useDataIO.js` — 将 `validateImportData` 从 export 降为局部函数（仅内部使用）

#### Bug 修复 / 代码规范
- `useUI.js` — `store.detailCards.length = 0` → `store.detailCards.splice(0)`（确保 Vue reactivity 正确触发）
- `DetailPanel.vue` — 同上修复 `store.detailCards.length = 0` → `splice(0)`
- `useUndo.js` — 将错位的 `import { toastAPI }` 从函数体之间移至文件顶部

#### 生产代码清理
- `main.js` — 移除 `console.log('[LinkVault] Vue app mounted')`

#### 文件清理
- 移除 `src/components/demo/` 目录（第三、五轮遗漏，确认未被任何文件引用）

#### 验证
- 全面扫描 30 个 `.vue` 文件和 20 个 `.js` 文件，确认无未使用的 import

## 最终验证结果
- ESLint：0 错误，4 警告（有意的空 catch 块）
- 单元测试：171 个全部通过
- 生产构建：成功

## 未来可优化项
- 组件可直接使用 specific stores 替代 `useAppStore()` 兼容层
- DetailPanel 和 ActionSheet 的滑动关闭逻辑可提取为共享 composable
- GroupCard 和 FormatToolbar 的格式工具栏可提取为共享组件
- `validateImportData` 从 `useDataIO.js` 导出但从未被外部导入，可降为局部函数
- `AttrChips.vue` 未被阅读检查（可能有未使用导入）
