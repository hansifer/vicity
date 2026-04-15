create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  is_premium boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  point geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  location_name text,
  activity_description text not null,
  posted_at timestamptz not null default timezone('utc', now()),
  activity_starts_at timestamptz not null default timezone('utc', now()),
  activity_duration_minutes integer not null default 60,
  activity_radius_meters integer not null default 250,
  labels text[] not null default '{}',
  photo_urls text[] not null default '{}',
  moderation_status text not null default 'approved' check (
    moderation_status in ('approved', 'flagged', 'rejected')
  ),
  moderation_notes text,
  moderation_payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists posts_point_idx on public.posts using gist (point);
create index if not exists posts_start_idx on public.posts (activity_starts_at desc);

alter table public.posts enable row level security;

create policy "Anyone can read approved posts"
on public.posts
for select
to anon, authenticated
using (moderation_status = 'approved');

create policy "Users can read their own posts"
on public.posts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own posts"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.get_location_feed(
  p_lat double precision,
  p_lng double precision,
  p_window_start timestamptz default timezone('utc', now()) - interval '1 hour',
  p_window_end timestamptz default timezone('utc', now()) + interval '12 hours',
  p_labels text[] default null
)
returns table (
  id uuid,
  lat double precision,
  lng double precision,
  location_name text,
  activity_description text,
  labels text[],
  photo_urls text[],
  posted_at timestamptz,
  activity_starts_at timestamptz,
  activity_duration_minutes integer,
  activity_ends_at timestamptz,
  activity_radius_meters integer,
  distance_meters integer
)
language sql
security definer
set search_path = public
as $$
  with viewer as (
    select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as location
  )
  select
    posts.id,
    posts.lat,
    posts.lng,
    posts.location_name,
    posts.activity_description,
    posts.labels,
    posts.photo_urls,
    posts.posted_at,
    posts.activity_starts_at,
    posts.activity_duration_minutes,
    posts.activity_starts_at + make_interval(mins => posts.activity_duration_minutes) as activity_ends_at,
    posts.activity_radius_meters,
    round(st_distance(posts.point, viewer.location))::integer as distance_meters
  from public.posts
  cross join viewer
  where posts.moderation_status = 'approved'
    and st_dwithin(posts.point, viewer.location, posts.activity_radius_meters)
    and tstzrange(
      posts.activity_starts_at,
      posts.activity_starts_at + make_interval(mins => posts.activity_duration_minutes),
      '[)'
    ) && tstzrange(p_window_start, p_window_end, '[)')
    and (
      p_labels is null
      or array_length(p_labels, 1) is null
      or posts.labels && p_labels
    )
  order by posts.posted_at desc, distance_meters asc, posts.activity_starts_at asc;
$$;

grant execute on function public.get_location_feed(
  double precision,
  double precision,
  timestamptz,
  timestamptz,
  text[]
) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-photos',
  'post-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Public can read post photos"
on storage.objects
for select
to public
using (bucket_id = 'post-photos');

create policy "Authenticated users can upload post photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users can delete their own post photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'post-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
