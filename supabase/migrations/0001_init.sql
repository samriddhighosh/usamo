-- Supabase schema + RLS for USAMO Guide migration

create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  can_moderate boolean not null default false,
  can_create_groups boolean not null default false,
  created_at timestamptz not null default now()
);

-- User data (stored as JSONB for fast iteration)
create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- User problem solutions
create table if not exists public.user_problem_solutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  user_name text not null,
  problem_id text not null,
  is_public boolean not null default false,
  solution_code text not null,
  language text not null,
  upvotes uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Analytics counters
create table if not exists public.analytics_counters (
  key text primary key,
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_analytics_counter(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.analytics_counters (key, count, updated_at)
  values (p_key, 1, now())
  on conflict (key)
  do update set count = public.analytics_counters.count + 1,
                updated_at = now();
end;
$$;

create or replace function public.get_public_site_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count bigint;
  pageviews_count bigint;
begin
  select count(*) into user_count from public.profiles;
  select analytics_counters.count
    into pageviews_count
    from public.analytics_counters
   where key = 'pageviews';
  return jsonb_build_object(
    'num_users', user_count,
    'pageviews', coalesce(pageviews_count, 0)
  );
end;
$$;

grant execute on function public.increment_analytics_counter(text) to anon, authenticated;
grant execute on function public.get_public_site_stats() to anon, authenticated;

alter table public.analytics_counters enable row level security;

-- Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_ids uuid[] not null default '{}',
  admin_ids uuid[] not null default '{}',
  member_ids uuid[] not null default '{}',
  post_ordering uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  name text not null,
  timestamp timestamptz not null default now(),
  body text not null default '',
  is_pinned boolean not null default false,
  is_published boolean not null default false,
  is_deleted boolean not null default false,
  type text not null check (type in ('announcement', 'assignment')),
  due_at timestamptz null,
  points_per_problem jsonb not null default '{}'::jsonb,
  problem_ordering uuid[] not null default '{}'
);

create table if not exists public.group_problems (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  post_id uuid not null references public.group_posts on delete cascade,
  name text not null,
  body text not null,
  source text not null default '',
  points integer not null default 100,
  difficulty text not null default 'Normal',
  hints jsonb not null default '[]'::jsonb,
  solution text null,
  is_deleted boolean not null default false,
  guide_problem_id text null,
  solution_release_mode text not null default 'due-date',
  solution_release_at timestamptz null
);

create table if not exists public.group_problem_submissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  post_id uuid not null references public.group_posts on delete cascade,
  problem_id uuid not null references public.group_problems on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  language text,
  score numeric,
  submission_id text,
  type text not null,
  verdict text,
  timestamp timestamptz not null default now(),
  link text
);

create table if not exists public.group_join_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  revoked boolean not null default false,
  num_uses integer not null default 0,
  max_uses integer null,
  expiration_time timestamptz null,
  used_by uuid[] not null default '{}',
  author uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_leaderboard (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  total_points numeric not null default 0,
  post_scores jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  user_info jsonb not null default '{}'::jsonb,
  primary key (group_id, user_id)
);

create table if not exists public.contact_form_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  module_name text,
  url text,
  lang text,
  topic text not null,
  message text not null,
  issue_number integer,
  created_at timestamptz not null default now()
);

create table if not exists public.video_feedback (
  video_id text not null,
  user_id uuid not null references auth.users on delete cascade,
  rating text,
  comments text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (video_id, user_id)
);

create table if not exists public.app_metrics (
  key text primary key,
  value bigint not null default 0
);

insert into public.app_metrics (key, value)
  values ('num_users', 0)
  on conflict (key) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.user_problem_solutions enable row level security;
alter table public.groups enable row level security;
alter table public.group_posts enable row level security;
alter table public.group_problems enable row level security;
alter table public.group_problem_submissions enable row level security;
alter table public.group_join_links enable row level security;
alter table public.group_leaderboard enable row level security;
alter table public.contact_form_submissions enable row level security;
alter table public.video_feedback enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- User data policies
create policy "Users can read their user_data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "Users can update their user_data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert their user_data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

-- User problem solutions policies
create policy "Public solutions readable"
  on public.user_problem_solutions for select
  using (is_public = true or user_id = auth.uid());

create policy "Users can insert own solutions"
  on public.user_problem_solutions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own solutions"
  on public.user_problem_solutions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own solutions"
  on public.user_problem_solutions for delete
  using (auth.uid() = user_id);

