import * as React from 'react';
import toast from 'react-hot-toast';
import { useCurrentUser } from '../context/UserDataContext/UserDataContext';
import { supabase } from '../lib/supabaseClient';
import { ProblemInfo, ShortProblemInfo } from '../models/problem';
import { UserSolutionForProblem } from '../models/userSolutionForProblem';

export default function useUserSolutionsForProblem(
  problem: ProblemInfo | ShortProblemInfo
) {
  const [solutions, setSolutions] = React.useState<
    UserSolutionForProblem[] | null
  >(null);
  const [currentUserSolutions, setCurrentUserSolutions] = React.useState<
    UserSolutionForProblem[] | null
  >(null);
  const currentUser = useCurrentUser();

  React.useEffect(() => {
    const id = problem?.uniqueId;
    if (!id) return;
    let alive = true;
    setSolutions(null);
    setCurrentUserSolutions(null);

    const mapRow = (row: any): UserSolutionForProblem => ({
      id: row.id,
      userID: row.user_id,
      userName: row.user_name,
      problemID: row.problem_id,
      isPublic: row.is_public,
      solutionCode: row.solution_code,
      upvotes: row.upvotes ?? [],
      language: row.language,
      timestamp: row.created_at,
    });

    const fetchAll = async () => {
      const { data: publicSolutions, error: publicError } = await supabase
        .from('user_problem_solutions')
        .select('*')
        .eq('problem_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (!alive) return;
      if (publicError) {
        toast.error(publicError.message);
      } else {
        setSolutions((publicSolutions ?? []).map(mapRow));
      }

      if (currentUser?.uid) {
        const { data: userSolutions, error: userError } = await supabase
          .from('user_problem_solutions')
          .select('*')
          .eq('problem_id', id)
          .eq('user_id', currentUser.uid)
          .order('created_at', { ascending: false });
        if (!alive) return;
        if (userError) {
          toast.error(userError.message);
        } else {
          setCurrentUserSolutions((userSolutions ?? []).map(mapRow));
        }
      }
    };

    fetchAll();

    const channel = supabase
      .channel(`user_problem_solutions_${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_problem_solutions' },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [problem?.uniqueId, currentUser?.uid]);

  return {
    solutions,
    currentUserSolutions,
  };
}
