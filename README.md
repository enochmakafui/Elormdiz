# Elormdiz

Static tie & dye site. Products and photos are managed from `admin.html` and stored in Supabase.

## One-time setup
1. Create a project at supabase.com.
2. SQL Editor: paste and run `supabase/setup.sql` (creates the table, image bucket, security rules and loads the existing 16 products).
3. Authentication -> Users -> Add user: create the client's email and password.
4. Authentication -> Sign In / Providers: turn **off** "Allow new users to sign up" (so only that user can ever log in).
5. Project Settings -> API: copy the Project URL and `anon public` key into `config.js`.
6. Deploy the folder to any static host. The admin page is at `/admin.html`.

If `config.js` is empty or Supabase is unreachable, the site falls back to the built-in 16 products.