-- Groups policies
create policy "Group members can read groups"
  on public.groups for select
  using (
    auth.uid() = any(owner_ids)
    or auth.uid() = any(admin_ids)
    or auth.uid() = any(member_ids)
  );

create policy "Admins can read all groups"
  on public.groups for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Users can create groups"
  on public.groups for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and (p.is_admin or p.can_create_groups)
    )
  );

create policy "Owners can update groups"
  on public.groups for update
  using (auth.uid() = any(owner_ids))
  with check (auth.uid() = any(owner_ids));

create policy "Owners can delete groups"
  on public.groups for delete
  using (auth.uid() = any(owner_ids));

-- Group posts policies
create policy "Group members can read posts"
  on public.group_posts for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (
          auth.uid() = any(g.owner_ids)
          or auth.uid() = any(g.admin_ids)
          or auth.uid() = any(g.member_ids)
        )
    )
  );

create policy "Group admins can modify posts"
  on public.group_posts for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

create policy "Group admins can update posts"
  on public.group_posts for update
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

create policy "Group admins can delete posts"
  on public.group_posts for delete
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

-- Group problems policies
create policy "Group members can read problems"
  on public.group_problems for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (
          auth.uid() = any(g.owner_ids)
          or auth.uid() = any(g.admin_ids)
          or auth.uid() = any(g.member_ids)
        )
    )
  );

create policy "Group admins can modify problems"
  on public.group_problems for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

create policy "Group admins can update problems"
  on public.group_problems for update
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

create policy "Group admins can delete problems"
  on public.group_problems for delete
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

-- Submissions policies
create policy "Group members can read submissions"
  on public.group_problem_submissions for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (
          auth.uid() = any(g.owner_ids)
          or auth.uid() = any(g.admin_ids)
          or auth.uid() = any(g.member_ids)
        )
    )
    or auth.uid() = user_id
  );

create policy "Members can insert submissions"
  on public.group_problem_submissions for insert
  with check (auth.uid() = user_id);

-- Join links policies
create policy "Admins can read join links"
  on public.group_join_links for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

create policy "Admins can modify join links"
  on public.group_join_links for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

create policy "Admins can update join links"
  on public.group_join_links for update
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  )
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
    )
  );

-- Leaderboard policies
create policy "Group members can read leaderboard"
  on public.group_leaderboard for select
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
        and (
          auth.uid() = any(g.owner_ids)
          or auth.uid() = any(g.admin_ids)
          or auth.uid() = any(g.member_ids)
        )
    )
  );

-- Contact form submissions policies
create policy "Admins can read contact form submissions"
  on public.contact_form_submissions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Video feedback policies
create policy "Users can read their feedback"
  on public.video_feedback for select
  using (auth.uid() = user_id);

create policy "Users can upsert their feedback"
  on public.video_feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can update their feedback"
  on public.video_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helper functions
