-- Editor part 2 (specs/editor-rooms-look.md). Additive only (D-021).
-- Look & colors: colour set (day, night, auto) and an accent from the safe palette
-- (ids kept equal to packages/core accentPalette by pnpm db:check).
create or replace function app.is_look(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(j) = 'object'
    and (not j ? 'color_set' or j ->> 'color_set' in ('day', 'night', 'auto'))
    and (not j ? 'accent' or j ->> 'accent' in ('forest', 'clay', 'ochre', 'slate', 'bark'))
    and not exists (select 1 from jsonb_object_keys(j) k where k not in ('color_set', 'accent'))
$$;
grant execute on function app.is_look(jsonb) to authenticated;

alter table public.site_settings
  add column if not exists look jsonb not null default '{}'::jsonb check (app.is_look(look));

-- Translation "checked" marks per field of a catalog item (D-048), e.g. {"name": ["rw"]}.
alter table public.catalog_items
  add column if not exists translations_checked jsonb not null default '{}'::jsonb
    check (jsonb_typeof(translations_checked) = 'object');

-- ---------- Guest site: settings carry the look ----------
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
