import React from 'react';
import { supabase } from '../../lib/supabaseClient';

export type LeaderboardEntry = {
  totalPoints: number;
  userInfo: {
    displayName: string;
    photoURL: string;
    uid: string;
  };
  details: {
    [postId: string]: {
      [problemId: string]: {
        bestScore: number;
        bestScoreStatus: string;
        bestScoreSubmissionId: string;
        bestScoreTimestamp: string;
      };
    };
  };
} & {
  [postId: string]: {
    [problemId: string]: number;
    totalPoints: number;
  };
};

export default function useLeaderboardData({
  groupId,
  postId = undefined,
  maxResults = 10,
}: {
  groupId: string;
  postId?: string;
  maxResults?: number;
}): LeaderboardEntry[] | null {
  const [data, setData] = React.useState<LeaderboardEntry[] | null>(null);
  React.useEffect(() => {
    if (!groupId) {
      setData(null);
      return;
    }
    let alive = true;
    const fetchLeaderboard = async () => {
      const { data: rows, error } = await supabase
        .from('group_leaderboard')
        .select('*')
        .eq('group_id', groupId)
        .order('total_points', { ascending: false })
        .limit(maxResults);
      if (!alive) return;
      if (error) {
        setData(null);
        return;
      }
      const mapped = (rows ?? []).map(row => ({
        totalPoints: row.total_points,
        userInfo: row.user_info,
        details: row.details ?? {},
        ...(row.post_scores ?? {}),
      })) as LeaderboardEntry[];
      if (postId) {
        mapped.sort(
          (a, b) => (b[postId]?.totalPoints ?? 0) - (a[postId]?.totalPoints ?? 0)
        );
      }
      setData(mapped);
    };

    fetchLeaderboard();
    return () => {
      alive = false;
    };
  }, [groupId, postId, maxResults]);

  return data;
}

export function useUserLeaderboardData(
  groupId: string,
  userId: string
): LeaderboardEntry | null {
  const [data, setData] = React.useState<LeaderboardEntry | null>(null);
  React.useEffect(() => {
    if (!groupId || !userId) {
      setData(null);
      return;
    }
    let alive = true;
    supabase
      .from('group_leaderboard')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error || !data) {
          setData(null);
          return;
        }
        setData({
          totalPoints: data.total_points,
          userInfo: data.user_info,
          details: data.details ?? {},
          ...(data.post_scores ?? {}),
        } as LeaderboardEntry);
      });
    return () => {
      alive = false;
    };
  }, [groupId, userId]);

  return data;
}
