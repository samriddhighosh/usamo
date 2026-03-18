import { ExecutionVerdict } from './problem';

export type Leaderboard = {
  [postID: string]: {
    [problemID: string]: {
      [userID: string]: {
        bestScore: number;
        bestScoreStatus: ExecutionVerdict;
        bestScoreTimestamp: string;
        bestScoreSubmissionId: string;
      };
    };
  };
};
