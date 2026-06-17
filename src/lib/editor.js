/**
 * editor.js — EditorManager 工具层
 * Phase 5: TipTap 编辑器创建已移至 GroupEditor.vue。
 * 此文件仅保留 EditorManager 工具函数（格式化命令、内容操作），
 * 通过 _editors 注册表访问由 GroupEditor.vue 创建的编辑器实例。
 */

// ---------- Editor Registry ----------
// GroupEditor.vue 在 onMounted 时注册编辑器实例到此注册表
const _editors = {};

const EditorManager = {
  register: function (gid, editor) { _editors[gid] = editor; },
  unregister: function (gid) { delete _editors[gid]; },
  get: function (gid) { return _editors[gid] || null; },
  getContentHTML: function (gid) { const ed = _editors[gid]; if (!ed) return null; try { return ed.getHTML(); } catch (_) { return null; } },
  insertInlineCardHTML: function (gid, html) { const ed = _editors[gid]; if (!ed) return false; try { ed.chain().insertContent(html).run(); return true; } catch (_) { return false; } },

  toggleBold: function (gid) { const ed = _editors[gid]; if (ed) ed.commands.toggleBold(); },
  setHeading: function (gid, level) { const ed = _editors[gid]; if (ed) ed.commands.toggleHeading({ level }); },

  deleteNode: function (gid, attrName, attrValue) {
    const ed = _editors[gid]; if (!ed) return;
    const toRemove = [];
    ed.state.doc.descendants(function (node, pos) {
      if (node.attrs && node.attrs[attrName] === attrValue) toRemove.push(pos);
    });
    toRemove.reverse().forEach(function (p) {
      try { ed.chain().deleteRange({ from: p, to: p + 1 }).run(); } catch (e) { console.warn('[Editor] deleteRange error:', e.message) }
    });
  },

  insertAtCoords: function (gid, html, clientX, clientY) {
    const ed = _editors[gid]; if (!ed) return false;
    try {
      const coords = ed.view.posAtCoords({ left: clientX, top: clientY });
      if (coords) {
        const $pos = ed.state.doc.resolve(coords.pos);
        let insertPos = coords.pos;
        if ($pos.depth > 0 && $pos.parentOffset === $pos.parent.content.size) {
          insertPos = Math.max(insertPos - 1, $pos.before(1));
        }
        ed.chain().insertContentAt(insertPos, html).run();
        return true;
      }
    } catch (e) { console.warn('[Editor] insertAtCoords fallback:', e.message) }
    return this.insertInlineCardHTML(gid, html);
  },
  insertText: function (gid, text) { const ed = _editors[gid]; if (!ed) return false; try { ed.chain().insertContent(text).run(); return true; } catch (_) { return false; } },
};

export { EditorManager };
