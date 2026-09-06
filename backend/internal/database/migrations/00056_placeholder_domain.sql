-- Move the phone placeholder addresses onto the domain we own.
--
-- An account created by phone has no address, so the number stands in at a
-- domain nobody can receive mail at. That domain was flex.com.uz, which is not
-- ours — it was never bought — so every one of these rows carried somebody
-- else's name.
--
-- Nothing is found by this address: accountForPhone looks an account up by the
-- number, and the placeholder exists only because the directory wants the
-- column filled. So the rewrite cannot orphan an account. It replaces the
-- suffix rather than rebuilding the address, so a row already moved is left
-- alone and this can run twice.

-- +goose Up
update auth.users
   set email = replace(email, '@telefon.flex.com.uz', '@telefon.flex-nfc.uz')
 where email like '%@telefon.flex.com.uz';

-- +goose Down
update auth.users
   set email = replace(email, '@telefon.flex-nfc.uz', '@telefon.flex.com.uz')
 where email like '%@telefon.flex-nfc.uz';
