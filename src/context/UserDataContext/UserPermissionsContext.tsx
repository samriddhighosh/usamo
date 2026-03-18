import * as React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useCurrentUser } from './UserDataContext';

// the value is the profile permission field name
export type UserPermissions = 'isAdmin' | 'canModerate' | 'canCreateGroups';

export const UserPermissionInformation: {
  [key in UserPermissions]: { label: string; description: string };
} = {
  isAdmin: {
    label: 'Is Admin',
    description:
      'Admins have permissions to do anything -- add other admins and remove other admins. This is a dangerous permission to grant.',
  },
  canModerate: {
    label: 'Can Moderate',
    description:
      'Users with this permission can delete or mark user solutions as private.',
  },
  canCreateGroups: {
    label: 'Can Create Groups',
    description: 'Users with this permission can create Groups.',
  },
};

const UserPermissionsContext = React.createContext<{
  permissions: { [key in UserPermissions]: boolean };
} | null>(null);

export const UserPermissionsContextProvider = ({ children }) => {
  const defaultPermissions = {
    isAdmin: false,
    canModerate: false,
    canCreateGroups: false,
  };

  const [permissions, setPermissions] =
    React.useState<{ [key in UserPermissions]: boolean }>(defaultPermissions);
  const currentUser = useCurrentUser();

  React.useEffect(() => {
    let alive = true;
    if (currentUser?.uid) {
      supabase
        .from('profiles')
        .select('is_admin, can_moderate, can_create_groups')
        .eq('id', currentUser.uid)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!alive) return;
          if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            setPermissions(defaultPermissions);
            return;
          }
          setPermissions({
            isAdmin: !!data?.is_admin,
            canModerate: !!data?.can_moderate,
            canCreateGroups: !!data?.can_create_groups,
          });
        });
    } else {
      setPermissions(defaultPermissions);
    }
    return () => {
      alive = false;
    };
  }, [currentUser?.uid]);

  const data = React.useMemo(
    () => ({
      permissions,
    }),
    [permissions]
  );

  return (
    <UserPermissionsContext.Provider value={data}>
      {children}
    </UserPermissionsContext.Provider>
  );
};

export function useUserPermissions() {
  const context = React.useContext(UserPermissionsContext);
  if (!context) {
    throw 'useUserPermissions() must be called inside a UserPermissionsContext.';
  }
  return context.permissions;
}
