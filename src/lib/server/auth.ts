import type { GatsbyFunctionRequest } from 'gatsby';
import { getSupabaseAdmin } from './supabaseServer';

export type AuthContext = {
  userId: string;
  roles: string[];
  accessToken: string;
};

export function getBearerToken(request: GatsbyFunctionRequest): string {
  const header = request.headers.authorization || request.headers.Authorization;
  if (!header || Array.isArray(header)) {
    return '';
  }
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return '';
  }
  return parts[1];
}

export async function requireAuth(request: GatsbyFunctionRequest): Promise<AuthContext> {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new Error('Missing bearer token');
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(
    accessToken
  );
  if (userError || !userData?.user) {
    throw new Error('Invalid user');
  }

  const userId = userData.user.id;
  const { data: roleRows, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);

  if (roleError) {
    throw new Error('Failed to load roles');
  }

  const roles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: string } }).roles?.name)
    .filter((name): name is string => !!name);

  return { userId, roles, accessToken };
}

export async function requireRole(
  request: GatsbyFunctionRequest,
  required: string[]
): Promise<AuthContext> {
  const ctx = await requireAuth(request);
  if (!required.some((role) => ctx.roles.includes(role))) {
    throw new Error('Forbidden');
  }
  return ctx;
}
