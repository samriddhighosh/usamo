import React, { useState } from 'react';
import { apiFetch } from '../../lib/api/client';

export type GradePartInput = {
  partId: string | null;
  score: number;
  maxScore: number;
  feedback?: string;
};

type GradeTableProps = {
  submissionId: string;
  parts: Array<{ id: string | null; label: string; maxScore: number }>;
};

export default function GradeTable({ submissionId, parts }: GradeTableProps) {
  const [entries, setEntries] = useState<GradePartInput[]>(
    parts.map((part) => ({
      partId: part.id,
      score: 0,
      maxScore: part.maxScore,
      feedback: '',
    }))
  );
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch('/api/grading', {
        json: {
          submissionId,
          feedback,
          parts: entries,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  function updateEntry(index: number, patch: Partial<GradePartInput>) {
    setEntries((current) =>
      current.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry))
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-4">
            <input
              className="ui-input"
              type="number"
              value={entry.score}
              min={0}
              max={entry.maxScore}
              onChange={(event) => updateEntry(index, { score: Number(event.target.value) })}
            />
            <input
              className="ui-input"
              type="number"
              value={entry.maxScore}
              min={1}
              onChange={(event) => updateEntry(index, { maxScore: Number(event.target.value) })}
            />
            <input
              className="ui-input md:col-span-2"
              placeholder="Feedback"
              value={entry.feedback ?? ''}
              onChange={(event) => updateEntry(index, { feedback: event.target.value })}
            />
          </div>
        ))}
      </div>
      <textarea
        className="ui-textarea"
        placeholder="Overall feedback"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
      />
      <button
        className="ui-button ui-button-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save grade'}
      </button>
    </div>
  );
}
