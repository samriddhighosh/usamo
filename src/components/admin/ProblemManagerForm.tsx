import React, { useState } from 'react';
import LaTeXEditor from '../contest/LaTeXEditor';
import { apiFetch } from '../../lib/api/client';

export default function ProblemManagerForm() {
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState(1200);
  const [points, setPoints] = useState(7);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/problems', {
        json: {
          title,
          statement_latex: statement,
          solution_latex: solution,
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          difficulty,
          point_value: points,
        },
      });
      setTitle('');
      setStatement('');
      setSolution('');
      setTags('');
      setDifficulty(1200);
      setPoints(7);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="ui-input"
        placeholder="Problem title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <LaTeXEditor
        label="Statement"
        value={statement}
        onChange={setStatement}
        placeholder="Write the problem statement in LaTeX/Markdown"
      />
      <LaTeXEditor
        label="Solution (internal)"
        value={solution}
        onChange={setSolution}
        placeholder="Write the official solution in LaTeX/Markdown"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="ui-input"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
        <input
          className="ui-input"
          type="number"
          value={difficulty}
          onChange={(event) => setDifficulty(Number(event.target.value))}
        />
      </div>
      <input
        className="ui-input"
        type="number"
        value={points}
        onChange={(event) => setPoints(Number(event.target.value))}
      />
      <button
        className="ui-button ui-button-primary"
        type="submit"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save problem'}
      </button>
    </form>
  );
}
