-- Returns the email for a given username so the client can sign in with email+password
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
  return v_email;
end;
$$;
