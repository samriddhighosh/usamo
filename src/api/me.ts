import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireAuth } from '../lib/server/auth';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  try {
    const ctx = await requireAuth(request);
    response.json({ userId: ctx.userId, roles: ctx.roles });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
