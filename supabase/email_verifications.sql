-- Run once in Supabase > SQL Editor. Stores hashed 6-digit codes for sign-up and password reset.
create table if not exists public.email_verifications (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  purpose     text not null check (purpose in ('signup','recovery')),
  pin_hash    text not null,
  expires_at  timestamptz not null,
  attempts    int  not null default 0,
  consumed    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists email_verifications_lookup
  on public.email_verifications (email, purpose, created_at desc);

-- Only the backend (service role) touches this table; no client access.
alter table public.email_verifications enable row level security;
