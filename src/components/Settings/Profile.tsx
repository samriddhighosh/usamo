import React from 'react';
import toast from 'react-hot-toast';
import { useCurrentUser } from '../../context/UserDataContext/UserDataContext';
import { supabase } from '../../lib/supabaseClient';

export default function Profile(): JSX.Element {
  const currentUser = useCurrentUser();

  const [name, setName] = React.useState(currentUser?.displayName);

  React.useEffect(() => {
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    } else {
      setName(null);
    }
  }, [currentUser?.displayName]);

  const handleSubmit = e => {
    if (!currentUser) throw new Error('User not logged in');
    e.preventDefault();
    supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('id', currentUser.uid)
      .then(({ error }) => {
        if (error) {
          throw error;
        }
        return supabase.auth.updateUser({
          data: { full_name: name },
        });
      })
      .then(() => toast.success('Username updated'))
      .catch(err => {
        toast.error(err.message ?? 'Failed to update profile');
      });
  };

  return (
    <div>
      <div className="space-y-1">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
          Profile
        </h3>
      </div>
      <div className="h-4" />
      {currentUser ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Display Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="display_name"
                id="display_name"
                className="input"
                value={name ?? undefined}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex">
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      ) : (
        <p>You need to be logged in to update your profile.</p>
      )}
    </div>
  );
}
