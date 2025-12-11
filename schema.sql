create table public.purchases (
  id bigint generated always as identity not null,
  user_id uuid null,
  units_used numeric(10, 5) not null,
  dispensary text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  purchased_date date null,
  purchased_time time without time zone null,
  refresh_at timestamp with time zone GENERATED ALWAYS as ((purchased_date + '30 days'::interval)) STORED null,
  constraint purchases_pkey primary key (id),
  constraint purchases_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint purchases_units_used_check check ((units_used > (0)::numeric))
) TABLESPACE pg_default;