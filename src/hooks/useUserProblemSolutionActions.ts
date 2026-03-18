import { useCurrentUser } from '../context/UserDataContext/UserDataContext';
import { supabase } from '../lib/supabaseClient';
import { UserSolutionForProblem } from '../models/userSolutionForProblem';

export default function useUserProblemSolutionActions() {
  const currentUser = useCurrentUser();

  return {
    submitSolution: async (
      solution: Omit<
        UserSolutionForProblem,
        'userID' | 'userName' | 'id' | 'upvotes' | 'timestamp'
      >
    ) => {
      await supabase.from('user_problem_solutions').insert({
        problem_id: solution.problemID,
        is_public: solution.isPublic,
        solution_code: solution.solutionCode,
        language: solution.language,
        user_id: currentUser?.uid,
        user_name: currentUser?.displayName ?? '',
        upvotes: [],
        created_at: new Date().toISOString(),
      });
    },
    deleteSolution: async (solutionID: string) => {
      await supabase
        .from('user_problem_solutions')
        .delete()
        .eq('id', solutionID);
    },
    mutateSolution: async (
      solutionID: string,
      updates: Partial<UserSolutionForProblem>
    ) => {
      await supabase
        .from('user_problem_solutions')
        .update({
          is_public: updates.isPublic,
          solution_code: updates.solutionCode,
          language: updates.language,
        })
        .eq('id', solutionID);
    },
    upvoteSolution: async (solutionID: string) => {
      await supabase.rpc('upvote_user_problem_solution', {
        solution_id: solutionID,
      });
    },
    undoUpvoteSolution: async (solutionID: string) => {
      await supabase.rpc('remove_upvote_user_problem_solution', {
        solution_id: solutionID,
      });
    },
  };
}
