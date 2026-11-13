-- Demo photos (specs/demo-photos.md). Additive only (D-021).
-- media.source: 'storage' (uploaded by an owner, Supabase Storage) or 'static' (files
-- bundled with the app under /demo-photos/, for seed data only). Generic: any seed may
-- use it; no client-specific code. Owners can only ever create 'storage' photos.
-- media.credit: the public credit of an openly licensed photo (title, photographer
-- name, source link, licence). Only public names, links and licences; no personal data.

create or replace function app.is_credit(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select j is null or (
    jsonb_typeof(j) = 'object'
    and jsonb_typeof(j -> 'title') = 'string' and char_length(j ->> 'title') between 1 and 200
    and jsonb_typeof(j -> 'author') = 'string' and char_length(j ->> 'author') between 1 and 120
    and jsonb_typeof(j -> 'source_url') = 'string' and (j ->> 'source_url') ~ '^https://\S+$' and char_length(j ->> 'source_url') <= 400
    and (j ->> 'licence') in ('cc0', 'pdm', 'cc-by-2.0', 'cc-by-2.5', 'cc-by-3.0', 'cc-by-4.0')
    and (not j ? 'licence_url' or ((j ->> 'licence_url') ~ '^https://\S+$' and char_length(j ->> 'licence_url') <= 300))
    and not exists (select 1 from jsonb_object_keys(j) k where k not in ('title', 'author', 'source_url', 'licence', 'licence_url'))
  )
$$;
grant execute on function app.is_credit(jsonb) to authenticated;

alter table public.media
  add column if not exists source text not null default 'storage' check (source in ('storage', 'static'));
alter table public.media
  add column if not exists credit jsonb check (app.is_credit(credit));
comment on column public.media.source is 'storage: uploaded (Supabase Storage). static: files bundled with the app, written only by migrations and seed data.';
comment on column public.media.credit is 'Public credit of an openly licensed photo: title, photographer name, source link, licence. No personal data.';

-- Photo rows: storage photos live in their business folder; static photos under demo-photos/<name>.
-- 'static' is seed-only: any request with a JWT (anon, authenticated, service_role) is refused.
create or replace function app.check_media_row() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.source = 'static' or (tg_op = 'UPDATE' and old.source = 'static') then
    if (select auth.role()) is not null then
      raise exception 'static photos come only from migrations and seed data' using errcode = '42501';
    end if;
    if new.storage_path is null or new.storage_path !~ '^demo-photos/[a-z0-9](-?[a-z0-9])*$' then
      raise exception 'a static photo lives under demo-photos/<name>' using errcode = 'check_violation';
    end if;
  elsif new.storage_path is not null
     and new.storage_path !~ ('^' || new.business_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
    raise exception 'a photo must be stored in its own business folder' using errcode = 'check_violation';
  end if;
  if new.bytes is not null and new.bytes > (app.media_limits() ->> 'file_bytes')::int * (app.media_limits() ->> 'files_per_photo')::int then
    raise exception 'photo is too large' using errcode = 'check_violation';
  end if;
  if tg_op = 'INSERT'
     and (select count(*) from public.media m where m.business_id = new.business_id) >= (app.media_limits() ->> 'photos')::int then
    raise exception 'at most % photos per business', app.media_limits() ->> 'photos' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function app.check_media_row() from public;

drop trigger if exists media_check on public.media;
create trigger media_check before insert or update of storage_path, bytes, business_id, source on public.media
  for each row execute function app.check_media_row();

-- ---------- Static photos inside site_settings JSON (hero, life strip, dining, host) ----------
-- The same rule for photos stored in the settings JSON: a request with a JWT may keep
-- what the seed wrote but never add or change a static photo there.
create or replace function app.json_has_static(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_path_exists(j, 'strict $.**.source ? (@ == "static")'), false)
$$;

create or replace function app.site_settings_static_photos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) is not null and (
       (app.json_has_static(new.hero) and new.hero is distinct from old.hero)
    or (app.json_has_static(new.moments) and new.moments is distinct from old.moments)
    or (app.json_has_static(new.dining) and new.dining is distinct from old.dining)
    or (app.json_has_static(new.host) and new.host is distinct from old.host)
  ) then
    raise exception 'static photos come only from migrations and seed data' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function app.site_settings_static_photos() from public;
create trigger site_settings_static_photos before update on public.site_settings
  for each row execute function app.site_settings_static_photos();

create or replace function app.site_settings_static_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) is not null
     and (app.json_has_static(new.hero) or app.json_has_static(new.moments) or app.json_has_static(new.dining) or app.json_has_static(new.host)) then
    raise exception 'static photos come only from migrations and seed data' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function app.site_settings_static_insert() from public;
create trigger site_settings_static_insert before insert on public.site_settings
  for each row execute function app.site_settings_static_insert();

-- ---------- Guest site: photos carry their source and credit ----------
create or replace function public.get_published_site(p_slug text default null, p_host text default null)
returns jsonb
language sql stable security definer set search_path = '' as $$
  with b as (
    select b.*
    from public.businesses b
    join public.site_settings s on s.business_id = b.id
    where b.status = 'active'
      and s.published_at is not null
      and (
        (p_slug is not null and b.slug = lower(p_slug))
        or (p_slug is null and p_host is not null and b.custom_domain = lower(p_host))
      )
    limit 1
  )
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id,
      'slug', b.slug,
      'name', b.name,
      'legalName', b.legal_name,
      'preset', b.preset,
      'style', b.style,
      'template', b.template,
      'defaultCurrency', b.default_currency,
      'languages', to_jsonb(b.languages)
    ),
    'settings', jsonb_build_object(
      'contacts', jsonb_build_object(
        'phone', s.contacts -> 'phone',
        'whatsapp', s.contacts -> 'whatsapp',
        'email', s.contacts -> 'email'
      ),
      'location', s.location,
      'hours', s.hours,
      'payment', s.payment,
      'bookingPayments', to_jsonb(s.booking_payments),
      'stay', s.stay,
      'sections', s.sections,
      'hero', s.hero,
      'facts', s.facts,
      'moments', s.moments,
      'dining', s.dining,
      'host', s.host,
      'reviews', s.reviews,
      'roomsLine', s.rooms_line,
      'seoDescription', s.seo_description,
      'look', s.look,
      'publishedAt', s.published_at
    ),
    'modulesOn', coalesce((
      select jsonb_agg(m.module_id order by m.module_id)
      from public.business_modules m
      where m.business_id = b.id and m.enabled
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'handle', i.handle,
        'kind', i.kind,
        'position', i.position,
        'name', i.name,
        'line', i.line,
        'priceRwf', i.price_rwf,
        'priceUsd', i.price_usd,
        'maxGuests', i.max_guests,
        'amenities', i.amenities,
        'icon', i.icon,
        'distance', i.distance,
        'arrange', i.arrange
      ) order by i.kind, i.position, i.id)
      from public.catalog_items i
      where i.business_id = b.id and i.visible
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', md.id,
        'itemId', md.item_id,
        'place', md.place,
        'position', md.position,
        'path', md.storage_path,
        'format', md.format,
        'source', md.source,
        'credit', md.credit,
        'alt', md.alt,
        'width', md.width,
        'height', md.height
      ) order by md.place, md.position, md.id)
      from public.media md
      where md.business_id = b.id
        and (md.item_id is null or exists (
          select 1 from public.catalog_items i where i.id = md.item_id and i.visible
        ))
    ), '[]'::jsonb)
  )
  from b
  join public.site_settings s on s.business_id = b.id
$$;
