import * as React from 'react';
import { JoinGroupLink } from '../../models/groups/groups';
import { supabase } from '../../lib/supabaseClient';

export default function useGroupJoinLinks(groupId: string) {
  const [links, setLinks] = React.useState<JoinGroupLink[] | null>(null);

  React.useEffect(() => {
    setLinks(null);
    if (!groupId) return;

    let alive = true;

    const fetchLinks = async () => {
      const { data, error } = await supabase
        .from('group_join_links')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) {
        return;
      }
      setLinks(
        (data ?? []).map(link => ({
          id: link.id,
          groupId: link.group_id,
          revoked: link.revoked,
          numUses: link.num_uses,
          maxUses: link.max_uses,
          expirationTime: link.expiration_time,
          usedBy: link.used_by ?? [],
          author: link.author,
        }))
      );
    };

    fetchLinks();

    const channel = supabase
      .channel(`group_join_links_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_join_links',
          filter: `group_id=eq.${groupId}`,
        },
        () => fetchLinks()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  return links;
}
