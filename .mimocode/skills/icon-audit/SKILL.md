---
name: icon-audit
description: 审计 LinkVault 项目中 .vue 文件的图标使用情况：检查 icons.js 定义是否被模板实际引用，发现硬编码 SVG/文本字符绕过 icons.js 的问题，并安全替换。
---

# 图标审计技能

审计 LinkVault 项目中图标定义（icons.js）与模板实际引用之间的一致性。

## 背景

icons.js 集中管理所有 SVG 图标定义。Vue 组件通过 `v-html="I.xxx"` 引用图标。
但存在三类绕过 icons.js 的情况：
1. **硬编码 SVG** — 模板中直接写 `<svg>...</svg>`
2. **文本字符** — 使用 ↩↪ 等字符代替 SVG 图标
3. **定义存在但未引用** — icons.js 有 key 但无模板使用

agent 曾两次仅检查 icons.js 定义就假设图标已生效，导致用户反馈"代码里有，网站里却没有使用上"。

## 三步审计流程（D6 规则）

### Step 1: 审计 icons.js 定义完整性

```bash
# 列出 icons.js 中所有导出的图标 key
node -e "const I = require('./src/icons.js'); console.log(Object.keys(I).join('\n'))"
```

如果 node 无法直接 require ESM，用 grep：
```
Grep pattern: export const I\s*=\s*\{
文件: src/icons.js
```

### Step 2: 审计模板实际引用（关键步骤）

对每个 .vue 文件，检查三种引用方式：

**方式 A — v-html 引用（正确方式）**
```
Grep pattern: v-html="I\.\w+"
Include: *.vue
```
这会找出所有通过 icons.js 引用的图标。提取 icon key 名称。

**方式 B — 硬编码 SVG（需替换）**
```
Grep pattern: <svg[\s>]
Include: *.vue
```
这些是绕过 icons.js 的硬编码 SVG，应替换为 `v-html="I.xxx"`。

**方式 C — 文本字符（需替换）**
```
Grep pattern: [↩↪←→↑↓✓✗✖]
Include: *.vue
```
文本字符应替换为对应 SVG 图标。

### Step 3: 交叉比对

将 Step 1 的定义列表与 Step 2A 的引用列表比对：

| 状态 | 含义 | 操作 |
|------|------|------|
| 定义 ✓ + 引用 ✓ | 正常 | 无需操作 |
| 定义 ✓ + 引用 ✗ | 死定义 | 确认无其他使用后可删除 |
| 定义 ✗ + 引用 ✗ + 硬编码存在 | 缺少定义 | 在 icons.js 中新增 key |
| 定义 ✗ + 引用 ✓ | 不可能 | 引用会报错，检查是否有别名 |

## 替换操作

### 硬编码 SVG → icons.js 引用

1. 在 icons.js 中确认或新增对应的 icon key
2. 在 .vue 模板中，将 `<svg>...</svg>` 替换为 `v-html="I.xxx"`
3. 确保组件 `<script setup>` 中有 `import { I } from '@/icons'`（或 `'../../icons'`）
4. 运行 `npm run build` 验证

### 文本字符 → icons.js 引用

1. 确定字符对应的图标功能（如 ↩ → undo，↪ → redo）
2. 在 icons.js 中确认或新增 key
3. 替换文本为 `v-html="I.xxx"`
4. 运行 `npm run build` 验证

## 验证

替换后必须：
1. `npm run build` 通过
2. `npm run lint` 无新增错误
3. 浏览器中检查页面渲染（图标正确显示、尺寸正确）

## 常见陷阱

- **btn-xs 使用 13x13px，btn-sm 使用 15x15px** — 替换后检查 CSS 尺寸
- **删除所有 emoji 图标** — 项目规范要求统一使用 SVG
- **不能只检查定义就假设已使用** — 这是两次审计失败的根因
- **v-html 绑定的 SVG 会继承父元素的 font-size** — 需要通过 CSS 显式设置 width/height
