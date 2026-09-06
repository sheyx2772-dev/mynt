-- A profile that is closed, and the request that opens it.
--
-- Until now every profile was open: tap the card, see everything. A closed
-- profile shows a stranger the name, the picture and the number, and the rest
-- only after the owner has said yes — the way a private account works on the
-- networks people already use, which is the model they arrive with.
--
-- The request is its own table rather than a state on `follows`, because a
-- follow is a fact and a request is a question. Keeping questions out of the
-- table that counts followers is what lets the counter trigger stay as it is:
-- accepting a request inserts into `follows`, and the count moves exactly as
-- it does for an open profile.
--
-- A refused request stays as a row. Deleting it would let the same person ask
-- again the moment the owner said no, and the owner would be asked to say no
-- forever. The primary key is what makes "again" impossible.

-- +goose Up

alter table handles
  add column if not exists yopiq boolean not null default false;

create table if not exists follow_requests (
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  handle text not null,
  holat text not null default 'kutilmoqda'
    check (holat in ('kutilmoqda', 'qabul', 'rad')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (requester_user_id, handle)
);

-- The owner's inbox: what is waiting on a number, newest first.
create index if not exists follow_requests_pending_idx
  on follow_requests (handle, created_at desc)
  where holat = 'kutilmoqda';

-- +goose Down

drop table if exists follow_requests;
alter table handles drop column if exists yopiq;
