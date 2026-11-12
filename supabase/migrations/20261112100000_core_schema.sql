-- Core schema for the website kit (specs/core-data.md).
-- Additive only (D-021): never drop or rename; fixes go in new migrations.
-- No guest personal data anywhere (D-033, D-049).

create schema if not exists app;
comment on schema app is 'Private helpers for row-level security and triggers. Not exposed by the API.';
revoke all on schema app from public;

-- ---------- Helpers ----------

-- A text the owner writes per language (LocalizedText): {"en": "...", "rw": "...", "fr": "..."}.
-- English is required and non-empty; only known languages; every value a string.
create or replace function app.is_localized(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select j is not null
    and jsonb_typeof(j) = 'object'
    and j ? 'en'
    and jsonb_typeof(j -> 'en') = 'string'
    and length(btrim(j ->> 'en')) > 0
    and not exists (
      select 1 from jsonb_each(j) e
      where e.key not in ('en', 'rw', 'fr') or jsonb_typeof(e.value) <> 'string'
    )
$$;

-- Optional LocalizedText: null, or a valid one.
create or replace function app.is_localized_or_null(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select j is null or j = 'null'::jsonb or app.is_localized(j)
$$;

create or replace function app.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Reserved slugs (D-062) ----------
create table public.reserved_slugs (
  slug text primary key check (slug ~ '^[a-z0-9_-]+$'),
  reason text not null
);
comment on table public.reserved_slugs is 'Names that can never be a business slug (D-062). Kept equal to packages/core reservedSlugs by a test.';

insert into public.reserved_slugs (slug, reason) values
  ('www', 'D-062'), ('mail', 'D-062'), ('admin', 'D-062'), ('app', 'D-062'), ('api', 'D-062'), ('kaze', 'D-062: our screens'),
  ('s', 'fallback path'), ('auth', 'platform'), ('login', 'platform'), ('owner', 'platform'), ('static', 'platform'),
  ('cdn', 'technical'), ('assets', 'technical'), ('smtp', 'mail'), ('imap', 'mail'), ('pop', 'mail'), ('webmail', 'mail'),
  ('ftp', 'technical'), ('ns1', 'dns'), ('ns2', 'dns'), ('autodiscover', 'mail'), ('autoconfig', 'mail'), ('_dmarc', 'dns'),
  ('status', 'platform'), ('support', 'platform'), ('help', 'platform'), ('docs', 'platform'), ('blog', 'platform');

-- ---------- Businesses ----------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9](-?[a-z0-9])*$' and char_length(slug) between 3 and 40),
  custom_domain text unique
    check (custom_domain is null or (custom_domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' and char_length(custom_domain) <= 253)),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  legal_name text not null default '' check (char_length(legal_name) <= 120),
  preset text not null check (preset in ('hotel_lodge', 'restaurant_bar')),
  style text not null check (style in ('lodge', 'town_hotel', 'guesthouse', 'restaurant_first', 'bar_first')),
  template text not null default 'field-journal' check (template in ('field-journal')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  default_currency text not null default 'rwf' check (default_currency in ('rwf', 'usd')),
  languages text[] not null default array['en']
    check ('en' = any (languages) and languages <@ array['en', 'rw', 'fr']),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_style_fits_preset check (
    (preset = 'hotel_lodge' and style in ('lodge', 'town_hotel', 'guesthouse'))
    or (preset = 'restaurant_bar' and style in ('restaurant_first', 'bar_first'))
  )
);
comment on table public.businesses is 'One row per client business. id is the business_id of every other business row.';

create or replace function app.check_slug_not_reserved() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'slug "%" is reserved', new.slug using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger businesses_slug_not_reserved before insert or update of slug on public.businesses
  for each row execute function app.check_slug_not_reserved();
create trigger businesses_touch before update on public.businesses
  for each row execute function app.touch_updated_at();

-- ---------- Site settings (published website content, one row per business) ----------
create table public.site_settings (
  business_id uuid primary key references public.businesses (id) on delete restrict,
  contacts jsonb not null default '{}'::jsonb check (jsonb_typeof(contacts) = 'object'),
  location jsonb not null default '{}'::jsonb check (jsonb_typeof(location) = 'object'),
  hours jsonb not null default '[]'::jsonb check (jsonb_typeof(hours) = 'array'),
  payment jsonb not null default '[]'::jsonb check (jsonb_typeof(payment) = 'array'),
  booking_payments text[] not null default '{}'
    check (booking_payments <@ array['lodge', 'momo', 'airtel', 'bank']),
  stay jsonb not null default '{}'::jsonb check (jsonb_typeof(stay) = 'object'),
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  hero jsonb not null default '{}'::jsonb check (jsonb_typeof(hero) = 'object'),
  facts jsonb not null default '[]'::jsonb check (jsonb_typeof(facts) = 'array'),
  moments jsonb not null default '[]'::jsonb check (jsonb_typeof(moments) = 'array'),
  dining jsonb not null default '{}'::jsonb check (jsonb_typeof(dining) = 'object'),
  host jsonb not null default '{}'::jsonb check (jsonb_typeof(host) = 'object'),
  reviews jsonb not null default '{}'::jsonb check (jsonb_typeof(reviews) = 'object'),
  rooms_line jsonb check (app.is_localized_or_null(rooms_line)),
  seo_description jsonb check (app.is_localized_or_null(seo_description)),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  -- A published site needs the texts every page shows.
  constraint site_settings_published_complete check (
    published_at is null or (
      app.is_localized(hero -> 'title')
      and contacts ? 'phone' and contacts ? 'whatsapp'
      and location ? 'map_url'
    )
  )
);
comment on table public.site_settings is 'Business website content. Contacts are the business''s own published details, never guest data.';
create trigger site_settings_touch before update on public.site_settings
  for each row execute function app.touch_updated_at();

-- ---------- Modules and switches (D-017, D-021) ----------
create table public.modules (
  id text primary key check (id ~ '^[a-z_]+$'),
  name jsonb not null check (app.is_localized(name)),
  presets text[] not null check (presets <@ array['hotel_lodge', 'restaurant_bar'])
);
insert into public.modules (id, name, presets) values
  ('menu', '{"en": "Menu", "rw": "Ibiribwa n''ibinyobwa"}', array['hotel_lodge', 'restaurant_bar']),
  ('ordering', '{"en": "Menu + WhatsApp orders", "rw": "Gutumiza kuri WhatsApp"}', array['hotel_lodge', 'restaurant_bar']),
  ('booking', '{"en": "Booking system", "rw": "Gufata ibyumba"}', array['hotel_lodge']);

create table public.business_modules (
  business_id uuid not null references public.businesses (id) on delete restrict,
  module_id text not null references public.modules (id),
  enabled boolean not null default false,
  changed_at timestamptz not null default now(),
  changed_by uuid,
  primary key (business_id, module_id)
);

-- ---------- Roles as permission settings (rule 8, ROLES.md §2) ----------
create table public.role_permissions (
  preset text not null check (preset in ('hotel_lodge', 'restaurant_bar')),
  role text not null check (role in ('owner', 'manager', 'receptionist', 'housekeeping', 'waiter', 'kitchen', 'bar')),
  permission text not null check (permission in ('site.view', 'content.edit', 'modules.view', 'members.view', 'stats.view', 'changes.view')),
  primary key (preset, role, permission)
);
insert into public.role_permissions (preset, role, permission)
select p.preset, perm.role, perm.permission
from (values ('hotel_lodge'), ('restaurant_bar')) p (preset)
cross join (values
  ('owner', 'site.view'), ('owner', 'content.edit'), ('owner', 'modules.view'), ('owner', 'members.view'), ('owner', 'stats.view'), ('owner', 'changes.view'),
  ('manager', 'site.view'), ('manager', 'content.edit'), ('manager', 'modules.view'), ('manager', 'stats.view')
) as perm (role, permission);
-- Front-desk and service roles only see the site for now (their screens come in P2/P3).
insert into public.role_permissions (preset, role, permission) values
  ('hotel_lodge', 'receptionist', 'site.view'), ('hotel_lodge', 'housekeeping', 'site.view'),
  ('restaurant_bar', 'waiter', 'site.view'), ('restaurant_bar', 'kitchen', 'site.view'), ('restaurant_bar', 'bar', 'site.view');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  roles text[] not null
    check (cardinality(roles) > 0 and roles <@ array['owner', 'manager', 'receptionist', 'housekeeping', 'waiter', 'kitchen', 'bar']),
  status text not null default 'invited' check (status in ('invited', 'active', 'disabled')),
  invited_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, user_id)
);
comment on table public.memberships is 'Owner and staff accounts per business (allowed after registration, D-033). Never guests.';
create trigger memberships_touch before update on public.memberships
  for each row execute function app.touch_updated_at();

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.platform_admins is 'Us. Written only with SQL by a database owner; admin rights also need aal2 (D-060).';

-- ---------- Catalog items: room types, dishes, drinks, activities, services ----------
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  kind text not null check (kind in ('room_type', 'dish', 'drink', 'activity', 'service')),
  position integer not null default 0,
  visible boolean not null default true,
  name jsonb not null check (app.is_localized(name)),
  line jsonb check (app.is_localized_or_null(line)),
  price_rwf integer check (price_rwf is null or price_rwf >= 0),
  price_usd numeric(10, 2) check (price_usd is null or price_usd >= 0),
  max_guests integer check (max_guests is null or max_guests between 1 and 50),
  units integer check (units is null or units >= 0),
  amenities jsonb not null default '[]'::jsonb check (jsonb_typeof(amenities) = 'array'),
  icon text check (icon is null or icon ~ '^[a-z_]+$'),
  distance jsonb check (app.is_localized_or_null(distance)),
  arrange boolean not null default false,
  group_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, id),
  -- Both prices typed by the owner, or neither (D-023).
  constraint catalog_items_both_prices check ((price_rwf is null) = (price_usd is null)),
  constraint catalog_items_room_type_complete check (kind <> 'room_type' or (max_guests is not null and price_rwf is not null))
);
create trigger catalog_items_touch before update on public.catalog_items
  for each row execute function app.touch_updated_at();

