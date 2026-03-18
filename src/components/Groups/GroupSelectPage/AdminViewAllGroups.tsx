import React, { useState } from 'react';
import { useCurrentUser } from '../../../context/UserDataContext/UserDataContext';
import { supabase } from '../../../lib/supabaseClient';
import { GroupData } from '../../../models/groups/groups';
import { GroupCard } from './GroupCard';

export default function AdminViewAllGroups(): JSX.Element {
  const currentUser = useCurrentUser();
  const [groups, setGroups] = useState<GroupData[] | null>(null);

  React.useEffect(() => {
    if (!currentUser?.uid) {
      setGroups(null);
      return;
    }
    supabase
      .from('groups')
      .select('*')
      .then(({ data }) => {
        setGroups((data ?? []) as GroupData[]);
      });
  }, [currentUser?.uid]);

  return (
    <>
      {!groups ? (
        <div>
          <p className="text-2xl font-medium">Loading...</p>
        </div>
      ) : (
        groups.map(group => <GroupCard key={group.id} group={group} />)
      )}
    </>
  );
}
