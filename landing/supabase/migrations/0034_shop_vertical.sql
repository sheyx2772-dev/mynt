-- Flex migration 0034 — shops replace fleets in the venue list.
--
-- The car product was filed under business and it does not belong there: an
-- avtovizitka is bought by one person for one car, the way a card or a ring is.
-- It moves to the personal side, where it is priced with the objects rather
-- than with the venues.
--
-- What takes its place is a shop, which is a venue in every sense the pricing
-- already assumes: a fixed address with one or two points — the door and the
-- till — and a page behind them carrying the payment details, the catalogue
-- and the hours.
--
-- No row has ever carried 'auto' (checked against the project before writing
-- this), so the value is dropped rather than kept for compatibility with
-- nothing.

do $$
begin
  alter table team_requests drop constraint if exists team_requests_vertical_known;

  alter table team_requests
    add constraint team_requests_vertical_known
    check (vertical is null or vertical in ('cafe', 'hotel', 'shop', 'other'));
end $$;
