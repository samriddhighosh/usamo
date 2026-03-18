import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { apiFetch } from '../../lib/api/client';

export type ContestFormValues = {
  id?: string;
  title: string;
  description: string;
  level_id: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  visibility: 'public' | 'private';
  rating_enabled: boolean;
};

type ContestFormProps = {
  currentUserId: string;
  onSaved: () => void;
};

export default function ContestForm({ currentUserId, onSaved }: ContestFormProps) {
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([]);
  const [values, setValues] = useState<ContestFormValues>({
    title: '',
    description: '',
    level_id: null,
    start_time: '',
    end_time: '',
    duration_minutes: 300,
    visibility: 'public',
    rating_enabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('levels')
      .select('id,name')
      .order('sort_order', { ascending: true })
      .then(({ data }) => setLevels(data ?? []));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const startIso = new Date(values.start_time).toISOString();
      const endIso = new Date(values.end_time).toISOString();
      await apiFetch('/api/contests', {
        json: {
          ...values,
          start_time: startIso,
          end_time: endIso,
          created_by: currentUserId,
        },
      });
      onSaved();
      setValues({
        title: '',
        description: '',
        level_id: null,
        start_time: '',
        end_time: '',
        duration_minutes: 300,
        visibility: 'public',
        rating_enabled: true,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="ui-input"
        placeholder="Title"
        value={values.title}
        onChange={(event) => setValues({ ...values, title: event.target.value })}
      />
      <textarea
        className="ui-textarea"
        placeholder="Description"
        rows={4}
        value={values.description}
        onChange={(event) => setValues({ ...values, description: event.target.value })}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="ui-input"
          type="datetime-local"
          value={values.start_time}
          onChange={(event) => setValues({ ...values, start_time: event.target.value })}
        />
        <input
          className="ui-input"
          type="datetime-local"
          value={values.end_time}
          onChange={(event) => setValues({ ...values, end_time: event.target.value })}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="ui-input"
          type="number"
          min={30}
          value={values.duration_minutes}
          onChange={(event) =>
            setValues({ ...values, duration_minutes: Number(event.target.value) })
          }
        />
        <select
          className="ui-select"
          value={values.level_id ?? ''}
          onChange={(event) =>
            setValues({ ...values, level_id: event.target.value || null })
          }
        >
          <option value="">No level</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <select
          className="ui-select"
          value={values.visibility}
          onChange={(event) =>
            setValues({ ...values, visibility: event.target.value as 'public' | 'private' })
          }
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <label className="flex items-center gap-2 text-sm ui-text-secondary">
          <input
            type="checkbox"
            checked={values.rating_enabled}
            onChange={(event) =>
              setValues({ ...values, rating_enabled: event.target.checked })
            }
          />
          Rating enabled
        </label>
      </div>
      <button
        className="ui-button ui-button-primary"
        type="submit"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save contest'}
      </button>
    </form>
  );
}
