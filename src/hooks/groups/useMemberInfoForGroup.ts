import React from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { GroupData } from '../../models/groups/groups';

export type MemberInfo = {
  displayName: string;
  uid: string;
  photoURL: string;
};

let cachedData: {
  groupId: string;
  data: MemberInfo[];
} | null = null;

export default function useMemberInfoForGroup(group: GroupData) {
  const [memberInfo, setMemberInfo] = React.useState<MemberInfo[] | null>(null);

  React.useEffect(() => {
    setMemberInfo(null);
    if (!group) return;

    if (cachedData?.groupId === group.id) {
      setMemberInfo(cachedData.data);
    }
    // second condition is checking if a new member has joined the group,
    // or if a member has left the group.
    // if so, we should re-fetch member information.
    if (
      cachedData?.groupId !== group.id ||
      group.memberIds.some(id => !cachedData?.data.find(x => x.uid === id)) ||
      cachedData.data.some(x => !group.memberIds.includes(x.uid))
    ) {
      supabase.functions
        .invoke('groups-get-members', {
          body: { groupId: group.id },
        })
        .then(({ data, error }) => {
          if (error) throw error;
          if (data?.length > 0) {
            data.sort((a, b) =>
              (a.displayName ?? '').localeCompare(b.displayName ?? '')
            );
            setMemberInfo(data);
            cachedData = {
              groupId: group.id,
              data,
            };
          } else {
            toast.error('Error: Failed to fetch member info for leaderboard');
          }
        })
        .catch(e => {
          toast.error(e.message);
        });
    }
  }, [group?.id, group?.memberIds]);

  return memberInfo;
}
