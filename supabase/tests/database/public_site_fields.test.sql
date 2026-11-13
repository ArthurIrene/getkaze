-- get_published_site returns exactly the agreed fields (specs/row-level-security.md,
-- "Fields returned"). Fails if any field is added, removed or renamed, so no
-- personal field (such as an owner email) can slip in. Runs with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

-- The function itself: security definer, empty search_path.
select ok((select prosecdef from pg_proc where oid = 'public.get_published_site(text, text)'::regprocedure), 'get_published_site is security definer');
select is((select proconfig from pg_proc where oid = 'public.get_published_site(text, text)'::regprocedure), array['search_path=""'], 'get_published_site has search_path = ''''');
select ok((select prosecdef from pg_proc where oid = 'public.list_published_slugs()'::regprocedure), 'list_published_slugs is security definer');
select is((select proconfig from pg_proc where oid = 'public.list_published_slugs()'::regprocedure), array['search_path=""'], 'list_published_slugs has search_path = ''''');

-- A fully filled business, with an owner whose email must never appear.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'private-owner@example.test');
insert into public.businesses (id, slug, custom_domain, name, legal_name, preset, style, status, languages) values
  ('00000000-0000-0000-0000-00000000000a', 'fields-a', 'fields.example.test', 'Fields A', 'Fields A Ltd', 'hotel_lodge', 'lodge', 'active', array['en', 'rw']);
insert into public.memberships (business_id, user_id, roles, status) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', array['owner'], 'active');
insert into public.site_settings (business_id, contacts, location, hero, booking_payments, rooms_line, seo_description, published_at) values
  ('00000000-0000-0000-0000-00000000000a',
   '{"phone": "+250 700 000 001", "whatsapp": "+250 700 000 002", "email": "hello@fields.example.test", "private_note": "never public"}',
   '{"map_url": "https://maps.example.test"}', '{"title": {"en": "Welcome"}}', array['lodge'],
   '{"en": "two rooms"}', '{"en": "A lodge"}', now());
insert into public.business_modules (business_id, module_id, enabled) values ('00000000-0000-0000-0000-00000000000a', 'menu', true);
insert into public.catalog_items (id, business_id, kind, name, price_rwf, price_usd, max_guests) values
  ('00000000-0000-0000-0000-0000000001a0', '00000000-0000-0000-0000-00000000000a', 'room_type', '{"en": "Room"}', 1, 1, 1);
insert into public.media (business_id, item_id, place, alt) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000001a0', 'room', '{"en": "Photo"}');

create temp table site on commit drop as select public.get_published_site('fields-a') as doc;

select is(
  (select array_agg(k order by k collate "C") from site, jsonb_object_keys(doc) k),
  array['business', 'items', 'media', 'modulesOn', 'settings'],
  'top-level fields'
);
select is(
  (select array_agg(k order by k collate "C") from site, jsonb_object_keys(doc -> 'business') k),
  array['defaultCurrency', 'id', 'languages', 'legalName', 'name', 'preset', 'slug', 'style', 'template'],
  'business fields'
);
select is(
  (select array_agg(k order by k collate "C") from site, jsonb_object_keys(doc -> 'settings') k),
  array['bookingPayments', 'contacts', 'dining', 'facts', 'hero', 'host', 'hours', 'location', 'look', 'moments', 'payment', 'publishedAt', 'reviews', 'roomsLine', 'sections', 'seoDescription', 'stay'],
  'settings fields'
);
select is(
  (select array_agg(k order by k collate "C") from site, jsonb_object_keys(doc -> 'settings' -> 'contacts') k),
  array['email', 'phone', 'whatsapp'],
  'contact fields: only the business''s phone, WhatsApp and email (other contact keys are dropped)'
);
select is(
  (select array_agg(k order by k collate "C") from site, jsonb_object_keys(doc -> 'items' -> 0) k),
  array['amenities', 'arrange', 'distance', 'handle', 'icon', 'id', 'kind', 'line', 'maxGuests', 'name', 'position', 'priceRwf', 'priceUsd'],
  'item fields'
);
select is(
  (select array_agg(k order by k collate "C") from site, jsonb_object_keys(doc -> 'media' -> 0) k),
  array['alt', 'format', 'height', 'id', 'itemId', 'path', 'place', 'position', 'width'],
  'media fields'
);
select ok((select doc::text not like '%private-owner@example.test%' and doc::text not like '%never public%' from site),
  'no owner email and no unlisted contact field anywhere in the output');

select * from finish();
rollback;
