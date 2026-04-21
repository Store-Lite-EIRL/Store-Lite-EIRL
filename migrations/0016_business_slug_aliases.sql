create table if not exists "business_slug_aliases" (
  "id" uuid primary key default gen_random_uuid(),
  "business_id" uuid not null references "businesses"("id") on delete cascade,
  "slug" text not null unique,
  "created_at" timestamp with time zone not null default now(),
  constraint "business_slug_aliases_slug_format_check"
    check (char_length("slug") >= 3 and char_length("slug") <= 50 and "slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists "idx_business_slug_aliases_business_id"
  on "business_slug_aliases" ("business_id");

create index if not exists "idx_business_slug_aliases_slug"
  on "business_slug_aliases" ("slug");

create index if not exists "idx_business_slug_aliases_created_at"
  on "business_slug_aliases" ("created_at" desc);
