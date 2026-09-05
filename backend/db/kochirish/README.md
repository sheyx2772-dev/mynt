# Supabase'dan o'zimizning Postgres'ga ko'chirish

2026-yil 5-sentyabrda bir marta bajarilgan ish. Repoda qolishining sababi
oddiy: mijoz ma'lumotini ko'chirgan skript keyin o'qib chiqiladigan bo'lishi
kerak, va agar birinchi urinish noto'g'ri ketsa — qaytadan yuritiladigan.

    export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
    python3 export.py            # sbdata/ ga jadval boshiga bitta JSON
    python3 import.py flex_new   # bo'sh, migratsiya qilingan bazaga yozadi
    python3 verify.py flex_new   # har bir qatorning har bir maydonini solishtiradi

`verify.py` — eng muhimi. `import.py` ning birinchi varianti JSON'ni ikki marta
ekranlagan edi: har bir ruscha menyu nomi `\uXXXX` bo'lib tushdi, qatorlar soni
esa to'g'ri chiqaverdi. Sanoq hech narsa yo'qolmaganini isbotlaydi, hech narsa
o'zgarmaganini emas. Shuning uchun maydonma-maydon solishtiruv bor, va shuning
uchun u ko'chirishning bir qismi — keyin qo'shiladigan qulaylik emas.

Ikki narsa ataylab ko'chirilmadi. `flex_sessions` — Supabase'da bunday jadval
yo'q edi, ya'ni ko'chiradigan narsa ham yo'q; hamma qaytadan kiradi. Va
`auth.users` ning qirqta ustunidan faqat uchtasi olindi: id, pochta, ochilgan
vaqti. Qolgani — jumladan endi yo'q kirish usulining paroli — bizniki emas.
