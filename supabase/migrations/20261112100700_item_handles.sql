-- Readable handles for catalog items (room anchors "#room-garden-double", booking
-- "?room=garden-double"), so guest URLs never show database ids. Additive only.
alter table public.catalog_items add column handle text
  check (handle is null or (handle ~ '^[a-z0-9](-?[a-z0-9])*$' and char_length(handle) between 1 and 60));
create unique index catalog_items_handle_unique on public.catalog_items (business_id, kind, handle) where handle is not null;

-- The public site now also returns each item's handle (the field list in
-- specs/row-level-security.md and public_site_fields.test.sql is updated with it).
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
