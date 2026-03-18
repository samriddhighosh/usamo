import { useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function useProblemSuggestionAction() {
  return useCallback(
    async ({
      name,
      link,
      difficulty,
      tags,
      additionalNotes,
      problemTableLink,
      moduleName,
      section,
      problemListName,
      source,
      filePath,
    }) => {
      if (!source) {
        throw new Error(
          "Please select a source (You can select 'other' if you can't find the correct source)"
        );
      }
      if (!difficulty) {
        throw new Error('Please select a difficulty');
      }
      const { data, error } = await supabase.functions.invoke(
        'submit-problem-suggestion',
        {
          body: {
            name,
            link,
            difficulty,
            tags,
            additionalNotes,
            problemTableLink,
            moduleName,
            section,
            problemListName,
            source,
            filePath,
          },
        }
      );
      if (error) throw error;
      return data;
    },
    []
  );
}
