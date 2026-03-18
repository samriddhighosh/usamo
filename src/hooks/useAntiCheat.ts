import { useEffect } from 'react';
import { apiFetch } from '../lib/api/client';

export default function useAntiCheat(contestId: string | null) {
  useEffect(() => {
    if (!contestId) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        apiFetch('/api/anti-cheat-log', {
          json: { contestId, eventType: 'tab_switch', payload: { state: 'hidden' } },
        }).catch(() => null);
      }
    };

    const onCopy = (event: ClipboardEvent) => {
      apiFetch('/api/anti-cheat-log', {
        json: { contestId, eventType: 'copy', payload: { length: event.clipboardData?.getData('text/plain')?.length ?? 0 } },
      }).catch(() => null);
    };

    const onPaste = (event: ClipboardEvent) => {
      apiFetch('/api/anti-cheat-log', {
        json: { contestId, eventType: 'paste', payload: { length: event.clipboardData?.getData('text/plain')?.length ?? 0 } },
      }).catch(() => null);
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
    };
  }, [contestId]);
}
