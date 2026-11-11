-- Elormdiz: run this once in Supabase -> SQL Editor.

-- 1. Products table
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('shirt','cloth')),
  thumb_path text not null,   -- storage path in the "products" bucket (or images/... for the original site photos)
  full_path  text not null,
  width      int,
  height     int,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone can read; only logged-in users (the admin) can change.
create policy "public read products"  on public.products for select using (true);
create policy "admin insert products" on public.products for insert to authenticated with check (true);
create policy "admin update products" on public.products for update to authenticated using (true) with check (true);
create policy "admin delete products" on public.products for delete to authenticated using (true);

-- 2. Image bucket (public so the website can show the pictures)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "admin upload images" on storage.objects for insert to authenticated with check (bucket_id = 'products');
create policy "admin update images" on storage.objects for update to authenticated using (bucket_id = 'products');
create policy "admin delete images" on storage.objects for delete to authenticated using (bucket_id = 'products');

-- 3. Existing products (their images stay in the website's images/ folder)
insert into public.products (name, type, thumb_path, full_path, width, height, sort) values
  ('Emerald Sun','shirt','images/p1-s.webp','images/p1.webp',817,1100,1),
  ('Royal Violet Trio','cloth','images/p3-s.webp','images/p3.webp',825,1100,2),
  ('Lilac Storm','shirt','images/p2-s.webp','images/p2.webp',817,1100,3),
  ('Violet Horizon','shirt','images/p5-s.webp','images/p5.webp',817,1100,4),
  ('Golden Hour Trio','cloth','images/p7-s.webp','images/p7.webp',825,1100,5),
  ('Jade Cloud','shirt','images/p4-s.webp','images/p4.webp',817,1100,6),
  ('Amethyst Dusk','shirt','images/p6-s.webp','images/p6.webp',817,1100,7),
  ('Teal Tide Trio','cloth','images/p12-s.webp','images/p12.webp',825,1100,8),
  ('Midnight Gold','shirt','images/p8-s.webp','images/p8.webp',817,1100,9),
  ('Indigo Wave','shirt','images/p10-s.webp','images/p10.webp',691,1100,10),
  ('Ember Bloom','shirt','images/p9-s.webp','images/p9.webp',591,796,11),
  ('Blue & Blush Trio','cloth','images/p16-s.webp','images/p16.webp',825,1100,12),
  ('Marigold Dip','shirt','images/p11-s.webp','images/p11.webp',817,1100,13),
  ('Sky Dip','shirt','images/p13-s.webp','images/p13.webp',817,1100,14),
  ('Orchid Haze','shirt','images/p14-s.webp','images/p14.webp',817,1100,15),
  ('Harvest Camp','shirt','images/p15-s.webp','images/p15.webp',817,1100,16);
