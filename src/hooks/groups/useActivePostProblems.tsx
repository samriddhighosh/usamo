import * as React from 'react';
import { ReactElement, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useCurrentUser } from '../../context/UserDataContext/UserDataContext';
import { supabase } from '../../lib/supabaseClient';
import { GroupProblemData } from '../../models/groups/problem';
import { useActiveGroup } from './useActiveGroup';
type ActivePostProblemsContext = {
  activePostId?: string;
  setActivePostId: React.Dispatch<React.SetStateAction<string | undefined>>;
  problems: GroupProblemData[];
  isLoading: boolean;
} | null;

const ActivePostProblemsContext =
  React.createContext<ActivePostProblemsContext>(null);

export function ActivePostProblemsProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const activeGroup = useActiveGroup();
  const currentUser = useCurrentUser();
  const [activePostId, setActivePostId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [problems, setProblems] = React.useState<GroupProblemData[]>([]);

  React.useEffect(() => {
    setIsLoading(true);
    setProblems([]);
    if (!activePostId || !currentUser?.uid) {
      return;
    }
    if (!activeGroup.activeGroupId!) {
      throw new Error('Cannot get post problems without being in an active group');
    }

    let alive = true;

    const fetchProblems = async () => {
      const { data, error } = await supabase
        .from('group_problems')
        .select('*')
        .eq('group_id', activeGroup.activeGroupId)
        .eq('post_id', activePostId)
        .eq('is_deleted', false);

      if (!alive) return;
      if (error) {
        toast.error(error.message);
        return;
      }
      setProblems(
        (data ?? []).map(problem => ({
          id: problem.id,
          postId: problem.post_id,
          name: problem.name,
          body: problem.body,
          source: problem.source,
          points: problem.points,
          difficulty: problem.difficulty,
          hints: problem.hints ?? [],
          solution: problem.solution,
          isDeleted: problem.is_deleted,
          guideProblemId: problem.guide_problem_id,
          solutionReleaseMode: problem.solution_release_mode,
          solutionReleaseTimestamp: problem.solution_release_at,
        })) as GroupProblemData[]
      );
      setIsLoading(false);
    };

    fetchProblems();

    const channel = supabase
      .channel(`group_problems_${activeGroup.activeGroupId}_${activePostId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_problems',
          filter: `group_id=eq.${activeGroup.activeGroupId}`,
        },
        () => fetchProblems()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser?.uid, activePostId, activeGroup.activeGroupId!]);

  return (
    <ActivePostProblemsContext.Provider
      value={{
        activePostId,
        setActivePostId,
        problems,
        isLoading,
      }}
    >
      {children}
    </ActivePostProblemsContext.Provider>
  );
}

export function useActivePostProblems() {
  const context = React.useContext(ActivePostProblemsContext);
  if (context === null) {
    throw 'useActiveGroup must be used within a ActivePostProblemsProvider';
  }
  return context;
}
