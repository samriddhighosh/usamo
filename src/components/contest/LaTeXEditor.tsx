import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css';

type LaTeXEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export default function LaTeXEditor({
  value,
  onChange,
  label,
  placeholder,
}: LaTeXEditorProps) {
  const content = useMemo(() => value ?? '', [value]);
  const [previewMode, setPreviewMode] = useState<'latex' | 'markdown'>('latex');
  const [latexHtml, setLatexHtml] = useState<string>('');
  const [latexError, setLatexError] = useState<string>('');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const links = [
      '/latexjs/fonts/cmu.css',
      '/latexjs/css/base.css',
      '/latexjs/css/article.css',
      '/latexjs/css/katex.css',
    ];

    links.forEach((href) => {
      const id = `latexjs-${href.replace(/[^a-z0-9]/gi, '-')}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    if (previewMode !== 'latex') return;
    let cancelled = false;
    setLatexError('');

    const renderLatex = async () => {
      try {
        const latexjs = await import('latex.js');
        const lib = (latexjs as unknown as { default?: any })?.default ?? latexjs;
        const HtmlGenerator = lib.HtmlGenerator ?? (latexjs as any).HtmlGenerator;
        const parse = lib.parse ?? (latexjs as any).parse;

        if (!HtmlGenerator || !parse) {
          throw new Error('latex.js not available');
        }

        const generator = new HtmlGenerator({ hyphenate: false });
        const doc = parse(content, { generator });
        const fragment = doc.domFragment();
        const container = document.createElement('div');
        container.appendChild(fragment);

        if (!cancelled) {
          setLatexHtml(container.innerHTML);
        }
      } catch (error) {
        if (!cancelled) {
          setLatexError('LaTeX preview failed.');
          setLatexHtml('');
        }
      }
    };

    if (typeof window !== 'undefined') {
      renderLatex();
    }

    return () => {
      cancelled = true;
    };
  }, [content, previewMode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {label ? <div className="text-sm font-semibold">{label}</div> : <div />}
        <select
          className="ui-select max-w-[160px] text-sm"
          value={previewMode}
          onChange={(event) => setPreviewMode(event.target.value as 'latex' | 'markdown')}
        >
          <option value="latex">LaTeX Preview</option>
          <option value="markdown">Markdown Preview</option>
        </select>
      </div>
      <textarea
        className="ui-textarea font-mono text-sm"
        rows={10}
        value={content}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="ui-surface p-4">
        {previewMode === 'latex' ? (
          latexError ? (
            <div className="text-sm text-red-600">{latexError}</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: latexHtml }} />
          )
        ) : (
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
