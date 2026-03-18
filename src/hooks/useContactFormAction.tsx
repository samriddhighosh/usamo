import { useCallback } from 'react';
import { useCurrentUser } from '../context/UserDataContext/UserDataContext';
import { supabase } from '../lib/supabaseClient';

export default function useContactFormAction() {
  const currentUser = useCurrentUser();

  return useCallback(
    async ({ name, email, moduleName, url, lang, topic, message }) => {
      if (!currentUser) {
        throw new Error('Must be logged in.');
      }
      if (!name) {
        throw new Error('Please enter your name.');
      }
      if (!email) {
        throw new Error('Please enter your email.');
      }
      if (!topic) {
        throw new Error('Please select a topic');
      }
      if (!message) {
        throw new Error('Please enter a message.');
      }
      const { data, error } = await supabase.functions.invoke(
        'submit-contact-form',
        {
          body: {
            name,
            email,
            moduleName,
            url,
            lang,
            topic,
            message,
          },
        }
      );
      if (error) throw error;
      return data;
    },
    [currentUser]
  );
}
