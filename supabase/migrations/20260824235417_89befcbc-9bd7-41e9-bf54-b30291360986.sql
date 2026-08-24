create unique index if not exists achievements_user_code_key
  on public.achievements (user_id, code);