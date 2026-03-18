-- Contest system schema + RLS

create extension if not exists pgcrypto;

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contest_state') THEN
    CREATE TYPE public.contest_state AS ENUM ('scheduled', 'active', 'ended', 'finalized', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contest_mode') THEN
    CREATE TYPE public.contest_mode AS ENUM ('live', 'virtual', 'practice');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contest_visibility') THEN
    CREATE TYPE public.contest_visibility AS ENUM ('public', 'private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_state') THEN
    CREATE TYPE public.submission_state AS ENUM ('draft', 'submitted', 'locked');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_name') THEN
    CREATE TYPE public.role_name AS ENUM ('admin', 'grader', 'problem_manager');
  END IF;
END $$;

-- Helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;



-- Core tables
create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  min_rating integer,
  max_rating integer,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  display_name text not null,
  rating integer not null default 1200,
  level_id uuid references public.levels on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name public.role_name unique not null
);

create table if not exists public.user_roles (
  user_id uuid not null references public.users on delete cascade,
  role_id uuid not null references public.roles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create or replace function public.has_role(p_role public.role_name)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = p_role
  );
$$;

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  level_id uuid references public.levels on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null,
  state public.contest_state not null default 'scheduled',
  visibility public.contest_visibility not null default 'public',
  rating_enabled boolean not null default true,
  created_by uuid not null references public.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contests_time_check check (end_time > start_time)
);

create table if not exists public.contest_access (
  contest_id uuid not null references public.contests on delete cascade,
  user_id uuid not null references public.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);

create table if not exists public.contest_graders (
  contest_id uuid not null references public.contests on delete cascade,
  grader_id uuid not null references public.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contest_id, grader_id)
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  statement_latex text not null,
  solution_latex text not null,
  tags text[] not null default '{}',
  difficulty integer not null default 1200,
  point_value integer not null default 7,
  created_by uuid not null references public.users on delete cascade,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.problem_parts (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems on delete cascade,
  label text not null,
  statement_latex text not null,
  point_value integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.contest_problems (
  contest_id uuid not null references public.contests on delete cascade,
  problem_id uuid not null references public.problems on delete cascade,
  order_index integer not null default 0,
  primary key (contest_id, problem_id)
);

create table if not exists public.contest_sessions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests on delete cascade,
  user_id uuid not null references public.users on delete cascade,
  mode public.contest_mode not null,
  start_time timestamptz not null default now(),
  end_time timestamptz not null,
  is_finalized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, user_id, mode)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests on delete cascade,
  user_id uuid not null references public.users on delete cascade,
  problem_id uuid not null references public.problems on delete cascade,
  content_latex text not null default '',
  state public.submission_state not null default 'draft',
  is_locked boolean not null default false,
  last_submit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, user_id, problem_id)
);

create table if not exists public.submission_versions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions on delete cascade,
  content_latex text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions on delete cascade,
  grader_id uuid not null references public.users on delete cascade,
  score integer not null default 0,
  max_score integer not null default 0,
  feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id)
);

