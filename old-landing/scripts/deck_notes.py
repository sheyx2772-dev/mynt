#!/usr/bin/env python3
"""What to say over each slide, written into the file's speaker notes.

A deck read aloud from its own bullet points is the commonest way a good
product pitches badly, so the words are here and the slides stay pictures. Each
note is two to four sentences — twenty to thirty seconds — which puts the full
run at about eight minutes.

SHORT lists the eight slides that make a three-minute version: skip the rest
and the argument still lands, because those eight carry problem, mechanism,
difference, proof, market and ask.

Imported by scripts/deck_pptx.py; nothing to run on its own.
"""

# The three-minute route, by slide number.
SHORT = [1, 2, 4, 6, 9, 14, 16, 20]

UZ = [
    # 1 · cover
    "Assalomu alaykum. Men Javohir, FLEX asoschisi. Biz odamga va biznesga "
    "umrbod noyob raqam beramiz, va o'sha raqamni ochadigan NFC buyum sotamiz. "
    "Uch daqiqada nima qurayotganimizni va nega bu ishlayotganini aytaman.",

    # 2 · problem
    "Sakkizta holat. Hammasi bitta sababdan: qog'oz bir marta bosiladi, hayot "
    "esa o'zgaraveradi. Vizitkadagi raqam o'zgaradi, menyudagi narx "
    "ko'tariladi, mashina oynasida raqam umuman yo'q. Bu ro'yxat bizning "
    "xayolimizdan chiqmagan — har birini mijoz o'zi aytgan.",

    # 3 · statement
    "Yechim bitta mexanizm. Tegiziladi — sahifa ochiladi. Ilova o'rnatilmaydi, "
    "ro'yxatdan o'tilmaydi, hech kim hech narsa yuklab olmaydi. "
    "Bu jumla butun mahsulotni tushuntiradi.",

    # 4 · answer
    "Chapda o'sha sakkizta muammo, o'ngda javobi. Diqqat qiling: bittasi ham "
    "kelajakda qiladigan ish emas — hammasi bugun ishlaydi. Biz muammoni "
    "sanab, keyin bitta yechim ko'rsatmayapmiz; bitta mexanizm sakkiz joyda "
    "ishlaydi.",

    # 5 · devices
    "Bu qo'lga olinadigan qism. Sakkizta shakl, bitta tizim. Karta, uzuk va "
    "braslet — bir martalik savdo. Pastdagi to'rttasi obyektga ketadi va "
    "obuna bilan keladi. Narxlar oynada.",

    # 6 · notplain
    "Bizga eng ko'p beriladigan savol: NFC karta hammada bor, farqingiz nima. "
    "Farq kartada emas. Raqam mijozning o'ziga tegishli, sahifa istalgan payt "
    "o'zgaradi, statistika bor, uch til bor, Payme ulangan, va eng muhimi — "
    "obyekt qatlami bor. Karta bir bo'lak temir; qolgani platforma.",

    # 7 · designs
    "Dizaynlarni o'zimiz chizganmiz. Raqobatchi mashina yoki multfilm "
    "logotipini bosadi — bu tovar belgisini buzish va uni har kim takrorlashi "
    "mumkin. Past raqamli seriyani esa hech kim takrorlay olmaydi. Bundan "
    "tashqari xaridor bir gap yozib, dizaynni sun'iy intellektga chizdiradi.",

    # 8 · market
    "Biz sotadigan xonalar. Kafe, mehmonxona, do'kon va salon, klinika. "
    "Suratlar mokap emas — bularning hammasi o'rnatilgan qurilma.",

    # 9 · size
    "Raqamlar Statistika qo'mitasidan, sanasi bilan — zaldan tekshirsangiz "
    "bo'ladi. Jami 116 900 obyekt. Eng past tarifda yiliga 209 mlrd so'm. "
    "Uch yillik maqsadimiz shundan 0,9 foizi. Ya'ni biz bozorni egallash "
    "haqida gapirmayapmiz — mingta obyekt haqida gapiryapmiz.",

    # 10 · rivals
    "Eng muhim qatorga qarang: obyekt yarmi. UNQX shaxsiy vizitka sotadi va "
    "shu bilan tugaydi. Popl va V1CE — xalqaro, lekin o'zbek tili ham, "
    "hisob-faktura ham yo'q. Mahalliy hech kim obyekt tomonini sotmaydi. "
    "Ular bir marta sotadi, biz har oy to'lov olamiz.",

    # 11 · loop
    "Obyekt qanday ishlaydi. Har stolning o'z kodi bor, mehmon tegizadi, "
    "so'rov kassaga stol raqami bilan tushadi va ovoz chiqaradi. Ofitsiant "
    "qo'l ko'targan stolni izlamaydi — ekran aytadi.",

    # 12 · gets
    "Bu o'rnatishning hammasi. Egasi stollarni yozadi, varaqni chop etadi va "
    "har stolga bittadan qo'yadi. Bizdan usta kelishi shart emas. Dushanba "
    "bosiladi, seshanba javob beradi.",

    # 13 · model
    "Ikki xil pul. Raqam va qurilma — bir marta. Obyekt — har oy. Firma "
    "hisob-faktura bilan to'laydi, chunki O'zbekistonda biznes aynan shunday "
    "to'laydi; kartadan to'lash taklif qilsangiz buxgalter rad qiladi.",

    # 14 · arithmetic
    "Oddiy hisob. Mingta obyekt eng past tarifda — oyiga 149 million so'm. "
    "Bu eng past tarif; mehmonxona yoki kattaroq restoran ikki barobar "
    "to'laydi. Qurilmalar va shaxsiy raqamlar bu yerda hisobga olinmagan.",

    # 15 · traction
    "Bu birinchi urinish emas. IT Park rezidentimiz, akseleratsiyalardan "
    "o'tganmiz, qurilma sotganmiz — kafe, do'kon, kiyim do'koni, shifoxona. "
    "Ishlab chiqaruvchi bilan bevosita ishlaymiz, ya'ni qurilma narxini "
    "o'zimiz boshqaramiz.",

    # 16 · status
    "Bu deckdagi yagona haqiqiy surat — qolgani render. Haqiqiy kafe, haqiqiy "
    "stol, ishlab turgan qurilma. Chapdagi ro'yxat — bugun ishlayotgan "
    "narsalar, kelajak rejasi emas.",

    # 17 · roadmap
    "O'n sakkiz oy. Birinchi chorak — Payme sertifikatsiyasi va yuzta obyekt. "
    "Keyin mahsulotni kengaytirish, keyin diler tarmog'i, keyin qo'shni "
    "bozorlar. Sanalar raund yopilgandan hisoblanadi.",

    # 18 · why
    "Nega aynan hozir. Telefonlar tayyor — NFC hammasida bor, QR'ni hech "
    "kimga tushuntirish kerak emas. Kafelar narxda emas, xizmatda "
    "raqobatlashyapti. Va to'lov yo'llari paydo bo'ldi: oylik obunani "
    "bizneslardan yig'ish endi mumkin.",

    # 19 · team
    "Uch kishi. Mahsulot, veb va sotuv — hammasi ichkarida. Birinchi versiya "
    "tashqi jamoasiz qurildi va bugun ishlab turibdi.",

    # 20 · ask
    "Pre-seed bosqichida 50 dan 100 minggacha dollar. Yarmidan ko'pi "
    "qurilmalar zaxirasi va birinchi yuzta obyektni o'rnatishga ketadi — "
    "ya'ni mahsulotga emas, sotuvga. Mahsulot allaqachon qurilgan. Rahmat.",
]

