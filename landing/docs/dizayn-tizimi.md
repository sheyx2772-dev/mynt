# FLEX — dizayn tizimi (v0/Fable 5.1 dan olingan)

Manba: v0.dev, `flex-digital-card`, 2026-09-04. Qiymatlar **chiqarilgan
sahifadan** olingan (computed styles), skrinshotdan taxmin emas.

## Pozitsiya

> Stolga tashlangan fizik karta, ostidan qog'oz varaq sirg'algan. Karta biroz
> burilgan, ikki qavatli soya tashlaydi. Avatar kartaning pastki chetiga
> qadalgan foto. Tablar — haqiqiy papka tablari: aktivi varaqning o'zidan
> kesilgan. Kontaktlar — daftar qatori, xizmatlar — nuqtali yetakchi chiziqli
> bosma narxnoma. Ekrandagi yagona lime — pastda yopishgan tugmaning yuzasi.

## Ranglar — oltitasi, boshqasi yo'q

| Token | Hex | Nima |
|---|---|---|
| `--color-ink` | `#0E0A1B` | matn, karta, plita |
| `--color-lime` | `#ABFF09` | faqat bitta tugma yuzasi |
| `--color-paper` | `#FAFAF8` | sahifa foni, bosilgan tugma |
| `--color-sheet` | `#FFFFFF` | varaq |
| `--color-mute` | `#5C586A` | ikkilamchi matn — **bitta** kulrang |
| `--color-gold` | `#C9A961` | gravirovka, plita cheti |

Oltin — yangi va muhim: FLEX kartasi qora+oltin, demak oltin brend rangi.

## Shriftlar

- **Inter** — hamma matn, sarlavhalar ham (alohida display shrift yo'q)
- **JetBrains Mono** — raqamlar: plita, karta gravirovkasi, narxlar

Ikkalasida ham kirill bor.

## Soyalar

```css
--shadow-card:   inset 0 1px rgb(255 255 255 / .10), inset 0 -1px rgb(0 0 0 / .70),
                 0 1px 1px rgb(14 10 27 / .28), 0 6px 10px -4px rgb(14 10 27 / .35),
                 0 24px 40px -16px rgb(14 10 27 / .45);
--shadow-sheet:  0 -1px 0 rgb(14 10 27 / .06), 0 -12px 32px -20px rgb(14 10 27 / .25);
--shadow-slab:   0 1px 0 rgb(14 10 27 / .30), 0 8px 20px -8px rgb(14 10 27 / .45);
--shadow-deboss: inset 0 1px 2px rgb(14 10 27 / .12), inset 0 -1px 0 rgb(255 255 255 / .90);
--shadow-photo:  0 1px 1px rgb(14 10 27 / .20), 0 4px 10px -4px rgb(14 10 27 / .30);
```

`card` ichki yorug'lik + ichki qorong'ilik bilan — plastik chetining o'zi.
`sheet` soyasi **tepaga** tushadi: varaq kartaning ostidan chiqib turadi.
`deboss` — bosilgan tugma: ichkariga botgan, pastdan oq chiziq.

## Radiuslar

- Karta: `4% / 6.3%` — **foizda**, chunki haqiqiy karta burchagi o'lchamga bog'liq
- Varaq: 16px · Plita: 6px · Bosilgan tugma: 12px · Avatar: 14px

## Yozilgan klasslar

```css
.engraved {
  color: var(--color-gold);
  text-shadow: 0 1px rgb(0 0 0 / .90), 0 -1px rgb(255 240 200 / .18);
}
/* Qora ustiga o'yilgan oltin: pastda qora, tepada iliq oq — metall chekka. */

.rule {
  background-image: linear-gradient(to right, rgb(14 10 27 / .12), rgb(14 10 27 / .12));
  background-position: bottom;
  background-repeat: no-repeat;
  background-size: 100% 1px;
}
/* Chegara emas, fon rasmi — shuning uchun `last:bg-none` bilan o'chadi va
   qatorning radiusiga xalaqit bermaydi. */

@keyframes settle {
  from {
    transform: translateY(-10px) rotate(-3.5deg) scale(1.02);
    box-shadow: /* kattaroq, uzoqroq soya — karta hali havoda */;
  }
}
.settle { animation: settle .64s cubic-bezier(.2, .8, .2, 1) both; }
/* Karta stolga tushadi. 640ms, bir marta, sahifa ochilganda. */
```

## Tuzilma

```
main            mx-auto max-w-[460px] pt-8 pb-32
  figure        .settle rotate-[2.5deg] rounded-[4%/6.3%] bg-ink shadow-card
                aspect-[1.586/1] w-[calc(100%-1.5rem)] max-w-[420px] z-20
    img         object-cover object-right opacity-90
    div         linear-gradient(112deg, #fff1a 0%, #fff05 28%, transparent 48%, #0003 100%)
    div         ring-1 ring-inset ring-white/10
    tepa        FLEX (.engraved tracking-[0.28em]) · NFC ikonka rotate-90 text-gold
    past        MYN042 (.engraved font-mono tracking-[0.14em] clamp(22px,7.2vw,32px))
                ism (.engraved uppercase tracking-[0.18em] clamp(12px,3.4vw,14px))

  div           z-10 -mt-12 mx-3 rounded-2xl bg-sheet px-5 pt-16 pb-6 shadow-sheet
    avatar      -mt-14 size-24 rounded-[14px] border-[3px] border-sheet shadow-photo
    h1          text-[24px] font-semibold tracking-[-0.01em]
    p           text-[16px] text-mute · kompaniya font-medium text-ink
    plita       № + [gold 8px] MYN │ 042  — h-14 rounded-md bg-ink shadow-slab
                font-mono text-[26px] tracking-[0.16em]
    bio         text-[16px] text-ink/85
    2 tugma     h-14 rounded-xl bg-ink text-paper shadow-slab active:translate-y-px
    2 tugma     h-14 rounded-xl bg-paper shadow-deboss active:bg-ink/5
    dl          ko'rish · oxirgi faollik — text-mute, raqam font-medium text-ink

  tablar        flex gap-1.5 px-1
    aktiv       h-14 rounded-t-xl bg-sheet shadow-[0_-1px_0_#0e0a1b14,0_-6px_12px_-8px_#0e0a1b40]
    passiv      h-14 rounded-t-xl bg-ink/[0.045] text-mute
  div           rounded-2xl bg-sheet px-5 pt-2 pb-6 shadow-sheet
    h2          .rule pb-3 text-[16px] font-semibold uppercase tracking-[0.1em]
    kontakt li  .rule last:bg-none > a -mx-2 min-h-16 gap-4 rounded-lg px-2 active:bg-ink/5
                ikonka size-5 text-mute · yorliq text-mute · qiymat font-medium text-ink
    xizmat li   .rule flex min-h-14 items-baseline gap-3 py-3
                nom · <span flex-1 self-end border-b-2 border-dotted border-ink/35> · narx
```

## Qattiq qoidalar

- 16px dan kichik matn **yo'q**, hech qayerda
- Har qator kamida 56px (kontaktda 64px)
- Narx: `500 000 so'm`, ajratmaydigan bo'shliq bilan
- Kirill tekshirilgan: Ташкент, Шартнома
- Bitta lime: pastda yopishgan tugma, ustida siyoh matn (14.6:1)
