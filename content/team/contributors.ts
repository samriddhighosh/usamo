export type Member = {
  name: string;
  titles: string[];
  photo?: string;
  email?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  codeforces?: string;
  website?: string;
  youtube?: string;
  reddit?: string;
};

export const Members = {
  CurrentMembers: [] as Member[],
  FormerMembers: [] as Member[],
};