EN = [
    "Good afternoon. I am Javohir, founder of FLEX. We give a person or a "
    "business a permanent unique number, and we sell the NFC object that "
    "opens it. In three minutes I will tell you what we are building and why "
    "it works.",

    "Eight situations, all from one cause: paper is printed once and life "
    "keeps changing. The number on the card changes, the price on the menu "
    "goes up, and there is no number behind the windscreen at all. We did "
    "not invent this list — customers gave us every line of it.",

    "The answer is one mechanism. A tap, and the page opens. Nothing to "
    "install, nothing to sign up for, nothing to download. That sentence "
    "explains the whole product.",

    "The eight problems on the left, the answer on the right. Note that none "
    "of these is something we intend to build — all of it works today. We are "
    "not listing problems and offering one fix; one mechanism works in eight "
    "places.",

    "This is the part you can hold. Eight form factors, one system. Card, "
    "ring and bracelet are a one-off sale. The four below go into venues and "
    "come with the subscription. Prices are on the slide.",

    "The question we get most: everybody has an NFC card, what is different. "
    "Not the card. The number belongs to the customer, the page changes "
    "whenever they like, there are statistics, three languages, Payme is "
    "connected — and above all there is the venue half. The card is a piece "
    "of metal; the rest is the platform.",

    "We drew these designs ourselves. A competitor prints a car marque or a "
    "cartoon character — that infringes a registered mark, and anyone with "
    "the same printer can copy it. A low serial number cannot be copied at "
    "all. Buyers can also describe a design in a sentence and have it drawn.",

    "The rooms we sell into: cafes, hotels, shops and salons, clinics. These "
    "are not mockups — every one of them is installed hardware.",

    "The figures are the state statistics committee's, with their dates, so "
    "you can check them from where you are sitting. 116,900 venues in total. "
    "At the lowest tariff that is 209 billion soum a year. Our three-year "
    "target is 0.9% of it. We are not talking about owning a market — we are "
    "talking about a thousand venues.",

    "Look at the row that matters: the venue half. UNQX sells a personal card "
    "and stops there. Popl and V1CE are international, but there is no Uzbek "
    "and no invoice. Nobody local sells the venue side. They sell once; we "
    "get paid every month.",

    "How a venue works. Every table has its own code, the guest taps it, and "
    "the request lands at the till with the table number and a sound. The "
    "waiter is not scanning the room for a raised hand — the screen says which "
    "table.",

    "That is the whole installation. The owner types the tables, prints the "
    "sheet, and puts one card on each table. No engineer visits. Printed on "
    "Monday, answering by Tuesday.",

    "Two kinds of money. The number and the object are one-off. The venue is "
    "monthly. Companies pay by invoice, because that is how business pays "
    "here; offer a card payment and the accountant refuses.",

    "Simple arithmetic. A thousand venues at the lowest tariff is 149 million "
    "soum a month. That is the lowest tariff — a hotel or a larger restaurant "
    "pays twice that. Hardware and personal numbers are not counted here.",

    "This is not a first attempt. We are an IT Park resident, we have been "
    "through accelerators, and we have sold hardware into cafes, shops, "
    "clothing stores and clinics. We deal directly with the manufacturers, "
    "which means we control what the hardware costs us.",

    "This is the only real photograph in the deck — the rest are renders. A "
    "real cafe, a real table, hardware that is working. The list on the left "
    "is what runs today, not what we plan.",

    "Eighteen months. First quarter: Payme certification and a hundred "
    "venues. Then widening the product, then a dealer network, then the "
    "neighbouring markets. The dates run from the close of the round.",

    "Why now. The phones are ready — NFC is in all of them and nobody needs "
    "QR explained. Cafes compete on service, not only price. And the payment "
    "rails exist: collecting a monthly subscription from a business is now "
    "possible.",

    "Three people. Product, web and sales, all in-house. The first version "
    "was built without an outside team, and it is running today.",

    "Fifty to a hundred thousand dollars, pre-seed. More than half goes to "
    "hardware stock and installing the first hundred venues — that is to "
    "selling, not to building. The product is already built. Thank you.",
]
