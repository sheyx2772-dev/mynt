import { COMPANY, DELIVERY, REPLACEMENT_WINDOW_DAYS } from "@/lib/company";
import { BASE_PRICE } from "@/lib/pricing";
import { FREE_LINK_LIMIT, SERVICE_LIMIT, plan } from "@/lib/plans";
import { formatUZS } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

// The public offer, in three languages.
//
// The Uzbek text governs, and every version says so at the top. That sentence
// is the reason this can be translated at all: without it, a buyer and the
// seller reading different words have no way to settle which words they agreed
// to, and the translation becomes a liability rather than a courtesy.
//
// Everything with a number in it is built from the same constants the rest of
// the site uses, so a price cannot be current on the shop and stale in the
// contract.
//
// NOT REVIEWED BY A LAWYER. The Uzbek original was not either, but it was
// written once and read; these two are translations of it and carry whatever
// was wrong in the original plus whatever translation adds.

export type TermsSection = { title: string; body: string[] };

export function terms(lang: Lang): {
  title: string;
  intro: string;
  authority: string;
  sections: TermsSection[];
  devicePriceTitle: string;
  requisites: string[];
  contact: string[];
} {
  const money = (n: number) => formatUZS(n, lang);
  const premium = plan("premium");

  if (lang === "ru") {
    return {
      title: "Публичная оферта и условия",
      intro: `Эта страница определяет условия между ${COMPANY.legalName} и покупателем. Оформление заказа и оплата на сайте означают согласие с этими условиями.`,
      authority:
        "Оригинал этого документа составлен на узбекском языке. Русская и английская версии приведены для удобства; при разногласиях применяется узбекский текст.",
      devicePriceTitle: "Цены на устройства",
      sections: [
        {
          title: "Что за услуга",
          body: [
            "Flex — это уникальный номер и личный профиль, который он открывает. Номер состоит из 3 букв и 3 цифр, например FLX007, и открывает профиль покупателя по адресу flex.com.uz/FLX007.",
            "Номер можно носить на физическом устройстве: NFC-карте, кольце или браслете. Устройство продаётся как отдельный товар.",
          ],
        },
        {
          title: "Цены",
          body: [
            `Цена номера начинается от ${money(BASE_PRICE)} и считается автоматически по редкости букв и цифр. Формула открыта: базовая цена × коэффициент букв × коэффициент цифр. Итоговая сумма показывается до оплаты.`,
            "Цены указаны в узбекских сумах.",
          ],
        },
        {
          title: "Подписка",
          body: [
            `Номер и устройство оплачиваются один раз. Работа профиля оплачивается отдельно: ${money(premium.monthly)} в месяц или ${money(premium.yearly)} в год.`,
            `Профиль работает и без подписки, и номер остаётся вашим — он никогда не удаляется. На обычном тарифе доступны до ${FREE_LINK_LIMIT} ссылок, до ${SERVICE_LIMIT.free} услуг с ценами, QR-код и общее число визитов. Подписка открывает ссылки без ограничений, до ${SERVICE_LIMIT.premium} услуг, полную аналитику, собранные контакты с выгрузкой, свою фоновую картинку и снимает надпись Flex со страницы.`,
            "Если подписка прекращается, профиль возвращается на обычный тариф. Данные не удаляются.",
          ],
        },
        {
          title: "Оплата",
          body: [
            "Оплата проходит через Payme или Click. До подтверждения оплаты номер бронируется на 30 минут и в это время никому другому не продаётся. Если оплата не прошла, бронь снимается и номер снова свободен.",
            "Компании оплачивают по счёту и банковским переводом; документ выдаётся в кабинете.",
          ],
        },
        {
          title: "Доставка",
          body: [
            `Устройство доставляется после подтверждения заказа: по Ташкенту — ${DELIVERY.tashkentDays} день, в области — ${DELIVERY.regionsDaysFrom}–${DELIVERY.regionsDaysTo} дня.`,
            "Номер и профиль начинают работать сразу после подтверждения оплаты — ждать устройство не нужно.",
          ],
        },
        {
          title: "Возврат и замена",
          body: [
            "Номер возврату не подлежит. Сразу после оплаты он закрепляется за покупателем и больше никому не продаётся. Именно эта ограниченность и составляет ценность номера, поэтому его возврат нарушал бы права других покупателей.",
            `Если в устройстве обнаружен заводской брак — не работает NFC-чип, повреждён корпус или брак печати — сообщите в течение ${REPLACEMENT_WINDOW_DAYS} дней после получения, и мы заменим его на новое. Замена бесплатна.`,
            "Повреждения от использования (царапины, поломка, попадание воды) заводским браком не считаются.",
          ],
        },
        {
          title: "Передача номера другому человеку",
          body: [
            "Владелец может в любой момент передать номер другому человеку — из кабинета, по электронной почте получателя. При передаче данные профиля (имя, описание, ссылки, посты, подписчики) стираются и новому владельцу не переходят.",
          ],
        },
        {
          title: "Реквизиты продавца",
          body: [
            "Эти данные приведены для идентификации продавца. Переводить деньги сюда не нужно — оплата проходит через Payme или Click, кнопкой на сайте.",
          ],
        },
        {
          title: "Связь",
          body: [
            "С вопросами и жалобами обращайтесь по этим адресам. Каждое обращение рассматривается в течение рабочего дня.",
          ],
        },
      ],
      requisites: ["Организация", "ИНН", "ОКЭД", "Банк", "Расчётный счёт", "МФО", "Адрес"],
      contact: ["Ответственное лицо", "Телефон", "Электронная почта"],
    };
  }

  if (lang === "en") {
    return {
      title: "Public offer and terms",
      intro: `This page sets out the terms between ${COMPANY.legalName} and the buyer. Placing an order and paying on the site counts as agreement to them.`,
      authority:
        "The original of this document is drawn up in Uzbek. The Russian and English versions are provided for convenience; in the event of a discrepancy the Uzbek text governs.",
      devicePriceTitle: "Device prices",
      sections: [
        {
          title: "What the service is",
          body: [
            "Flex is a unique handle and the profile it opens. The handle is three letters and three digits — FLX007, say — and it opens the buyer's profile at flex.com.uz/FLX007.",
            "The handle can be carried on a physical device: an NFC card, a ring or a bracelet. The device is sold as a separate product.",
          ],
        },
        {
          title: "Prices",
          body: [
            `A handle starts at ${money(BASE_PRICE)} and is priced automatically by how rare its letters and digits are. The formula is open: base price × letter multiplier × digit multiplier. The final sum is shown before payment.`,
            "Prices are in Uzbek so'm.",
          ],
        },
        {
          title: "Subscription",
          body: [
            `The handle and the device are paid for once. Keeping the profile running is paid for separately: ${money(premium.monthly)} a month or ${money(premium.yearly)} a year.`,
            `The profile works without a subscription and the handle stays yours — it is never deleted. The standard plan carries up to ${FREE_LINK_LIMIT} links, up to ${SERVICE_LIMIT.free} services with prices, a QR code and a total visit count. A subscription adds unlimited links, up to ${SERVICE_LIMIT.premium} services, full analytics, the contacts collected with an export, your own cover image, and removes the Flex mark from the page.`,
            "If the subscription stops, the profile returns to the standard plan. Nothing is deleted.",
          ],
        },
        {
          title: "Payment",
          body: [
            "Payment goes through Payme or Click. Until it is confirmed the handle is held for 30 minutes and is sold to nobody else in that time. If payment does not complete, the hold is released and the handle is free again.",
            "Companies pay by invoice and bank transfer; the document is issued in the cabinet.",
          ],
        },
        {
          title: "Delivery",
          body: [
            `The device is delivered once the order is confirmed: ${DELIVERY.tashkentDays} day within Tashkent, ${DELIVERY.regionsDaysFrom}–${DELIVERY.regionsDaysTo} days to the regions.`,
            "The handle and the profile start working as soon as payment is confirmed — there is no need to wait for the device.",
          ],
        },
        {
          title: "Returns and replacement",
          body: [
            "A handle is not refundable. It is assigned to the buyer the moment payment completes and is sold to nobody else afterwards. That scarcity is what the handle is worth, so returning one would take from other buyers what they paid for.",
            `If a device has a manufacturing fault — a dead NFC chip, a damaged body, a printing defect — tell us within ${REPLACEMENT_WINDOW_DAYS} days of receiving it and we will replace it. The replacement is free.`,
            "Damage from use — scratches, breakage, water — is not a manufacturing fault.",
          ],
        },
        {
          title: "Passing a handle to somebody else",
          body: [
            "The owner may pass a handle on at any time, from the cabinet, using the recipient's email address. On transfer the profile's contents — name, bio, links, posts, followers — are cleared and do not go to the new owner.",
          ],
        },
        {
          title: "Seller's details",
          body: [
            "These are given to identify the seller. There is no need to transfer money here — payment goes through Payme or Click, with the button on the site.",
          ],
        },
        {
          title: "Contact",
          body: [
            "Questions and complaints go to these addresses. Each is looked at within a working day.",
          ],
        },
      ],
      requisites: ["Company", "INN", "OKED", "Bank", "Account", "MFO", "Address"],
      contact: ["Responsible person", "Phone", "Email"],
    };
  }

  return {
    title: "Ommaviy oferta va shartlar",
    intro: `Bu sahifa ${COMPANY.legalName} va xaridor o'rtasidagi shartlarni belgilaydi. Saytda buyurtma berish va to'lovni amalga oshirish shu shartlarga rozilik bildirish hisoblanadi.`,
    authority:
      "Ushbu hujjatning asl matni o'zbek tilida tuzilgan. Rus va ingliz tilidagi versiyalar qulaylik uchun berilgan; nizo yuzaga kelganda o'zbek tilidagi matn hisobga olinadi.",
    devicePriceTitle: "Qurilma narxlari",
    sections: [
      {
        title: "Xizmat nima",
        body: [
          "Flex — noyob raqam (handle) va u ochadigan shaxsiy profil. Raqam 3 ta harf va 3 ta raqamdan iborat, masalan FLX007. U flex.com.uz/FLX007 manzilida xaridorning profilini ochadi.",
          "Raqamni jismoniy qurilmada olib yurish mumkin: NFC karta, uzuk yoki braslet. Qurilma alohida mahsulot sifatida sotiladi.",
        ],
      },
      {
        title: "Narxlar",
        body: [
          `Raqam narxi ${money(BASE_PRICE)}dan boshlanadi va harflar hamda raqamlarning kamyobligiga qarab avtomatik hisoblanadi. Formula ochiq: bazaviy narx × harf koeffitsienti × raqam koeffitsienti. Yakuniy summa to'lovdan oldin ko'rsatiladi.`,
          "Narxlar O'zbekiston so'mida ko'rsatilgan.",
        ],
      },
      {
        title: "Obuna",
        body: [
          `Raqam va qurilma bir marta to'lanadi. Profilning ishlab turishi uchun platformaga obuna alohida to'lanadi: oyiga ${money(premium.monthly)} yoki yiliga ${money(premium.yearly)}.`,
          `Obunasiz ham profil ishlaydi va raqam sizniki bo'lib qoladi — u hech qachon o'chirilmaydi. Oddiy rejada ${FREE_LINK_LIMIT} tagacha havola, ${SERVICE_LIMIT.free} tagacha xizmat va narx, QR-kod va umumiy tashriflar soni mavjud. Obuna cheksiz havolalar, ${SERVICE_LIMIT.premium} tagacha xizmat, to'liq analitika, kelgan kontaktlar va ularni chiqarish, o'z fon rasmingiz hamda sahifadagi Flex yozuvini olib tashlashni ochadi.`,
          "Obuna to'xtatilsa, profil oddiy rejaga qaytadi. Ma'lumotlar o'chirilmaydi.",
        ],
      },
      {
        title: "To'lov",
        body: [
          "To'lov Payme yoki Click orqali amalga oshiriladi. To'lov tasdiqlangunga qadar raqam 30 daqiqaga band qilinadi va shu vaqt ichida boshqa hech kimga sotilmaydi. To'lov amalga oshmasa, band bekor bo'ladi va raqam yana bo'shaydi.",
          "Firmalar hisob-faktura va bank o'tkazmasi orqali to'laydi; hujjat kabinetdan beriladi.",
        ],
      },
      {
        title: "Yetkazib berish",
        body: [
          `Qurilma buyurtma tasdiqlangandan so'ng yetkaziladi: Toshkent shahri bo'yicha ${DELIVERY.tashkentDays} kun, viloyatlarga ${DELIVERY.regionsDaysFrom}–${DELIVERY.regionsDaysTo} kun.`,
          "Raqam va profil to'lov tasdiqlangan zahoti ishlay boshlaydi — qurilmani kutish shart emas.",
        ],
      },
      {
        title: "Qaytarish va almashtirish",
        body: [
          "Raqam qaytarilmaydi. To'lov amalga oshgan zahoti raqam xaridorga biriktiriladi va boshqa hech kimga sotilmaydi. Aynan shu cheklanganlik raqamning qiymatini tashkil qiladi, shuning uchun uni qaytarish boshqa xaridorlarning huquqini buzadi.",
          `Qurilmada zavod nuqsoni chiqsa — NFC chip ishlamasa, korpus shikastlangan bo'lsa yoki bosma nuqsonli bo'lsa — uni qabul qilgandan so'ng ${REPLACEMENT_WINDOW_DAYS} kun ichida xabar bering, biz yangisiga almashtiramiz. Almashtirish bepul.`,
          "Foydalanish natijasida yuzaga kelgan shikast (chizilish, sinish, suvda qolish) zavod nuqsoni hisoblanmaydi.",
        ],
      },
      {
        title: "Raqamni boshqa odamga o'tkazish",
        body: [
          "Raqam egasi uni istalgan vaqtda boshqa odamga o'tkazishi mumkin — kabinetdan, qabul qiluvchining elektron pochtasi orqali. O'tkazishda profil ma'lumotlari (ism, bio, havolalar, postlar, obunachilar) tozalanadi va yangi egaga o'tmaydi.",
        ],
      },
      {
        title: "Sotuvchi rekvizitlari",
        body: [
          "Bu ma'lumotlar sotuvchini tanishtirish uchun keltirilgan. Bu yerga pul o'tkazish shart emas — to'lov Payme yoki Click orqali, saytdagi tugma bilan amalga oshiriladi.",
        ],
      },
      {
        title: "Aloqa",
        body: [
          "Savol yoki shikoyat bo'lsa shu manzillarga murojaat qiling. Har bir murojaat ish kuni davomida ko'rib chiqiladi.",
        ],
      },
    ],
    requisites: ["Tashkilot", "STIR (INN)", "OKED", "Bank", "Hisob raqami", "MFO", "Manzil"],
    contact: ["Mas'ul shaxs", "Telefon", "Elektron pochta"],
  };
}
