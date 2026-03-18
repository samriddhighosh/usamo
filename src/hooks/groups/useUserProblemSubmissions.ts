import * as React from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { GroupSubmission } from '../../models/groups/problem';
import { useActiveGroup } from './useActiveGroup';

export default function useUserProblemSubmissions(
  postId: string,
  problemId: string
) {
  const [submissions, setSubmissions] = React.useState<
    GroupSubmission[] | null
  >(null);
  const activeGroup = useActiveGroup();

  React.useEffect(() => {
    if (!problemId || !activeGroup.activeUserId || !activeGroup.activeGroupId) {
      return;
    }

    let alive = true;

    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('group_problem_submissions')
        .select('*')
        .eq('group_id', activeGroup.activeGroupId)
        .eq('post_id', postId)
        .eq('problem_id', problemId)
        .eq('user_id', activeGroup.activeUserId)
        .order('timestamp', { ascending: false });

      if (!alive) return;
      if (error) {
        toast.error(error.message);
        return;
      }

      setSubmissions(
        (data ?? []).map(row => ({
          id: row.id,
          language: row.language,
          problemID: row.problem_id,
          score: row.score,
          submissionID: row.submission_id,
          userID: row.user_id,
          type: row.type,
          verdict: row.verdict,
          timestamp: row.timestamp,
          link: row.link,
        }))
      );
    };

    fetchSubmissions();

    const channel = supabase
      .channel(
        `group_problem_submissions_${activeGroup.activeGroupId}_${postId}_${problemId}_${activeGroup.activeUserId}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_problem_submissions',
          filter: `group_id=eq.${activeGroup.activeGroupId}`,
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [activeGroup.activeUserId, postId, problemId, activeGroup?.activeGroupId]);

  return submissions;
}
