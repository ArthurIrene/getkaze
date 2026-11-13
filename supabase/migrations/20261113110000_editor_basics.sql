-- Editor part 1 (specs/editor-basics.md). Additive only (D-021).
-- Owners may change only their business's name, languages and default currency
-- (approved point 5); every other business column stays admin-only, enforced here.

-- ---------- businesses: owner updates, three columns only ----------
create policy businesses_update_owner on public.businesses for update to authenticated
  using (app.has_permission(id, 'content.edit'))
  with check (app.has_permission(id, 'content.edit'));

-- Security definer: it must run for every writer (the service role cannot call app helpers itself);
-- it only reads the request's own claims.
create or replace function app.businesses_owner_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Only signed-in users who are not platform admins are limited (migrations, seeds and the service role are not).
  if (select auth.role()) = 'authenticated' and not app.is_platform_admin()
     and (new.id, new.slug, new.custom_domain, new.legal_name, new.preset, new.style, new.template, new.status, new.created_at)
         is distinct from
         (old.id, old.slug, old.custom_domain, old.legal_name, old.preset, old.style, old.template, old.status, old.created_at) then
    raise exception 'owners may change only the name, languages and default currency' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function app.businesses_owner_columns() from public;
create trigger businesses_owner_columns before update on public.businesses
  for each row execute function app.businesses_owner_columns();

-- ---------- Translation "checked" marks per field (D-048), e.g. {"location.area": ["rw"]} ----------
alter table public.site_settings
  add column if not exists translations_checked jsonb not null default '{}'::jsonb
    check (jsonb_typeof(translations_checked) = 'object');

-- ---------- Photo file type (the three widths share it) ----------
alter table public.media
  add column if not exists format text not null default 'webp' check (format in ('webp', 'jpg'));

-- ---------- Guest site: photos carry their file type (the 'format' field) ----------
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
