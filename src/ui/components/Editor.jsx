// Éditeur de code C : coloration, numéros de ligne, indentation automatique, annuler/rétablir,
// barre de touches pour mobile ({ } ; ( ) " etc.) et taille de police réglable.
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, Decoration } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo, indentWithTab, selectAll } from '@codemirror/commands';
import { indentOnInput, bracketMatching, syntaxHighlighting, HighlightStyle, indentUnit } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { cpp } from '@codemirror/lang-cpp';
import { tags } from '@lezer/highlight';
import { StateEffect, StateField } from '@codemirror/state';

const style = HighlightStyle.define([
  { tag: tags.keyword, color: '#c792ea', fontWeight: '600' },
  { tag: [tags.typeName, tags.standard(tags.typeName)], color: '#7dd3fc' },
  { tag: tags.string, color: '#a5e844' },
  { tag: tags.number, color: '#f78c6c' },
  { tag: tags.comment, color: '#6b7a99', fontStyle: 'italic' },
  { tag: [tags.processingInstruction, tags.meta], color: '#ff79c6' },
  { tag: tags.function(tags.variableName), color: '#82aaff' },
  { tag: tags.escape, color: '#ffcb6b' },
  { tag: tags.operator, color: '#89ddff' },
  { tag: tags.bool, color: '#f78c6c' },
]);

const theme = EditorView.theme({
  '&': { backgroundColor: '#050817', color: '#dbe4ff' },
  '.cm-content': { caretColor: '#22d3ee', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: '#060a1c', color: '#4c5786', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'rgba(34,211,238,0.06)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(34,211,238,0.1)', color: '#9fb3ff' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#22d3ee', borderLeftWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(129,140,248,0.35) !important' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(34,211,238,0.25)', outline: '1px solid rgba(34,211,238,.5)' },
  '.cm-errline': { backgroundColor: 'rgba(248,113,113,0.16)' },
  '.cm-warnline': { backgroundColor: 'rgba(251,191,36,0.10)' },
  '.cm-hlline': { backgroundColor: 'rgba(34,211,238,0.16)' },
}, { dark: true });

const setMarks = StateEffect.define();
const marksField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    // les marques d'erreur deviennent périmées dès que le code change (et une décoration de ligne
    // déplacée hors d'un début de ligne bloque le rendu) : on les efface
    if (tr.docChanged) deco = Decoration.none;
    for (const e of tr.effects) {
      if (e.is(setMarks)) {
        const doc = tr.state.doc;
        const ranges = [];
        for (const m of e.value) {
          if (m.line >= 1 && m.line <= doc.lines) ranges.push({ from: doc.line(m.line).from, cls: m.cls });
        }
        ranges.sort((a, b) => a.from - b.from);
        deco = Decoration.set(ranges.map((r) => Decoration.line({ class: r.cls }).range(r.from)));
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const KEYS = ['{', '}', '(', ')', ';', '"', "'", '[', ']', '<', '>', '=', '&', '*', '%', '\\n', '+', '-', '/', '!', '|', ',', '#', '_', 'Tab'];

/** Éditeur non contrôlé : `value` n'est que la valeur initiale ; utiliser editorRef.current.setValue() ensuite. */
export function Editor({ value, onChange, fontSize = 15, marks = [], readOnly = false, label = 'Éditeur de code C', onRun, editorRef }) {
  const host = useRef(null);
  const view = useRef(null);
  const fontComp = useRef(new Compartment());
  const roComp = useRef(new Compartment());
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const lastDoc = useRef(value ?? '');
  const runRef = useRef(onRun);
  runRef.current = onRun;

  useEffect(() => {
    const state = EditorState.create({
      doc: value ?? '',
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        drawSelection(),
        indentOnInput(),
        indentUnit.of('    '),
        bracketMatching(),
        closeBrackets(),
        cpp(),
        syntaxHighlighting(style),
        theme,
        marksField,
        EditorView.lineWrapping,
        keymap.of([
          { key: 'Mod-Enter', run: () => { runRef.current?.(); return true; } },
          ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab,
        ]),
        fontComp.current.of(EditorView.theme({ '&': { fontSize: fontSize + 'px' } })),
        roComp.current.of(EditorState.readOnly.of(readOnly)),
        EditorView.contentAttributes.of({ 'aria-label': label, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
        EditorView.updateListener.of((u) => {
          if (!u.docChanged) return;
          lastDoc.current = u.state.doc.toString();
          changeRef.current?.(lastDoc.current);
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    if (editorRef) editorRef.current = api;
    return () => view.current.destroy();
  }, []);

  useEffect(() => { view.current?.dispatch({ effects: fontComp.current.reconfigure(EditorView.theme({ '&': { fontSize: fontSize + 'px' } })) }); }, [fontSize]);
  useEffect(() => { view.current?.dispatch({ effects: roComp.current.reconfigure(EditorState.readOnly.of(readOnly)) }); }, [readOnly]);
  useEffect(() => { view.current?.dispatch({ effects: setMarks.of(marks) }); }, [JSON.stringify(marks)]);

  const api = {
    setValue(text) {
      const v = view.current;
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } });
    },
    undo: () => undo(view.current),
    redo: () => redo(view.current),
    focus: () => view.current.focus(),
    insert(text) {
      const v = view.current;
      const sel = v.state.selection.main;
      v.dispatch({ changes: { from: sel.from, to: sel.to, insert: text }, selection: { anchor: sel.from + text.length } });
      v.focus();
    },
    async copy() {
      const v = view.current;
      const sel = v.state.selection.main;
      const text = sel.empty ? v.state.doc.toString() : v.state.sliceDoc(sel.from, sel.to);
      try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
    },
    async paste() {
      try { const text = await navigator.clipboard.readText(); api.insert(text); return true; } catch { return false; }
    },
    selectAll: () => selectAll(view.current),
    gotoLine(n) {
      const v = view.current;
      if (n < 1 || n > v.state.doc.lines) return;
      const line = v.state.doc.line(n);
      v.dispatch({ selection: { anchor: line.from }, scrollIntoView: true });
      v.focus();
    },
  };
  if (editorRef) editorRef.current = api;

  return (
    <div class="editor-wrap">
      <div ref={host} />
      {!readOnly && (
        <div class="keybar" role="toolbar" aria-label="Symboles du C">
          {KEYS.map((k) => (
            <button type="button" key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => api.insert(k === 'Tab' ? '    ' : k)} aria-label={`Insérer ${k}`}>{k}</button>
          ))}
        </div>
      )}
    </div>
  );
}
