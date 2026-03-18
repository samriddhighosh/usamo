import React from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAnalyticsEffect = () => {
  React.useEffect(() => {
    const incrementCounter = async (key: string) => {
      await supabase.rpc('increment_analytics_counter', { p_key: key });
    };

    if ((window as any).ga && (window as any).ga.create) {
      // google analytics loaded
    } else {
      // google analytics got blocked
      void incrementCounter('no_ga_pageviews');
    }
    void incrementCounter('pageviews');
  }, []);
};
