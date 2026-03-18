import * as React from 'react';
import { ReactElement, ReactNode } from 'react';
import { useCurrentUser } from '../../context/UserDataContext/UserDataContext';
import { supabase } from '../../lib/supabaseClient';
import { GroupData } from '../../models/groups/groups';

const UserGroupsContext = React.createContext<{
  isLoading: boolean;
  isSuccess: boolean;
  data: null | (GroupData | null)[];
  /**
   * Call when you want to re-fetch groups
   */
  invalidateData: () => void;
} | null>(null);

const UserGroupsProvider = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => {
  const currentUser = useCurrentUser();
  const [isLoading, setIsLoading] = React.useState(!!currentUser?.uid);
  const [groups, setGroups] = React.useState<null | (GroupData | null)[]>(null);
  const [updateCtr, setUpdateCtr] = React.useState(0);

  React.useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      setGroups(null);
      return;
    }

    let alive = true;
    setIsLoading(true);

    const fetchGroups = async () => {
      const [owners, admins, members] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .contains('owner_ids', [currentUser.uid]),
        supabase
          .from('groups')
          .select('*')
          .contains('admin_ids', [currentUser.uid]),
        supabase
          .from('groups')
          .select('*')
          .contains('member_ids', [currentUser.uid]),
      ]);

      if (!alive) return;

      const allGroups = [
        ...(owners.data ?? []),
        ...(admins.data ?? []),
        ...(members.data ?? []),
      ].map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        ownerIds: group.owner_ids ?? [],
        adminIds: group.admin_ids ?? [],
        memberIds: group.member_ids ?? [],
        postOrdering: group.post_ordering ?? [],
      })) as GroupData[];

      setGroups(allGroups);
      setIsLoading(false);
    };

    fetchGroups();

    return () => {
      alive = false;
    };
  }, [currentUser?.uid, updateCtr]);

  return (
    <UserGroupsContext.Provider
      value={{
        isLoading,
        isSuccess: groups !== null,
        data: groups,
        invalidateData: () => {
          setIsLoading(true);
          setUpdateCtr(updateCtr + 1);
        },
      }}
    >
      {children}
    </UserGroupsContext.Provider>
  );
};

const useUserGroups = () => {
  const userGroups = React.useContext(UserGroupsContext);
  if (userGroups === null) {
    throw 'useUserGroups must be used within a UserGroupsProvider';
  }
  return userGroups;
};

export { UserGroupsProvider, useUserGroups };
