# Ariza formasidagi "Tavsif" matni

FLEX — NFC orqali ochiladigan shaxsiy raqamli profil va noyob raqamlar bozori.

**Muammo.** Qog'oz vizitka ishlamaydi: berilganining aksariyati bir hafta ichida
tashlanadi va u odam haqida hech narsa ko'rsatmaydi. O'zbekistonda tadbirkor,
sotuvchi yoki mutaxassis o'zini bir joyda — portfolio, ijtimoiy tarmoq, kontakt va
kompaniya ma'lumoti bilan — ko'rsatadigan professional vosita yo'q.

**Yechim.** Foydalanuvchi noyob raqam sotib oladi: 3 harf + 3 raqam (masalan
FLX007). U raqam umrbod uniki bo'ladi va qayta sotilmaydi. Raqam flex.uz/FLX007
manzilida shaxsiy profilni ochadi. Uni qanday olib yurish — karta, uzuk yoki
braslet ko'rinishida — foydalanuvchining o'z tanlovi; uchalasi ham bitta profilni
ochadi. Telefonga tegizish yetarli, hech kim ilova o'rnatmaydi. NFC qo'llamaydigan
telefonlar uchun QR-kod zaxira variant sifatida ishlaydi.

**Mahsulot holati.** Sayt to'liq ishlab chiqilgan va ishlaydi: profil sahifasi,
foydalanuvchi kabineti, tashriflar va havola bosishlari bo'yicha analitika, postlar
va obunachilar, rezidentlar katalogi, QR generator, PWA (telefon ekraniga
o'rnatiladi va oflaynda ham ochiladi). Click va Payme to'lov integratsiyalari
yozilgan va test qilingan. Texnologiyalar: Next.js, TypeScript, Supabase
(PostgreSQL, RLS), Cloudflare R2. 128 ta avtomatlashtirilgan test yozilgan.

**Biznes modeli.** Bazaviy narx 99 000 so'm. Yakuniy narx harflar va raqamlarning
kamyobligiga qarab koeffitsient bilan ko'payadi — narx formulasi ochiq, sayt uni
foydalanuvchiga ko'rsatib turadi. NFC qurilma alohida sotiladi. Jamoalar uchun har
bir xodim bo'yicha oylik tarif rejalashtirilgan. Jami 17 576 000 ta raqam mavjud —
miqdor cheklangani mahsulotning asosiy qiymatidir.

**Bozor.** Xuddi shu formatda ishlaydigan UNQX Farg'ona vodiysida talab borligini
isbotlagan, ammo Toshkent va boshqa viloyatlar hali egallanmagan. Popl va Linq kabi
xalqaro raqobatchilarning O'zbekistonda na mahalliy to'lov tizimi, na tili, na
yetkazib berish tarmog'i bor. FLEX ularning barchasidan kamyob raqam modeli,
qurilma tanlovi va Click/Payme integratsiyasi bilan farq qiladi.

**Reja.** Birinchi 3 oy — saytni ishga tushirish, to'lovlarni yoqish, dastlabki 500
foydalanuvchi. 4–6 oy — qurilma ishlab chiqarish uchun yetkazib beruvchi bilan
shartnoma. 7–9 oy — biznes tarifi va CRM integratsiyasi. 10–12 oy — viloyatlarga
kengayish.

Kod: github.com/sheyx2772-dev/mynt
