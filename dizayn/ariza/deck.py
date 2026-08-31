# FLEX — President Tech Award taqdimoti. 16:9, brend ranglarida.
from reportlab.lib.pagesizes import landscape
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os

W, H = 960, 540
BLACK = HexColor("#0e0a1b")
LIME = HexColor("#abff09")
WHITE = HexColor("#ffffff")
GREY = HexColor("#9a97a6")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOT = lambda n: os.path.join(ROOT, "public", "mahsulot", n)

c = canvas.Canvas(os.path.join(os.path.dirname(os.path.abspath(__file__)), "FLEX-taqdimot.pdf"),
                  pagesize=landscape((W, H)))


def ground(dark=True):
    c.setFillColor(BLACK if dark else WHITE)
    c.rect(0, 0, W, H, stroke=0, fill=1)


def mark(dark=True):
    c.setStrokeColor(LIME); c.setLineWidth(2)
    c.roundRect(60, H - 62, 22, 22, 7, stroke=1, fill=0)
    c.setFillColor(LIME); c.circle(71, H - 51, 5, stroke=0, fill=1)
    c.setFillColor(WHITE if dark else BLACK)
    c.setFont("Helvetica-Bold", 15); c.drawString(92, H - 58, "flex")


def eyebrow(t, dark=True):
    c.setFillColor(LIME); c.setFont("Helvetica-Bold", 10)
    c.drawString(60, H - 118, t.upper())


def title(t, dark=True, size=34, y=H - 168):
    c.setFillColor(WHITE if dark else BLACK)
    c.setFont("Helvetica-Bold", size)
    for i, line in enumerate(t.split("\n")):
        c.drawString(60, y - i * (size + 6), line)


def body(lines, dark=True, x=60, y=H - 240, size=14, lead=25, col=None):
    c.setFillColor(col or (GREY if dark else HexColor("#4a4756")))
    c.setFont("Helvetica", size)
    for i, line in enumerate(lines):
        c.drawString(x, y - i * lead, line)


def bullets(items, dark=True, x=60, y=H - 240, lead=34):
    for i, (head, sub) in enumerate(items):
        yy = y - i * lead * 1.55
        c.setFillColor(LIME); c.circle(x + 4, yy + 5, 4, stroke=0, fill=1)
        c.setFillColor(WHITE if dark else BLACK); c.setFont("Helvetica-Bold", 14)
        c.drawString(x + 18, yy, head)
        c.setFillColor(GREY if dark else HexColor("#5a5766")); c.setFont("Helvetica", 12)
        c.drawString(x + 18, yy - 17, sub)


def shot(name, x, y, w):
    p = SHOT(name)
    if not os.path.exists(p):
        return
    img = ImageReader(p)
    iw, ih = img.getSize()
    c.drawImage(img, x, y, width=w, height=w * ih / iw, mask="auto")


def page():
    c.showPage()


# 1 — muqova
ground()
mark()
c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 62)
c.drawString(60, 330, "FLEX")
c.setFillColor(LIME); c.rect(60, 316, 168, 6, stroke=0, fill=1)
c.setFillColor(WHITE); c.setFont("Helvetica", 20)
c.drawString(60, 268, "Raqamli shaxsingiz. Bir tegish.")
c.setFillColor(GREY); c.setFont("Helvetica", 13)
c.drawString(60, 236, "NFC orqali ochiladigan shaxsiy profil va noyob raqamlar bozori")
c.drawString(60, 214, "flex.uz  |  President Tech Award 2026  |  Best Startup Project")
shot("karta-hero.jpg", 520, 150, 380)
page()

# 2 — muammo
ground(False); mark(False); eyebrow("Muammo")
title("Qog'oz vizitka o'lgan,\nlekin o'rniga hech narsa kelmagan", False, 30)
body([
    "Uchrashuvda berilgan vizitkaning 88 foizi bir hafta ichida tashlanadi.",
    "Telefon raqami almashish esa hech narsani ko'rsatmaydi: portfolio yo'q,",
    "ijtimoiy tarmoq yo'q, kompaniya yo'q.",
    "",
    "O'zbekistonda tadbirkor, sotuvchi va mutaxassis o'zini bir joyda",
    "ko'rsatadigan vosita yo'q. Instagram profil - biznes vizitka emas.",
], False, y=H - 250)
page()

