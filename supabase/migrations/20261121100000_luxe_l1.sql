-- Luxe template data (specs/luxe-template.md L1). Additive only (D-021).
-- Template id `luxe`, dining groups, extra catalog and settings fields, media
-- place `activity`, photo cap 120. Guests still read only through get_published_site.
-- No stay / plan / basket table (D-033).

-- ---------- Helpers ----------
create or replace function app.is_localized_list(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select j is null or j = 'null'::jsonb or (
    jsonb_typeof(j) = 'array'
    and not exists (
      select 1 from jsonb_array_elements(j) e
      where not app.is_localized(e)
    )
  )
$$;

create or replace function app.is_handle_list(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select j is not null
    and jsonb_typeof(j) = 'array'
    and not exists (
      select 1 from jsonb_array_elements_text(j) h
      where h !~ '^[a-z0-9](-?[a-z0-9])*$' or char_length(h) not between 1 and 60
    )
$$;

grant execute on function app.is_localized_list(jsonb), app.is_handle_list(jsonb) to authenticated, service_role;

-- ---------- Template id (D-063) ----------
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'businesses' and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%field-journal%'
  loop
    execute format('alter table public.businesses drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.businesses
  add constraint businesses_template_check check (template in ('field-journal', 'luxe'));

-- ---------- Dining groups ----------
create table public.catalog_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  kind text not null check (kind in ('dish', 'drink')),
  handle text not null
    check (handle ~ '^[a-z0-9](-?[a-z0-9])*$' and char_length(handle) between 1 and 60),
  name jsonb not null check (app.is_localized(name)),
  position integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  unique (business_id, kind, handle)
);
comment on table public.catalog_groups is 'Menu groups (dishes or drinks) for a business. Isolation by business_id.';
create index on public.catalog_groups (business_id, kind, position);
create trigger catalog_groups_touch before update on public.catalog_groups
  for each row execute function app.touch_updated_at();
create trigger catalog_groups_keep_business before update on public.catalog_groups
  for each row execute function app.keep_business_id();
create trigger catalog_groups_log after insert or update or delete on public.catalog_groups
  for each row execute function app.log_change();

alter table public.catalog_groups enable row level security;
alter table public.catalog_groups force row level security;
grant select, insert, update, delete on public.catalog_groups to authenticated;
create policy catalog_groups_select on public.catalog_groups for select to authenticated
  using (app.is_member(business_id) or app.is_platform_admin());
create policy catalog_groups_insert on public.catalog_groups for insert to authenticated
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());
create policy catalog_groups_update on public.catalog_groups for update to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin())
  with check (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());
create policy catalog_groups_delete on public.catalog_groups for delete to authenticated
  using (app.has_permission(business_id, 'content.edit') or app.is_platform_admin());

-- Items already had group_id; pin it to a group of the same business.
alter table public.catalog_items
  add constraint catalog_items_group_fk
  foreign key (business_id, group_id) references public.catalog_groups (business_id, id);

-- ---------- Extra catalog fields ----------
alter table public.catalog_items
  add column if not exists body jsonb check (app.is_localized_or_null(body)),
  add column if not exists size jsonb check (app.is_localized_or_null(size)),
  add column if not exists duration jsonb check (app.is_localized_or_null(duration)),
  add column if not exists category text,
  add column if not exists what_to_bring jsonb check (app.is_localized_list(what_to_bring)),
  add column if not exists arranged_by text,
  add column if not exists good_to_know jsonb check (app.is_localized_or_null(good_to_know)),
  add column if not exists signature boolean not null default false,
  add column if not exists airport boolean;

alter table public.catalog_items
  add constraint catalog_items_category_fits_kind check (
    (kind = 'activity' and (category is null or category in ('wildlife', 'hiking', 'culture')))
    or (kind <> 'activity' and category is null)
  ),
  add constraint catalog_items_arranged_by_fits_kind check (
    arranged_by is null or (kind = 'activity' and arranged_by in ('own_guides', 'licensed_partner'))
  ),
  add constraint catalog_items_airport_fits_kind check (
    airport is null or kind = 'service'
  ),
  add constraint catalog_items_group_fits_kind check (
    group_id is null or kind in ('dish', 'drink')
  );

-- ---------- Media place: activity ----------
do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'media' and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%gallery%'
      and pg_get_constraintdef(c.oid) like '%place%'
  loop
    execute format('alter table public.media drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.media
  add constraint media_place_check check (place in ('hero', 'room', 'dining', 'dish', 'host', 'gallery', 'activity'));

-- ---------- Site settings extras ----------
alter table public.site_settings
  add column if not exists featured_room_handles jsonb not null default '[]'::jsonb
    check (app.is_handle_list(featured_room_handles)),
  add column if not exists intro jsonb check (app.is_localized_or_null(intro)),
  add column if not exists closing jsonb check (app.is_localized_or_null(closing));

-- ---------- Photo cap 120 (core photoLimits; pnpm db:check keeps them equal) ----------
create or replace function app.media_limits() returns jsonb
language sql immutable set search_path = '' as $$
  select '{"photos": 120, "files_per_photo": 3, "file_bytes": 307200, "widths": [480, 960, 1440]}'::jsonb
$$;

-- ---------- Guest site: groups, extra item and settings fields ----------
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
      'featuredRoomHandles', s.featured_room_handles,
      'intro', s.intro,
      'closing', s.closing,
      'publishedAt', s.published_at
    ),
    'modulesOn', coalesce((
      select jsonb_agg(m.module_id order by m.module_id)
      from public.business_modules m
      where m.business_id = b.id and m.enabled
    ), '[]'::jsonb),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id,
        'handle', g.handle,
        'kind', g.kind,
        'position', g.position,
        'name', g.name
      ) order by g.kind, g.position, g.id)
      from public.catalog_groups g
      where g.business_id = b.id and g.visible
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'handle', i.handle,
        'kind', i.kind,
        'position', i.position,
        'name', i.name,
        'line', i.line,
        'body', i.body,
        'size', i.size,
        'duration', i.duration,
        'category', i.category,
        'whatToBring', i.what_to_bring,
        'arrangedBy', i.arranged_by,
        'goodToKnow', i.good_to_know,
        'signature', i.signature,
        'airport', i.airport,
        'groupId', i.group_id,
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