-- ---------- Media ----------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  item_id uuid,
  place text not null check (place in ('hero', 'room', 'dining', 'dish', 'host', 'gallery')),
  position integer not null default 0,
  storage_path text check (storage_path is null or char_length(storage_path) <= 300),
  alt jsonb not null check (app.is_localized(alt)),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  bytes integer check (bytes is null or bytes > 0),
  created_at timestamptz not null default now(),
  -- A photo can only belong to an item of the same business.
  foreign key (business_id, item_id) references public.catalog_items (business_id, id)
);

-- ---------- Click stats (written from Batch 3). No IP, no user agent, no guest data. ----------
create table public.click_events (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete restrict,
  kind text not null check (kind in ('call', 'whatsapp', 'directions', 'booking_request')),
  page text not null check (char_length(page) <= 100),
  occurred_at timestamptz not null default now()
);

-- ---------- Content change log (D-011, D-024). Append-only. ----------
create table public.content_changes (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses (id) on delete restrict,
  actor_id uuid,
  actor_kind text not null check (actor_kind in ('owner', 'staff', 'platform_admin', 'system')),
  table_name text not null,
  row_id text not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changes jsonb not null,
  at timestamptz not null default now()
);

-- ---------- Support access, visible to the owner (ROLES.md §5, D-034) ----------
create table public.support_access (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  admin_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 5 and 200),
  started_at timestamptz not null default now(),
  ended_at timestamptz check (ended_at is null or ended_at >= started_at)
);

-- ---------- Indexes ----------
create index on public.business_modules (business_id);
create index on public.memberships (business_id);
create index on public.memberships (user_id);
create index on public.catalog_items (business_id, kind, position);
create index on public.media (business_id);
create index on public.media (item_id);
create index on public.click_events (business_id, occurred_at);
create index on public.content_changes (business_id, at desc);
create index on public.support_access (business_id, started_at desc);
