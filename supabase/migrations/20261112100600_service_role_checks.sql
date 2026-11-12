-- The check constraints call app.is_localized / app.is_localized_or_null as the
-- writing role. The service role (server tooling, tests, the invite path) must be
-- able to evaluate them too. Grants only these two pure functions. Additive only.
grant usage on schema app to service_role;
grant execute on function app.is_localized(jsonb), app.is_localized_or_null(jsonb) to service_role;
