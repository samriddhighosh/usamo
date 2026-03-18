import dayjs from 'dayjs';
import { GroupSubmission, ProblemData } from './problem';

export type PostData = {
  id?: string;
  name: string;
  timestamp: string;
  /**
   * Markdown string of the post content
   */
  body: string;
  /**
   * no longer needed since posts can be more easily reordered (?)
   * @deprecated
   */
  isPinned: boolean;
  isPublished: boolean;
  isDeleted: boolean;
  // oops typescript is hard -- pointsPerProblem and problemOrdering should be type assignment only...
  pointsPerProblem: {
    [key: string]: number;
  };
  // array of problem IDs
  problemOrdering: string[] | null;
} & (
  | {
      type: 'announcement';
    }
  | {
      type: 'assignment';
      dueTimestamp: string | null;
    }
);

/**
 * Returns the due date as a string if the post is an assignment with a due date
 * Otherwise returns the posting time as a human-readable string
 */
export const getPostTimestampString = (post: PostData) => {
  if (post.type === 'assignment' && post.dueTimestamp) {
    return 'Due on ' + getPostDueDateString(post);
  } else {
    return 'Posted on ' + getPostDateString(post);
  }
};
export const getPostDateString = (post: PostData) =>
  post.timestamp
    ? dayjs(new Date(post.timestamp)).format('MMMM DD h:mma')
    : null;
export const getPostDueDateString = (post: PostData) =>
  post.type === 'assignment' && post.dueTimestamp
    ? dayjs(new Date(post.dueTimestamp)).format('MMMM DD h:mma')
    : null;
export const getTotalPointsFromProblems = (problems: ProblemData[]) =>
  problems.reduce((acc, cur) => acc + cur.points, 0);
export const getSubmissionTimestampString = (submission: GroupSubmission) =>
  dayjs(new Date(submission?.timestamp)).format('MMMM DD h:mma');
export const getSubmissionStatus = (submission: GroupSubmission) => {
  return submission.verdict;
};
export const getSubmissionEarnedPoints = (
  submission: GroupSubmission,
  problem: ProblemData
) => {
  return Math.round(submission.score * problem.points);
};
export const getEarnedPointsForProblem = (
  problem: ProblemData,
  submissions: GroupSubmission[]
) => {
  return submissions.reduce(
    (oldScore, submission) =>
      Math.max(oldScore, getSubmissionEarnedPoints(submission, problem)),
    0
  );
};
export const getTotalPointsOfPost = (post: PostData): number => {
  return Object.keys(post.pointsPerProblem || {}).reduce(
    (acc, cur) => acc + post.pointsPerProblem[cur],
    0
  );
};
/* Warning: should really use postordering in groupdata rather than this... */
export const sortPostsComparator = (a: PostData, b: PostData): number => {
  if (a.isPinned !== b.isPinned) {
    return (a.isPinned ? 1 : 0) - (b.isPinned ? 1 : 0);
  }

  return (
    (a.timestamp ? new Date(a.timestamp).getTime() : 0) -
    (b.timestamp ? new Date(b.timestamp).getTime() : 0)
  );
};