create table if not exists public.grade_parts (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades on delete cascade,
  part_id uuid references public.problem_parts on delete cascade,
  score integer not null default 0,
  max_score integer not null default 0,
  feedback text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboards (
  contest_id uuid not null references public.contests on delete cascade,
  user_id uuid not null references public.users on delete cascade,
  total_score integer not null default 0,
  last_accepted_at timestamptz,
  rank integer,
  updated_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);

create table if not exists public.ratings (
  user_id uuid primary key references public.users on delete cascade,
  rating integer not null default 1200,
  contests_count integer not null default 0,
  last_contest_id uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.rating_history (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests on delete cascade,
  user_id uuid not null references public.users on delete cascade,
  old_rating integer not null,
  new_rating integer not null,
  delta integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ip_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete set null,
  contest_id uuid references public.contests on delete set null,
  ip_address text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.anti_cheat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users on delete set null,
  contest_id uuid references public.contests on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.submission_similarity (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests on delete cascade,
  problem_id uuid not null references public.problems on delete cascade,
  user_id_a uuid not null references public.users on delete cascade,
  user_id_b uuid not null references public.users on delete cascade,
  score numeric not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_users_rating on public.users (rating desc);
create index if not exists idx_levels_sort on public.levels (sort_order);
create index if not exists idx_contests_state on public.contests (state);
create index if not exists idx_contests_visibility on public.contests (visibility);
create index if not exists idx_contest_problems_contest on public.contest_problems (contest_id);
create index if not exists idx_contest_sessions_user on public.contest_sessions (user_id, contest_id);
create index if not exists idx_submissions_contest_user on public.submissions (contest_id, user_id);
create index if not exists idx_grades_submission on public.grades (submission_id);
create index if not exists idx_leaderboards_contest on public.leaderboards (contest_id, total_score desc);
create index if not exists idx_rating_history_user on public.rating_history (user_id, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_id, created_at desc);
create index if not exists idx_ip_logs_user on public.ip_logs (user_id, created_at desc);
create index if not exists idx_anti_cheat_user on public.anti_cheat_events (user_id, created_at desc);

-- Helper functions (after tables)
create or replace function public.get_level_for_rating(p_rating integer)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.levels
  where (min_rating is null or p_rating >= min_rating)
    and (max_rating is null or p_rating <= max_rating)
  order by sort_order
  limit 1;
$$;

create or replace function public.is_contest_active(p_contest_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests c
    where c.id = p_contest_id
      and c.state = 'active'
  );
$$;

create or replace function public.can_edit_submission(p_contest_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contest public.contests%rowtype;
  v_session public.contest_sessions%rowtype;
  v_now timestamptz := now();
begin
  select * into v_contest from public.contests where id = p_contest_id;
  if v_contest.id is null then
    return false;
  end if;

  select * into v_session
    from public.contest_sessions
    where contest_id = p_contest_id and user_id = p_user_id
    order by start_time desc
    limit 1;

  if v_contest.state = 'active' and v_contest.start_time <= v_now and v_contest.end_time >= v_now then
    return true;
  end if;

  if v_session.id is not null and v_session.mode = 'virtual' then
    if v_session.start_time <= v_now and v_session.end_time >= v_now then
      return true;
    end if;
  end if;

  if v_session.id is not null and v_session.mode = 'practice' then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.update_contest_states()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contests
    set state = 'active'
  where state = 'scheduled'
    and start_time <= now()
    and end_time > now();

  update public.contests
    set state = 'ended'
  where state = 'active'
    and end_time <= now();
end;
$$;

create or replace function public.lock_submissions_for_contest(p_contest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions
    set is_locked = true,
        state = 'locked'
  where contest_id = p_contest_id;
end;
$$;

create or replace function public.ensure_user_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, handle, display_name, rating, level_id)
  values (
    NEW.id,
    coalesce(NEW.email, NEW.id::text),
    coalesce(NEW.email, NEW.id::text),
    1200,
    public.get_level_for_rating(1200)
  )
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name)
  values (NEW.id, coalesce(NEW.email, NEW.id::text))
  on conflict (id) do nothing;

  return NEW;
end;
$$;

-- Triggers
drop trigger if exists trigger_users_updated_at on public.users;
create trigger trigger_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_contests_updated_at on public.contests;
create trigger trigger_contests_updated_at
  before update on public.contests
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_contest_sessions_updated_at on public.contest_sessions;
create trigger trigger_contest_sessions_updated_at
  before update on public.contest_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_submissions_updated_at on public.submissions;
create trigger trigger_submissions_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_grades_updated_at on public.grades;
create trigger trigger_grades_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_grade_parts_updated_at on public.grade_parts;
create trigger trigger_grade_parts_updated_at
  before update on public.grade_parts
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_ratings_updated_at on public.ratings;
create trigger trigger_ratings_updated_at
  before update on public.ratings
  for each row execute function public.set_updated_at();

drop trigger if exists trigger_users_init on auth.users;
create trigger trigger_users_init
  after insert on auth.users
  for each row execute function public.ensure_user_row();

-- Auto versioning of submissions
create or replace function public.snapshot_submission_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.submission_versions (submission_id, content_latex)
  values (NEW.id, NEW.content_latex);
  return NEW;
end;
$$;

drop trigger if exists trigger_submission_versions on public.submissions;
create trigger trigger_submission_versions
  after insert or update of content_latex on public.submissions
  for each row execute function public.snapshot_submission_version();

-- Aggregate grades
create or replace function public.recalculate_grade_total(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade_id uuid;
  v_total integer;
  v_max integer;
begin
  select id into v_grade_id from public.grades where submission_id = p_submission_id;
  if v_grade_id is null then
    return;
  end if;

  select coalesce(sum(score), 0), coalesce(sum(max_score), 0)
    into v_total, v_max
    from public.grade_parts
    where grade_id = v_grade_id;

  update public.grades
    set score = v_total,
        max_score = v_max
    where id = v_grade_id;
end;
$$;

create or replace function public.trigger_recalculate_grade_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_grade_total(NEW.submission_id);
  return NEW;
end;
$$;

drop trigger if exists trigger_recalculate_grade_total on public.grade_parts;
create trigger trigger_recalculate_grade_total
  after insert or update or delete on public.grade_parts
  for each row execute function public.trigger_recalculate_grade_total();

-- RLS
alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.levels enable row level security;
alter table public.contests enable row level security;
alter table public.contest_access enable row level security;
alter table public.contest_graders enable row level security;
alter table public.problems enable row level security;
alter table public.problem_parts enable row level security;
alter table public.contest_problems enable row level security;
alter table public.contest_sessions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_versions enable row level security;
alter table public.grades enable row level security;
alter table public.grade_parts enable row level security;
alter table public.leaderboards enable row level security;
alter table public.ratings enable row level security;
alter table public.rating_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ip_logs enable row level security;
alter table public.anti_cheat_events enable row level security;
alter table public.submission_similarity enable row level security;

-- Policies
create policy "Users can read users"
  on public.users for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Users can update own user row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins manage roles"
  on public.roles for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Admins manage user_roles"
  on public.user_roles for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Levels are public"
  on public.levels for select
  using (true);

create policy "Admins manage levels"
  on public.levels for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Contests are public when visible"
  on public.contests for select
  using (
    visibility = 'public'
    or public.has_role('admin')
    or exists (
      select 1 from public.contest_access ca
      where ca.contest_id = id and ca.user_id = auth.uid()
    )
  );

create policy "Admins manage contests"
  on public.contests for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Contest access by admins"
  on public.contest_access for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Graders assigned read"
  on public.contest_graders for select
  using (public.has_role('admin') or grader_id = auth.uid());

create policy "Admins manage contest graders"
  on public.contest_graders for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Problems are readable"
  on public.problems for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Problem managers manage problems"
  on public.problems for all
  using (public.has_role('admin') or public.has_role('problem_manager'))
  with check (public.has_role('admin') or public.has_role('problem_manager'));

create policy "Problem parts readable"
  on public.problem_parts for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Problem managers manage parts"
  on public.problem_parts for all
  using (public.has_role('admin') or public.has_role('problem_manager'))
  with check (public.has_role('admin') or public.has_role('problem_manager'));

create policy "Contest problems readable"
  on public.contest_problems for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Admins manage contest problems"
  on public.contest_problems for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Contest sessions are user-owned"
  on public.contest_sessions for select
  using (auth.uid() = user_id or public.has_role('admin'));

create policy "Users create contest sessions"
  on public.contest_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own sessions"
  on public.contest_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Submissions readable"
  on public.submissions for select
  using (
    auth.uid() = user_id
    or public.has_role('admin')
    or exists (
      select 1 from public.contest_graders cg
      where cg.contest_id = submissions.contest_id and cg.grader_id = auth.uid()
    )
  );

create policy "Users insert submissions"
  on public.submissions for insert
  with check (
    auth.uid() = user_id
    and public.can_edit_submission(contest_id, user_id)
  );

create policy "Users update submissions"
  on public.submissions for update
  using (
    auth.uid() = user_id
    and public.can_edit_submission(contest_id, user_id)
    and is_locked = false
  )
  with check (
    auth.uid() = user_id
    and public.can_edit_submission(contest_id, user_id)
    and is_locked = false
  );

create policy "Submission versions readable"
  on public.submission_versions for select
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
    or public.has_role('admin')
  );

create policy "Grades readable"
  on public.grades for select
  using (
    public.has_role('admin')
    or exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.user_id = auth.uid()
    )
    or exists (
      select 1 from public.contest_graders cg
      join public.submissions s2 on s2.contest_id = cg.contest_id
      where cg.grader_id = auth.uid() and s2.id = submission_id
    )
  );

create policy "Graders update grades"
  on public.grades for all
  using (
    public.has_role('admin')
    or exists (
      select 1 from public.contest_graders cg
      join public.submissions s on s.contest_id = cg.contest_id
      where cg.grader_id = auth.uid() and s.id = submission_id
    )
  )
  with check (
    public.has_role('admin')
    or exists (
      select 1 from public.contest_graders cg
      join public.submissions s on s.contest_id = cg.contest_id
      where cg.grader_id = auth.uid() and s.id = submission_id
    )
  );

create policy "Grade parts follow grades"
  on public.grade_parts for all
  using (
    public.has_role('admin')
    or exists (
      select 1 from public.grades g
      join public.submissions s on s.id = g.submission_id
      join public.contest_graders cg on cg.contest_id = s.contest_id
      where g.id = grade_id and cg.grader_id = auth.uid()
    )
  )
  with check (
    public.has_role('admin')
    or exists (
      select 1 from public.grades g
      join public.submissions s on s.id = g.submission_id
      join public.contest_graders cg on cg.contest_id = s.contest_id
      where g.id = grade_id and cg.grader_id = auth.uid()
    )
  );

create policy "Leaderboards public"
  on public.leaderboards for select
  using (true);

create policy "Admins manage leaderboards"
  on public.leaderboards for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Ratings readable"
  on public.ratings for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy "Admins manage ratings"
  on public.ratings for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Rating history readable"
  on public.rating_history for select
  using (auth.uid() = user_id or public.has_role('admin'));

create policy "Admins manage rating history"
  on public.rating_history for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "Audit logs admin"
  on public.audit_logs for select
  using (public.has_role('admin'));

create policy "Audit logs insert"
  on public.audit_logs for insert
  with check (auth.uid() = actor_id or public.has_role('admin'));

create policy "IP logs insert"
  on public.ip_logs for insert
  with check (auth.uid() = user_id);

create policy "IP logs admin read"
  on public.ip_logs for select
  using (public.has_role('admin'));

create policy "Anti-cheat events insert"
  on public.anti_cheat_events for insert
  with check (auth.uid() = user_id);

create policy "Anti-cheat events admin read"
  on public.anti_cheat_events for select
  using (public.has_role('admin'));

create policy "Similarity admin"
  on public.submission_similarity for select
  using (public.has_role('admin'));

-- Seed roles and levels
insert into public.roles (name)
  values ('admin'), ('grader'), ('problem_manager')
  on conflict (name) do nothing;

insert into public.levels (name, min_rating, max_rating, sort_order)
  values
    ('Bronze', null, 1199, 1),
    ('Silver', 1200, 1499, 2),
    ('Gold', 1500, 1799, 3),
    ('Platinum', 1800, 2099, 4),
    ('Diamond', 2100, null, 5)
  on conflict (name) do nothing;

insert into public.users (id, handle, display_name, rating, level_id)
  select u.id,
         coalesce(u.email, u.id::text),
         coalesce(u.email, u.id::text),
         1200,
         public.get_level_for_rating(1200)
  from auth.users u
  on conflict (id) do nothing;

-- Backfill ratings table
insert into public.ratings (user_id, rating, contests_count)
  select id, rating, 0 from public.users
  on conflict (user_id) do nothing;
