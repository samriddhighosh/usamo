import { useCurrentUser } from '../../context/UserDataContext/UserDataContext';
import { supabase } from '../../lib/supabaseClient';
import { PostData } from '../../models/groups/posts';
import { GroupProblemData } from '../../models/groups/problem';

// Duplicated from online-judge... online-judge should be the only version of this
export interface ProblemSubmissionRequestData {
  problemID: string;
  language: 'cpp' | 'java' | 'py';
  filename: string;
  sourceCode: string;
  submissionID?: string; // if given, uses this as the submission ID. must be uuidv4
  wait?: boolean; // if true, request will wait until the submission finishes grading.
  supabase?: {
    accessToken: string; // used to authenticate REST api
    groupId: string;
    postId: string;
    problemId: string;
    userID: string;
  };
}

export function usePostActions(groupId: string) {
  const currentUser = useCurrentUser();

  const updatePost = async (postId: string, updatedData: Partial<PostData>) => {
    await supabase
      .from('group_posts')
      .update({
        name: updatedData.name,
        timestamp: updatedData.timestamp,
        is_published: updatedData.isPublished,
        is_pinned: updatedData.isPinned,
        body: updatedData.body,
        is_deleted: updatedData.isDeleted,
        type: updatedData.type,
        points_per_problem: updatedData.pointsPerProblem,
        problem_ordering: updatedData.problemOrdering,
        due_at:
          updatedData.type === 'assignment'
            ? updatedData.dueTimestamp
            : null,
      })
      .eq('id', postId)
      .eq('group_id', groupId);
  };

  return {
    createNewPost: async (type: 'announcement' | 'assignment') => {
      const defaultPost: Omit<PostData, 'timestamp'> = {
        name: 'Untitled Post',
        isPublished: false,
        isPinned: false,
        body: '',
        isDeleted: false,
        type,
        pointsPerProblem: {},
        problemOrdering: [],
        ...(type === 'announcement'
          ? {}
          : {
              dueTimestamp: null,
            }),
      };
      const { data, error } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          name: defaultPost.name,
          is_published: defaultPost.isPublished,
          is_pinned: defaultPost.isPinned,
          body: defaultPost.body,
          is_deleted: defaultPost.isDeleted,
          type: defaultPost.type,
          points_per_problem: defaultPost.pointsPerProblem,
          problem_ordering: defaultPost.problemOrdering,
          due_at:
            defaultPost.type === 'assignment' ? defaultPost.dueTimestamp : null,
          timestamp: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.rpc('groups_append_post_ordering', {
        group_id: groupId,
        post_id: data.id,
      });
      return data.id;
    },
    deletePost: async (postId: string): Promise<void> => {
      await supabase
        .from('group_posts')
        .update({ is_deleted: true })
        .eq('id', postId)
        .eq('group_id', groupId);
      await supabase.rpc('groups_remove_post_ordering', {
        group_id: groupId,
        post_id: postId,
      });
    },
    updatePost,
    createNewProblem: async (post: PostData) => {
      const defaultProblem: GroupProblemData = {
        id: '',
        postId: post.id!,
        name: 'Untitled Problem',
        body: '',
        source: '',
        points: 100,
        difficulty: 'Normal',
        hints: [],
        solution: null,
        isDeleted: false,
        guideProblemId: null,
        solutionReleaseMode: 'due-date',
      };
      const { data, error } = await supabase
        .from('group_problems')
        .insert({
          group_id: groupId,
          post_id: post.id,
          name: defaultProblem.name,
          body: defaultProblem.body,
          source: defaultProblem.source,
          points: defaultProblem.points,
          difficulty: defaultProblem.difficulty,
          hints: defaultProblem.hints,
          solution: defaultProblem.solution,
          is_deleted: defaultProblem.isDeleted,
          guide_problem_id: defaultProblem.guideProblemId,
          solution_release_mode: defaultProblem.solutionReleaseMode,
          solution_release_at: null,
        })
        .select('id')
        .single();
      if (error) throw error;
      await supabase.rpc('posts_append_problem_ordering', {
        post_id: post.id,
        problem_id: data.id,
        points: defaultProblem.points,
      });
      return data.id;
    },
    saveProblem: async (post: PostData, problem: GroupProblemData) => {
      if (
        problem.solutionReleaseMode == 'custom' &&
        !problem.solutionReleaseTimestamp
      ) {
        alert(
          'If you set the solution release mode to custom, you must set a solution release timestamp.'
        );
        return;
      }
      await supabase
        .from('group_problems')
        .update({
          name: problem.name,
          body: problem.body,
          source: problem.source,
          points: problem.points,
          difficulty: problem.difficulty,
          hints: problem.hints,
          solution: problem.solution,
          is_deleted: problem.isDeleted,
          guide_problem_id: problem.guideProblemId,
          solution_release_mode: problem.solutionReleaseMode,
          solution_release_at:
            problem.solutionReleaseMode === 'custom'
              ? problem.solutionReleaseTimestamp
              : null,
        })
        .eq('id', problem.id)
        .eq('group_id', groupId)
        .eq('post_id', post.id!);

      await supabase.rpc('posts_update_problem_points', {
        post_id: post.id,
        problem_id: problem.id,
        points: problem.points,
      });
      return problem.id;
    },
    deleteProblem: async (post: PostData, problemId: string) => {
      await supabase
        .from('group_problems')
        .update({ is_deleted: true })
        .eq('id', problemId)
        .eq('group_id', groupId)
        .eq('post_id', post.id!);
      await supabase.rpc('posts_remove_problem_ordering', {
        post_id: post.id,
        problem_id: problemId,
      });
    },
    updateProblemOrdering: async (postId: string, ordering: string[]) => {
      await supabase
        .from('group_posts')
        .update({ problem_ordering: ordering })
        .eq('id', postId)
        .eq('group_id', groupId);
    },
    submitSolution: async (
      submission: Omit<
        ProblemSubmissionRequestData,
        'submissionID' | 'wait' | 'supabase'
      >,
      postId: string,
      problemId: string
    ) => {
      const idToken = await currentUser!.getIdToken();
      const reqData: ProblemSubmissionRequestData = {
        problemID: submission.problemID,
        language: submission.language,
        filename: submission.filename,
        sourceCode: submission.sourceCode,
        supabase: {
          accessToken: idToken,
          groupId,
          postId,
          problemId,
          userID: currentUser!.uid,
        },
      };
      const resp = await fetch(
        `https://ggzk2rm2ad.execute-api.us-west-1.amazonaws.com/Prod/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reqData),
        }
      );
      const respData = await resp.json();
      if (!resp.ok) {
        throw new Error(respData.message);
      }
      return respData.submissionID;
    },
    submitSubmissionLink: async (
      submissionLink: string,
      postId: string,
      problemId: string
    ) => {
      await supabase.from('group_problem_submissions').insert({
        group_id: groupId,
        post_id: postId,
        problem_id: problemId,
        score: 1,
        user_id: currentUser!.uid,
        type: 'submission-link',
        verdict: 'AC',
        timestamp: new Date().toISOString(),
        link: submissionLink,
      });
    },
  };
}
