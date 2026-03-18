export type RatingParticipant = {
  userId: string;
  rating: number;
  score: number;
  lastAcceptedAt: string | null;
  contestsCount: number;
};

export type RatingResult = {
  userId: string;
  oldRating: number;
  newRating: number;
  delta: number;
  performance: number;
};

const RATING_MIN = 100;
const RATING_MAX = 4000;
const PERFORMANCE_MIN = 0;
const PERFORMANCE_MAX = 5000;

function expectedWinProbability(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function expectedRank(participants: RatingParticipant[], rating: number): number {
  return participants.reduce((sum, p) => sum + expectedWinProbability(rating, p.rating), 0.5);
}

function performanceToMatchRank(participants: RatingParticipant[], rank: number): number {
  let low = PERFORMANCE_MIN;
  let high = PERFORMANCE_MAX;
  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    const er = expectedRank(participants, mid);
    if (er > rank) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.round((low + high) / 2);
}

function kFactor(contestsCount: number): number {
  if (contestsCount < 5) return 0.75;
  if (contestsCount < 15) return 0.6;
  return 0.5;
}

export function calculateContestRatings(
  participants: RatingParticipant[],
  contestSize: number
): RatingResult[] {
  if (participants.length === 0) return [];

  const sorted = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.lastAcceptedAt ? new Date(a.lastAcceptedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.lastAcceptedAt ? new Date(b.lastAcceptedAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const ranks = new Map<string, number>();
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].score === sorted[i].score) {
      j += 1;
    }
    const rank = (i + 1 + j) / 2;
    for (let k = i; k < j; k += 1) {
      ranks.set(sorted[k].userId, rank);
    }
    i = j;
  }

  const rawResults = participants.map((p) => {
    const rank = ranks.get(p.userId) ?? participants.length;
    const performance = performanceToMatchRank(participants, rank);
    const deltaRaw = (performance - p.rating) * kFactor(p.contestsCount);
    return { ...p, rank, performance, deltaRaw };
  });

  const averageDelta =
    rawResults.reduce((sum, r) => sum + r.deltaRaw, 0) / Math.max(1, rawResults.length);
  const sizeScale = contestSize < 10 ? contestSize / 10 : 1;

  return rawResults.map((r) => {
    let delta = Math.round((r.deltaRaw - averageDelta) * sizeScale);
    if (delta > 250) delta = 250;
    if (delta < -250) delta = -250;

    let newRating = r.rating + delta;
    if (newRating < RATING_MIN) newRating = RATING_MIN;
    if (newRating > RATING_MAX) newRating = RATING_MAX;

    return {
      userId: r.userId,
      oldRating: r.rating,
      newRating,
      delta: newRating - r.rating,
      performance: r.performance,
    };
  });
}
