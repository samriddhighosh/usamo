import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby';
import { requireAuth } from '../lib/server/auth';
import { getSupabaseAdmin } from '../lib/server/supabaseServer';

export default async function handler(
  request: GatsbyFunctionRequest,
  response: GatsbyFunctionResponse
) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const ctx = await requireAuth(request);
    const submissionId = request.query.submissionId as string | undefined;
    if (!submissionId) {
      response.status(400).json({ error: 'Missing submissionId' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: submission } = await supabase
      .from('submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single();

    if (!submission || submission.user_id !== ctx.userId) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { data, error } = await supabase
      .from('submission_versions')
      .select('id,content_latex,created_at')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });

    if (error) {
      response.status(500).json({ error: error.message });
      return;
    }

    response.json({ versions: data });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : 'Unauthorized' });
  }
}
