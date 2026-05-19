create table if not exists public.wish_comment_images (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.wish_comments (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique check (char_length(trim(storage_path)) between 1 and 512),
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null check (char_length(trim(mime_type)) between 1 and 120),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_wish_comment_images_comment on public.wish_comment_images (comment_id, sort_order, created_at);

alter table public.wish_comment_images enable row level security;

drop policy if exists "wish_comment_images_select_visible_comment" on public.wish_comment_images;
create policy "wish_comment_images_select_visible_comment"
on public.wish_comment_images
for select
to authenticated
using (
  exists (
    select 1
    from public.wish_comments comment
    where comment.id = comment_id
      and public.can_access_wish(comment.wish_id)
  )
);

drop policy if exists "wish_comment_images_insert_visible_comment" on public.wish_comment_images;
create policy "wish_comment_images_insert_visible_comment"
on public.wish_comment_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.wish_comments comment
    where comment.id = comment_id
      and public.can_access_wish(comment.wish_id)
  )
);

drop policy if exists "wish_comment_images_delete_creator_only" on public.wish_comment_images;
create policy "wish_comment_images_delete_creator_only"
on public.wish_comment_images
for delete
to authenticated
using (created_by = auth.uid());

grant select, insert, delete on table public.wish_comment_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wish-comment-images',
  'wish-comment-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "wish_comment_images_storage_select" on storage.objects;
create policy "wish_comment_images_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wish-comment-images'
  and exists (
    select 1
    from public.wish_comments comment
    where comment.id::text = (storage.foldername(name))[1]
      and public.can_access_wish(comment.wish_id)
  )
);

drop policy if exists "wish_comment_images_storage_insert" on storage.objects;
create policy "wish_comment_images_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wish-comment-images'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.wish_comments comment
    where comment.id::text = (storage.foldername(name))[1]
      and public.can_access_wish(comment.wish_id)
  )
);

drop policy if exists "wish_comment_images_storage_delete" on storage.objects;
create policy "wish_comment_images_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wish-comment-images'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.wish_comments comment
    where comment.id::text = (storage.foldername(name))[1]
      and public.can_access_wish(comment.wish_id)
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wish_comment_images'
  ) then
    alter publication supabase_realtime add table public.wish_comment_images;
  end if;
end
$$;