# 3 — yechim
ground(); mark(); eyebrow("Yechim")
title("Bitta raqam. Uch xil qurilma.\nBitta profil.")
bullets([
    ("Noyob raqam - AAA000", "3 harf + 3 raqam. Umrbod sizniki, qayta sotilmaydi."),
    ("Qurilmani o'zingiz tanlaysiz", "Karta, uzuk yoki braslet - uchalasi bir profilni ochadi."),
    ("Ilova kerak emas", "Telefonga tegizasiz - profil ochiladi. NFC yo'q bo'lsa QR."),
], y=H - 250)
shot("oila.jpg", 520, 120, 380)
page()

# 4 — mahsulot
ground(False); mark(False); eyebrow("Mahsulot")
title("Ishlab turgan mahsulot,\nprototip emas", False, 30)
body([
    "Sayt to'liq yozilgan va ishlaydi: profil, kabinet, analitika, postlar,",
    "obunachilar, rezidentlar katalogi, QR generator, PWA (telefonga",
    "o'rnatiladi va oflaynda ishlaydi).",
    "",
    "Click va Payme integratsiyalari yozilgan va testdan o'tgan.",
    "Ma'lumotlar bazasi Supabase, rasmlar Cloudflare R2 da.",
    "128 ta avtomat test, hammasi o'tadi.",
], False, y=H - 250)
shot("uzuk.jpg", 600, 130, 150)
shot("braslet.jpg", 770, 130, 150)
page()

# 5 — biznes modeli
ground(); mark(); eyebrow("Biznes modeli")
title("Kamyoblik narxni belgilaydi")
body([
    "Bazaviy narx:            99 000 so'm",
    "Harf kamyobligi:         x1 - x8   (AAA, ABC kabi kombinatsiyalar)",
    "Raqam kamyobligi:        x1 - x10  (000, 007, 777 kabi raqamlar)",
    "",
    "Eng qimmat handle:       ~7 900 000 so'm",
    "Qurilma (karta/uzuk/braslet):  alohida sotiladi",
    "Biznes tarifi:           har bir xodim uchun oylik to'lov",
], col=WHITE, y=H - 250, lead=27)
c.setFillColor(LIME); c.setFont("Helvetica-Bold", 13)
c.drawString(60, 96, "Jami 17 576 000 ta handle. Boshqa yo'q - shuning uchun har biri qadrli.")
page()

# 6 — bozor va raqobat
ground(False); mark(False); eyebrow("Bozor va raqobat")
title("Vodiyda isbotlangan talab,\nToshkent hali bo'sh", False, 30)
body([
    "UNQX - xuddi shu AAA000 formatida Farg'ona vodiysida ishlaydi va",
    "talab borligini isbotlab bergan. Toshkent va viloyatlarda esa",
    "hech kim yo'q.",
    "",
    "Popl va Linq - xalqaro raqobatchilar, lekin O'zbekistonda to'lov",
    "tizimi ham, tili ham, yetkazib berishi ham yo'q.",
    "",
    "FLEX ikkalasidan farqi: kamyob raqam + qurilma tanlovi + Click/Payme.",
], False, y=H - 250)
page()

# 7 — reja
ground(); mark(); eyebrow("Reja")
title("Keyingi 12 oy")
bullets([
    ("1-3 oy - ishga tushirish", "flex.uz ochiladi, to'lovlar yoqiladi, birinchi 500 foydalanuvchi."),
    ("4-6 oy - qurilma ishlab chiqarish", "Karta, uzuk, braslet uchun yetkazib beruvchi bilan shartnoma."),
    ("7-9 oy - biznes tarifi", "Jamoalar uchun tarif, CRM integratsiyasi, lead yig'ish."),
    ("10-12 oy - viloyatlar", "Toshkentdan keyin Samarqand, Buxoro, Namangan."),
], y=H - 250)
page()

# 8 — jamoa va so'rov
ground(False); mark(False); eyebrow("Jamoa va so'rov")
title("Nima kerak", False, 30)
body([
    "Jamoa:  Javohir Abrorov - asoschi, mahsulot va biznes",
    "        Mobil ilova ishlab chiquvchi - iOS/Android",
    "",
    "So'rov: investitsiya qurilma ishlab chiqarish, marketing va",
    "        jamoani kengaytirishga yo'naltiriladi.",
    "",
    "Kod:    github.com/sheyx2772-dev/mynt",
    "Sayt:   flex.uz",
], False, y=H - 250)
c.setFillColor(LIME); c.rect(60, 90, 300, 5, stroke=0, fill=1)
c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 16)
c.drawString(60, 60, "Noyob raqam, umrbod sizniki.")
c.save()
print("yozildi: dizayn/ariza/FLEX-taqdimot.pdf")
