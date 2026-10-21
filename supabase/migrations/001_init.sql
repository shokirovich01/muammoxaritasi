
-- MuammoXaritasi: boshlang'ich migratsiya
-- Supabase SQL Editor'da faqat bir marta ishga tushiring.

-- 1. JADVALLAR

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default ''
    check (char_length(full_name) <= 100),
  phone text check (phone is null or char_length(phone) <= 20),
  role text not null default 'user'
    check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null
    check (char_length(description) between 10 and 2000),
  category text not null
    check (category in ('chuqur', 'yoritish', 'chiqindi', 'suv', 'boshqa')),
  status text not null default 'yangi'
    check (status in (
      'yangi', 'korib_chiqilmoqda', 'jarayonda',
      'hal_qilindi', 'rad_etildi'
    )),
  lat double precision not null check (lat between 37 and 46),
  lng double precision not null check (lng between 55 and 74),
  region text,
  photos text[] not null default '{}'
    check (cardinality(photos) <= 3),
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports(status);
create index reports_user_idx on public.reports(user_id);
create index reports_created_idx on public.reports(created_at desc);

create table public.confirmations (
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create table public.status_history (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.reports(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx
  on public.notifications(user_id, is_read);

-- 2. ADMINISTRATORNI TEKSHIRISH

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- 3. YANGI FOYDALANUVCHI UCHUN PROFIL

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data->>'full_name', 100), '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4. FOYDALANUVCHI ROLINI HIMOYALASH

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Rolni o''zgartirish taqiqlangan';
  end if;

  return new;
end;
$$;

create trigger guard_profile
before update on public.profiles
for each row execute function public.guard_profile_update();

-- 5. MUAMMO HOLATI VA EGASINI HIMOYALASH

create or replace function public.guard_report_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.status is distinct from old.status
       or new.user_id is distinct from old.user_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Holatni faqat administrator o''zgartira oladi';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_report
before update on public.reports
for each row execute function public.guard_report_update();

-- 6. HOLAT O'ZGARGANDA TARIX VA BILDIRISHNOMA

create or replace function public.on_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  label text;
begin
  if new.status is distinct from old.status then
    insert into public.status_history (
      report_id, old_status, new_status, changed_by
    )
    values (new.id, old.status, new.status, auth.uid());

    label := case new.status
      when 'yangi' then 'Yangi'
      when 'korib_chiqilmoqda' then 'Ko''rib chiqilmoqda'
      when 'jarayonda' then 'Jarayonda'
      when 'hal_qilindi' then 'Hal qilindi'
      else 'Rad etildi'
    end;

    insert into public.notifications (user_id, report_id, message)
    values (
      new.user_id,
      new.id,
      '"' || new.title || '" muammosi holati: ' || label
    );
  end if;

  return new;
end;
$$;

create trigger report_status_change
after update on public.reports
for each row execute function public.on_report_status_change();

-- 7. YANGI MUAMMO TARIXINI YOZISH

create or replace function public.on_report_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.status_history (
    report_id, old_status, new_status, changed_by
  )
  values (new.id, null, new.status, new.user_id);

  return new;
end;
$$;

create trigger report_insert
after insert on public.reports
for each row execute function public.on_report_insert();

-- 8. TASDIQLASH UCHUN BILDIRISHNOMA

create or replace function public.on_confirmation_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  report_title text;
begin
  select user_id, title
  into owner_id, report_title
  from public.reports
  where id = new.report_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, report_id, message)
    values (
      owner_id,
      new.report_id,
      '"' || report_title ||
      '" muammongiz boshqa foydalanuvchi tomonidan tasdiqlandi.'
    );
  end if;

  return new;
end;
$$;

create trigger confirmation_insert
after insert on public.confirmations
for each row execute function public.on_confirmation_insert();

-- 9. ROW LEVEL SECURITY (RLS)

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.confirmations enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;

-- Profillar
create policy profiles_select
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy profiles_update
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Muammolar
create policy reports_select
on public.reports for select
using (true);

create policy reports_insert
on public.reports for insert to authenticated
with check (auth.uid() = user_id and status = 'yangi');

create policy reports_update_owner
on public.reports for update to authenticated
using (auth.uid() = user_id and status = 'yangi')
with check (auth.uid() = user_id);

create policy reports_update_admin
on public.reports for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy reports_delete
on public.reports for delete to authenticated
using (
  (auth.uid() = user_id and status = 'yangi')
  or public.is_admin()
);

-- Tasdiqlashlar
create policy conf_select
on public.confirmations for select
using (true);

create policy conf_insert
on public.confirmations for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.reports r
    where r.id = report_id
      and r.user_id <> auth.uid()
  )
);

create policy conf_delete
on public.confirmations for delete to authenticated
using (auth.uid() = user_id);

-- Holat tarixi
create policy history_select
on public.status_history for select
using (true);

-- Bildirishnomalar
create policy notif_select
on public.notifications for select to authenticated
using (auth.uid() = user_id);

create policy notif_update
on public.notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy notif_delete
on public.notifications for delete to authenticated
using (auth.uid() = user_id);

-- 10. RASMLAR UCHUN STORAGE

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'report-photos',
  'report-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy photos_select
on storage.objects for select
using (bucket_id = 'report-photos');

create policy photos_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'report-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy photos_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'report-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);