create or replace function public.upvote_user_problem_solution(solution_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.user_problem_solutions
    set upvotes = array(
      select distinct unnest(coalesce(upvotes, '{}'::uuid[]))
      union all select auth.uid()
    )
  where id = solution_id and auth.uid() is not null;
end;
$$;

create or replace function public.remove_upvote_user_problem_solution(solution_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.user_problem_solutions
    set upvotes = array(
      select unnest(coalesce(upvotes, '{}'::uuid[]))
      except select auth.uid()
    )
  where id = solution_id and auth.uid() is not null;
end;
$$;

create or replace function public.groups_append_post_ordering(group_id uuid, post_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.groups
    set post_ordering = array_append(post_ordering, post_id)
  where id = group_id;
end;
$$;

create or replace function public.groups_remove_post_ordering(group_id uuid, post_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.groups
    set post_ordering = array_remove(post_ordering, post_id)
  where id = group_id;
end;
$$;

create or replace function public.posts_append_problem_ordering(post_id uuid, problem_id uuid, points integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.group_posts
    set problem_ordering = array_append(problem_ordering, problem_id),
        points_per_problem = jsonb_set(
          coalesce(points_per_problem, '{}'::jsonb),
          array[problem_id::text],
          to_jsonb(points),
          true
        )
  where id = post_id;
end;
$$;

create or replace function public.posts_remove_problem_ordering(post_id uuid, problem_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.group_posts
    set problem_ordering = array_remove(problem_ordering, problem_id),
        points_per_problem = points_per_problem - problem_id::text
  where id = post_id;
end;
$$;

create or replace function public.posts_update_problem_points(post_id uuid, problem_id uuid, points integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.group_posts
    set points_per_problem = jsonb_set(
      coalesce(points_per_problem, '{}'::jsonb),
      array[problem_id::text],
      to_jsonb(points),
      true
    )
  where id = post_id;
end;
$$;

create or replace function public.groups_leave(p_group_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  grp record;
  caller uuid := auth.uid();
  permission text;
begin
  select * into grp from public.groups where id = p_group_id;
  if not found then
    return json_build_object('success', false, 'errorCode', 'GROUP_NOT_FOUND');
  end if;

  if caller is null then
    return json_build_object('success', false, 'errorCode', 'NOT_AUTHENTICATED');
  end if;

  if caller = any(grp.owner_ids) then
    permission := 'OWNER';
  elsif caller = any(grp.admin_ids) then
    permission := 'ADMIN';
  elsif caller = any(grp.member_ids) then
    permission := 'MEMBER';
  else
    return json_build_object('success', false, 'errorCode', 'GROUP_NOT_FOUND');
  end if;

  if permission = 'OWNER' and array_length(array_remove(grp.owner_ids, caller), 1) = 0 then
    return json_build_object('success', false, 'errorCode', 'SOLE_OWNER');
  end if;

  update public.groups
    set owner_ids = array_remove(owner_ids, caller),
        admin_ids = array_remove(admin_ids, caller),
        member_ids = array_remove(member_ids, caller)
  where id = p_group_id;

  delete from public.group_leaderboard
    where group_id = p_group_id and user_id = caller;

  return json_build_object('success', true);
end;
$$;

create or replace function public.groups_remove_member(p_group_id uuid, p_target_uid uuid)
returns json
language plpgsql
security definer
as $$
declare
  grp record;
  caller uuid := auth.uid();
  target_level text;
begin
  if caller is null then
    return json_build_object('success', false, 'errorCode', 'NOT_AUTHENTICATED');
  end if;

  select * into grp from public.groups where id = p_group_id;
  if not found then
    return json_build_object('success', false, 'errorCode', 'GROUP_NOT_FOUND');
  end if;

  if caller = p_target_uid then
    return json_build_object('success', false, 'errorCode', 'REMOVING_SELF');
  end if;

  if not (caller = any(grp.owner_ids)) then
    return json_build_object('success', false, 'errorCode', 'PERMISSION_DENIED');
  end if;

  if p_target_uid = any(grp.owner_ids) then
    target_level := 'OWNER';
  elsif p_target_uid = any(grp.admin_ids) then
    target_level := 'ADMIN';
  elsif p_target_uid = any(grp.member_ids) then
    target_level := 'MEMBER';
  else
    return json_build_object('success', false, 'errorCode', 'MEMBER_NOT_FOUND');
  end if;

  update public.groups
    set owner_ids = array_remove(owner_ids, p_target_uid),
        admin_ids = array_remove(admin_ids, p_target_uid),
        member_ids = array_remove(member_ids, p_target_uid)
  where id = p_group_id;

  delete from public.group_leaderboard
    where group_id = p_group_id and user_id = p_target_uid;

  return json_build_object('success', true);
end;
$$;

create or replace function public.groups_update_member_permissions(
  p_group_id uuid,
  p_target_uid uuid,
  new_permission_level text
) returns json
language plpgsql
security definer
as $$
declare
  grp record;
  caller uuid := auth.uid();
  current_level text;
begin
  if caller is null then
    return json_build_object('success', false, 'errorCode', 'NOT_AUTHENTICATED');
  end if;

  if caller = p_target_uid then
    return json_build_object('success', false, 'errorCode', 'UPDATING_SELF');
  end if;

  if new_permission_level not in ('OWNER','ADMIN','MEMBER') then
    return json_build_object('success', false, 'errorCode', 'INVALID_NEW_PERMISSION_LEVEL');
  end if;

  select * into grp from public.groups where id = p_group_id;
  if not found then
    return json_build_object('success', false, 'errorCode', 'GROUP_NOT_FOUND');
  end if;

  if not (caller = any(grp.owner_ids)) then
    return json_build_object('success', false, 'errorCode', 'PERMISSION_DENIED');
  end if;

  if p_target_uid = any(grp.owner_ids) then
    current_level := 'OWNER';
  elsif p_target_uid = any(grp.admin_ids) then
    current_level := 'ADMIN';
  elsif p_target_uid = any(grp.member_ids) then
    current_level := 'MEMBER';
  else
    return json_build_object('success', false, 'errorCode', 'MEMBER_NOT_FOUND');
  end if;

  if current_level = new_permission_level then
    return json_build_object('success', false, 'errorCode', 'ALREADY_NEW_PERMISSION_LEVEL');
  end if;

  update public.groups
    set owner_ids = array_remove(owner_ids, p_target_uid),
        admin_ids = array_remove(admin_ids, p_target_uid),
        member_ids = array_remove(member_ids, p_target_uid)
  where id = p_group_id;

  if new_permission_level = 'OWNER' then
    update public.groups set owner_ids = array_append(owner_ids, p_target_uid)
      where id = p_group_id;
  elsif new_permission_level = 'ADMIN' then
    update public.groups set admin_ids = array_append(admin_ids, p_target_uid)
      where id = p_group_id;
  else
    update public.groups set member_ids = array_append(member_ids, p_target_uid)
      where id = p_group_id;
  end if;

  return json_build_object('success', true);
end;
$$;

-- Leaderboard trigger
create or replace function public.update_group_leaderboard()
returns trigger
language plpgsql
security definer
as $$
declare
  problem_points integer;
  computed_points numeric;
  existing_best numeric;
  v_post_scores jsonb;
  v_details jsonb;
  post_total numeric;
  total_points numeric;
  profile record;
begin
  if NEW.score is null then
    return NEW;
  end if;

  select points into problem_points from public.group_problems where id = NEW.problem_id;
  if problem_points is null then
    return NEW;
  end if;

  computed_points := NEW.score * problem_points;

  insert into public.group_leaderboard (group_id, user_id)
    values (NEW.group_id, NEW.user_id)
    on conflict do nothing;

  select * into profile from public.profiles where id = NEW.user_id;

  select post_scores, details into v_post_scores, v_details
    from public.group_leaderboard
    where group_id = NEW.group_id and user_id = NEW.user_id
    for update;

  v_post_scores := coalesce(v_post_scores, '{}'::jsonb);
  v_details := coalesce(v_details, '{}'::jsonb);

  existing_best := (v_details #>> array[NEW.post_id::text, NEW.problem_id::text, 'bestScore'])::numeric;
  if existing_best is null or computed_points >= existing_best then
    v_details := jsonb_set(
      v_details,
      array[NEW.post_id::text, NEW.problem_id::text],
      jsonb_build_object(
        'bestScore', computed_points,
        'bestScoreStatus', NEW.verdict,
        'bestScoreTimestamp', NEW.timestamp,
        'bestScoreSubmissionId', NEW.submission_id
      ),
      true
    );
  end if;

  v_post_scores := jsonb_set(
    v_post_scores,
    array[NEW.post_id::text, NEW.problem_id::text],
    to_jsonb(computed_points),
    true
  );

  select sum((value)::numeric) into post_total
    from jsonb_each_text(v_post_scores -> NEW.post_id::text)
    where key <> 'totalPoints';

  v_post_scores := jsonb_set(
    v_post_scores,
    array[NEW.post_id::text, 'totalPoints'],
    to_jsonb(coalesce(post_total, 0)),
    true
  );

  select sum((value ->> 'totalPoints')::numeric) into total_points
    from jsonb_each(v_post_scores)
    where key <> 'totalPoints';

  update public.group_leaderboard
    set post_scores = v_post_scores,
        details = v_details,
        total_points = coalesce(total_points, 0),
        user_info = jsonb_build_object(
          'uid', NEW.user_id,
          'displayName', coalesce(profile.display_name, ''),
          'photoURL', profile.avatar_url
        )
  where group_id = NEW.group_id and user_id = NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists trigger_update_group_leaderboard on public.group_problem_submissions;
create trigger trigger_update_group_leaderboard
  after insert or update on public.group_problem_submissions
  for each row
  execute function public.update_group_leaderboard();

-- Metrics trigger
create or replace function public.increment_num_users()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.app_metrics set value = value + 1 where key = 'num_users';
  return NEW;
end;
$$;

drop trigger if exists trigger_increment_num_users on auth.users;
create trigger trigger_increment_num_users
  after insert on auth.users
  for each row
  execute function public.increment_num_users();
