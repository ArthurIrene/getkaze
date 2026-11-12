-- More reserved names (D-062): mail and sending subdomains Altavision uses or may use.
-- Additive only; names already present are left as they are. Names starting with "_"
-- (e.g. _dmarc) can never be slugs anyway: the slug format allows only a-z, 0-9 and "-".
insert into public.reserved_slugs (slug, reason) values
  ('www', 'D-062'), ('send', 'mail sending'), ('resend', 'mail sending'), ('zmail', 'mail'),
  ('mail', 'D-062'), ('webmail', 'mail'), ('email', 'mail'), ('smtp', 'mail'), ('mx', 'mail'),
  ('autodiscover', 'mail')
on conflict (slug) do nothing;
