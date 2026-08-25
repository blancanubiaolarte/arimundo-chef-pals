insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where lower(email) = 'blancanubiaolarte@gmail.com'
on conflict (user_id, role) do nothing;

create policy "profiles_admin_select" on public.profiles
for select to authenticated
using (public.has_role(auth.uid(), 'admin'));