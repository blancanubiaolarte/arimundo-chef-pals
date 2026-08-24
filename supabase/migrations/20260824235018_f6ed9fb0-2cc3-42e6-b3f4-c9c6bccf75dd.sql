-- Fotos de perros y avatares: carpeta por usuario (<user_id>/archivo.jpg)
create policy "own_dog_photos" on storage.objects for all to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own_avatars" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Imágenes de recetas: lectura para usuarios autenticados, escritura solo admin
create policy "recipe_images_read" on storage.objects for select to authenticated
  using (bucket_id = 'recipe-images');

create policy "recipe_images_admin_write" on storage.objects for all to authenticated
  using (bucket_id = 'recipe-images' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'recipe-images' and public.has_role(auth.uid(),'admin'));