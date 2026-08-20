create table if not exists obligations (
  id text primary key,
  source text not null,
  title text not null,
  due_date date not null,
  currency text not null,
  amount numeric,
  status text not null default 'UNKNOWN',
  cuit_ending text,
  source_url text,
  source_hash text,
  observed_at timestamptz not null default now()
);

create table if not exists obligation_changes (
  id bigserial primary key,
  obligation_id text not null,
  previous_due_date date,
  new_due_date date not null,
  detected_at timestamptz not null default now(),
  source_url text
);

create table if not exists daily_reports (
  id bigserial primary key,
  report_date date not null,
  generated_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists obligations_due_date_idx on obligations(due_date);
create index if not exists obligations_source_idx on obligations(source);
