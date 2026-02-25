# Piano di Implementazione — Sito Web di Ida Sato, Psicologa

## Contesto

Il progetto è un sito Next.js appena creato con `create-next-app` (Next.js 16.1.6). Contiene solo il template di default — nessun componente custom, nessuna pagina, nessuna configurazione SEO. L'obiettivo è trasformarlo in un sito professionale per Ida Sato, psicologa, che la presenti e attiri nuovi clienti. Il sito deve essere reattivo, performante, pienamente accessibile (WCAG 2.1 AA), e strutturato per essere facilmente modificabile da AI (Claude Opus 4.6). Deploy su Vercel.

**Decisioni confermate dall'utente:**
- Bilingue: Italiano (default) + Inglese
- Contenuti: tutto placeholder, da sostituire con dati reali
- Contatti: form + email diretta + telefono + WhatsApp
- Palette: sage green confermata

---

## Fase 0 — Pulizia, aggiornamento dipendenze, setup i18n

### Aggiornare le dipendenze
```
react 19.2.3 → 19.2.4
react-dom 19.2.3 → 19.2.4
tailwindcss ^4 → ^4.2
@types/node ^20 → ^22
typescript ^5 → ^5.9
```

> **Nota su ESLint**: ESLint 10 è appena uscito (feb 2026) e `eslint-config-next` potrebbe non essere ancora compatibile. Manteniamo ESLint 9 per stabilità.

### Aggiungere dipendenze
- `next-intl` — i18n per Next.js App Router (la soluzione più matura per Next.js)
- `@radix-ui/react-dialog` — modale accessibile (menu mobile)
- `@radix-ui/react-navigation-menu` — navigazione accessibile
- `@radix-ui/react-accordion` — FAQ accordion
- `@radix-ui/react-visually-hidden` — testo solo per screen reader
- `clsx` — utility per classi condizionali
- `lucide-react` — icone SVG leggere e accessibili

### Rimuovere file template
- Eliminare `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Pulire `app/page.tsx` (rimuovere contenuto demo)

### Creare `CLAUDE.md`
File nella root del progetto con:
- Convenzioni di codice (naming, struttura componenti, pattern)
- Struttura directory e dove trovare cosa
- Come funziona l'i18n (dove aggiungere traduzioni, come usare `useTranslations`)
- Comandi utili (`npm run dev`, `npm run build`, `npm run lint`)
- Regole di accessibilità da rispettare sempre
- Pattern di design system (colori, spacing, typography)

### Creare `.claude/launch.json`
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

---

## Fase 1 — Struttura del progetto, i18n e Design System

### Struttura directory (con i18n)
```
ida-site/
├── app/
│   ├── [locale]/                   ← Route dinamica per locale (it/en)
│   │   ├── layout.tsx              ← Layout con locale
│   │   ├── page.tsx                ← Homepage
│   │   ├── chi-sono/
│   │   │   └── page.tsx            ← About
│   │   ├── servizi/
│   │   │   └── page.tsx            ← Servizi
│   │   ├── contatti/
│   │   │   └── page.tsx            ← Contatti
│   │   ├── faq/
│   │   │   └── page.tsx            ← FAQ
│   │   └── not-found.tsx           ← 404
│   ├── globals.css                 ← Stili globali + design tokens
│   ├── sitemap.ts                  ← Sitemap dinamica
│   └── robots.ts                   ← robots.txt
├── components/
│   ├── ui/                         ← Componenti base riusabili
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── container.tsx
│   │   ├── heading.tsx
│   │   └── skip-link.tsx
│   ├── layout/                     ← Componenti di layout
│   │   ├── header.tsx
│   │   ├── navigation.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-menu.tsx
│   │   └── language-switcher.tsx   ← Selettore lingua IT/EN
│   └── sections/                   ← Sezioni composte (usate nelle pagine)
│       ├── hero.tsx
│       ├── services-preview.tsx
│       ├── about-preview.tsx
│       ├── testimonials.tsx
│       ├── cta-section.tsx
│       └── contact-form.tsx
├── lib/
│   ├── metadata.ts                 ← Helper per metadata SEO
│   ├── structured-data.ts          ← JSON-LD schemas
│   └── utils.ts                    ← Utility generiche (cn helper)
├── i18n/
│   ├── config.ts                   ← Configurazione i18n (locales, default)
│   ├── request.ts                  ← getRequestConfig per next-intl
│   └── routing.ts                  ← defineRouting per next-intl
├── messages/
│   ├── it.json                     ← Tutte le traduzioni italiane
│   └── en.json                     ← Tutte le traduzioni inglesi
├── content/
│   ├── site.ts                     ← Dati globali (contatti, social, P.IVA)
│   ├── services.ts                 ← Lista servizi (chiavi i18n)
│   ├── faq.ts                      ← FAQ (chiavi i18n)
│   └── testimonials.ts             ← Testimonianze (chiavi i18n)
├── types/
│   └── index.ts                    ← Tipi TypeScript condivisi
├── middleware.ts                    ← Middleware next-intl per routing locale
├── public/
│   ├── images/                     ← Foto e immagini
│   └── og-image.jpg                ← Open Graph image
└── CLAUDE.md
```

### Setup i18n con `next-intl`

**`i18n/config.ts`**: definisce locales (`it`, `en`) e default locale (`it`)

**`i18n/routing.ts`**: `defineRouting()` con locales e pathnames localizzati:
- `/chi-sono` (it) → `/about` (en)
- `/servizi` (it) → `/services` (en)
- `/contatti` (it) → `/contact` (en)
- `/faq` (it) → `/faq` (en)

**`i18n/request.ts`**: `getRequestConfig()` che carica i messaggi per locale

**`middleware.ts`**: middleware di next-intl per rilevamento locale e redirect

**`messages/it.json`** e **`messages/en.json`**: file JSON con tutte le stringhe UI organizzate per namespace:
```json
{
  "navigation": { "home": "Home", "about": "Chi Sono", ... },
  "hero": { "title": "...", "subtitle": "...", "cta": "..." },
  "about": { "title": "...", "bio": "...", ... },
  "services": { ... },
  "contact": { ... },
  "faq": { ... },
  "footer": { ... },
  "common": { "readMore": "...", "back": "...", ... }
}
```

### Design System — `globals.css`

**Palette colori** (sage green + beige caldo):
```
Primary:       #6B8F71 (sage green — fiducia, crescita)
Primary dark:  #5A7A5F
Primary light: #8BAF90
Secondary:     #D4C5A9 (warm beige — accoglienza)
Accent:        #5B9A8B (soft teal — professionalità)
Neutral 50:    #FAFAF8 (warm white — background)
Neutral 100:   #F5F3EF
Neutral 200:   #E8E4DC
Neutral 700:   #4A4A48
Neutral 900:   #1A1A19 (quasi-nero — testo)
```

**Dark mode** (inversione con toni caldi):
```
Background:    #1A1D1A (verde scurissimo, non nero puro)
Surface:       #242824
Text:          #E8E4DC
Primary:       #8BAF90 (versione chiara del sage)
```

**Strategia dark mode: automatico + toggle manuale**
- Usa strategia `class` su `<html>` (classe `dark` presente/assente) — necessaria per il toggle
- Script inline in `<head>` per evitare flash (FOUC): legge `localStorage` o `prefers-color-scheme` prima del render
- `ThemeProvider` component (`components/providers/theme-provider.tsx`):
  - Stato: `"light" | "dark" | "system"`
  - Default: `"system"` (segue OS)
  - Salva preferenza utente in `localStorage`
  - Listener su `matchMedia('prefers-color-scheme: dark')` per reagire ai cambi OS
- `ThemeToggle` component (`components/layout/theme-toggle.tsx`):
  - Icona sole/luna nel header, accanto al language switcher
  - Ciclo: system → light → dark → system
  - Accessibile con `aria-label` tradotto
- CSS: variabili definite su `:root` (light) e `.dark` (dark)

**Typography**: Font `Inter` via `next/font/google` — una sola famiglia per tutto, pesi 400/500/600/700.

### Configurazioni

**`next.config.ts`**:
- Plugin `createNextIntlPlugin` per i18n
- Headers di sicurezza (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

**`app/[locale]/layout.tsx`**:
- `lang` dinamico dall'URL (`it` o `en`)
- Font Inter con variabili CSS
- `NextIntlClientProvider` per traduzioni client-side
- Metadata globale con title template
- Skip-link + Header + Footer

---

## Fase 2 — Componenti UI base

### `components/ui/skip-link.tsx`
Link "Vai al contenuto" / "Skip to content" (tradotto) visibile solo su focus keyboard.

### `components/ui/button.tsx`
- Varianti: `primary`, `secondary`, `outline`, `ghost`
- Dimensioni: `sm`, `md`, `lg`
- Focus ring visibile, stati hover/active/disabled
- Supporto per render come `<a>` tramite prop `asChild`

### `components/ui/container.tsx`
Wrapper con `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

### `components/ui/card.tsx`
Card con padding, bordo, ombra leggera. Variante `interactive` con hover state.

### `components/ui/heading.tsx`
Heading semantico (`h1`-`h6`) con stili consistenti per livello.

### `components/layout/header.tsx`
- Logo/nome "Ida Sato"
- Sottotitolo "Psicologa" / "Psychologist"
- Navigazione desktop (usa `navigation.tsx`)
- Menu hamburger mobile (usa `mobile-menu.tsx`)
- Language switcher (IT/EN)
- Sticky con `backdrop-blur`

### `components/layout/navigation.tsx`
- Usa `@radix-ui/react-navigation-menu`
- Link tradotti con stato attivo evidenziato
- Usa `usePathname()` per determinare pagina corrente

### `components/layout/mobile-menu.tsx`
- Overlay modale (`@radix-ui/react-dialog`)
- Lista link di navigazione
- Focus trap automatico
- Animazione apertura/chiusura con CSS transitions

### `components/layout/language-switcher.tsx`
- Toggle IT/EN
- Usa `useRouter()` e `usePathname()` di next-intl
- Mantiene la pagina corrente durante il cambio lingua

### `components/providers/theme-provider.tsx`
- Context React per gestire tema (light/dark/system)
- `"use client"` — gestisce stato + localStorage + matchMedia listener
- Applica/rimuove classe `dark` su `<html>`
- Esporta `useTheme()` hook

### `components/layout/theme-toggle.tsx`
- Bottone con icona sole/luna/monitor (per system)
- `"use client"` — usa `useTheme()`
- `aria-label` tradotto ("Cambia tema" / "Toggle theme")
- Posizionato nel header accanto al language switcher

### `components/layout/footer.tsx`
- Contatti: email, telefono, WhatsApp
- Link navigazione
- Informazioni legali (P.IVA, iscrizione albo)
- Copyright con anno dinamico

---

## Fase 3 — Content layer e Pagine

### Content layer (`content/`)

**`content/site.ts`** — dati globali non tradotti:
```ts
export const siteConfig = {
  name: "Ida Sato",
  email: "ida.sato@example.com",        // placeholder
  phone: "+39 012 345 6789",             // placeholder
  whatsapp: "+390123456789",             // placeholder
  address: "Via Example 42, Milano",     // placeholder
  piva: "IT12345678901",                 // placeholder
  alboNumber: "12345",                   // placeholder
  url: "https://idasato.it",            // placeholder
}
```

**`content/services.ts`** — array di servizi con chiavi i18n:
```ts
export const services = [
  { id: "individual", icon: "User" },
  { id: "anxiety", icon: "Brain" },
  { id: "growth", icon: "Sprout" },
  { id: "mood", icon: "Sun" },
  { id: "couples", icon: "Users" },
  { id: "online", icon: "Monitor" },
]
```
Titoli e descrizioni in `messages/it.json` e `messages/en.json`.

**`content/faq.ts`** — array di FAQ con chiavi i18n (stessa logica).

**`content/testimonials.ts`** — testimonianze con chiavi i18n (anonime).

### Pagine

**Homepage (`app/[locale]/page.tsx`)**:
1. Hero: titolo, sottotitolo, CTA "Prenota un consulto" / "Book a consultation"
2. About preview: foto placeholder + breve intro + link Chi Sono
3. Services preview: 3-4 card servizi + link Servizi
4. Testimonials: 2-3 testimonianze in grid
5. CTA section: banner finale con contatti

**Chi Sono (`app/[locale]/chi-sono/page.tsx`)**:
- Foto placeholder con `next/image`
- Biografia, formazione, approccio terapeutico
- Qualifiche e iscrizione all'albo
- Metadata SEO specifica per lingua

**Servizi (`app/[locale]/servizi/page.tsx`)**:
- Grid di card con icona, titolo, descrizione per ogni servizio
- Layout responsivo: 1 col mobile, 2 col tablet, 3 col desktop

**Contatti (`app/[locale]/contatti/page.tsx`)**:
- **Form di contatto**: nome, email, telefono (opzionale), messaggio
  - Validazione client-side accessibile (messaggi di errore collegati con `aria-describedby`)
  - Il form non invia realmente (nessun backend) — mostra messaggio di conferma placeholder
- **Info contatto dirette**:
  - Email: link `mailto:` con icona
  - Telefono: link `tel:` con icona
  - WhatsApp: link `https://wa.me/...` con icona
- **Indirizzo**: testo con placeholder (niente embed mappa per ora — aggiungibile dopo)
- **Orari**: placeholder orari di ricevimento

**FAQ (`app/[locale]/faq/page.tsx`)**:
- Accordion con `@radix-ui/react-accordion`
- Domande/risposte da `messages/*.json` tramite chiavi i18n
- JSON-LD FAQPage schema

**404 (`app/[locale]/not-found.tsx`)**:
- Messaggio tradotto "Pagina non trovata" / "Page not found"
- Link alla homepage

---

## Fase 4 — SEO e Performance

### Metadata (`lib/metadata.ts`)
- `createMetadata({ locale, page, path })` → genera `Metadata` completo
- Title template: `%s | Ida Sato — Psicologa` (it) / `%s | Ida Sato — Psychologist` (en)
- `alternates.languages` per hreflang tra IT e EN
- Open Graph con immagine, locale, tipo
- Twitter Card

### Structured Data (`lib/structured-data.ts`)
- `LocalBusiness` (type: `Psychologist`) con nome, indirizzo, contatti
- `Person` per Ida con qualifiche
- `FAQPage` per la pagina FAQ
- `WebSite` con `potentialAction: SearchAction`

### `app/sitemap.ts`
- Tutte le pagine in entrambe le lingue
- `alternateRefs` per ogni pagina con entrambi i locali

### `app/robots.ts`
- Allow all + link a sitemap

### Performance
- Immagini: `next/image` con `sizes`, `priority` per hero
- Font: `next/font/google` con `display: 'swap'`
- Server Components di default, `"use client"` solo dove necessario:
  - `mobile-menu.tsx` (stato apertura/chiusura)
  - `contact-form.tsx` (gestione form + validazione)
  - `language-switcher.tsx` (router navigation)
  - Sezione FAQ se usa accordion interattivo

---

## File da modificare/creare (riepilogo)

### Modificare
| File | Cosa |
|---|---|
| `package.json` | Aggiornare dipendenze + aggiungere nuove |
| `app/globals.css` | Design system completo con palette sage green |
| `next.config.ts` | Plugin next-intl + headers sicurezza |

### Creare — Infrastruttura
| File | Cosa |
|---|---|
| `CLAUDE.md` | Istruzioni per AI |
| `.claude/launch.json` | Dev server config |
| `middleware.ts` | Routing i18n |
| `i18n/config.ts` | Configurazione locali |
| `i18n/routing.ts` | Pathnames localizzati |
| `i18n/request.ts` | Request config next-intl |
| `messages/it.json` | Traduzioni italiane |
| `messages/en.json` | Traduzioni inglesi |
| `lib/metadata.ts` | Helper metadata SEO |
| `lib/structured-data.ts` | JSON-LD schemas |
| `lib/utils.ts` | Utility (cn helper) |
| `types/index.ts` | Tipi condivisi |

### Creare — Componenti
| File | Cosa |
|---|---|
| `components/ui/button.tsx` | Button accessibile |
| `components/ui/card.tsx` | Card |
| `components/ui/container.tsx` | Container wrapper |
| `components/ui/heading.tsx` | Heading semantico |
| `components/ui/skip-link.tsx` | Skip navigation |
| `components/layout/header.tsx` | Header sticky |
| `components/layout/navigation.tsx` | Nav desktop |
| `components/layout/footer.tsx` | Footer |
| `components/layout/mobile-menu.tsx` | Menu mobile |
| `components/layout/language-switcher.tsx` | Toggle IT/EN |
| `components/providers/theme-provider.tsx` | Theme context + provider |
| `components/layout/theme-toggle.tsx` | Toggle light/dark/system |
| `components/sections/hero.tsx` | Sezione Hero |
| `components/sections/services-preview.tsx` | Preview servizi |
| `components/sections/about-preview.tsx` | Preview about |
| `components/sections/testimonials.tsx` | Testimonianze |
| `components/sections/cta-section.tsx` | CTA banner |
| `components/sections/contact-form.tsx` | Form contatto |

### Creare — Pagine
| File | Cosa |
|---|---|
| `app/[locale]/layout.tsx` | Layout con i18n |
| `app/[locale]/page.tsx` | Homepage |
| `app/[locale]/chi-sono/page.tsx` | Chi Sono |
| `app/[locale]/servizi/page.tsx` | Servizi |
| `app/[locale]/contatti/page.tsx` | Contatti |
| `app/[locale]/faq/page.tsx` | FAQ |
| `app/[locale]/not-found.tsx` | 404 |
| `app/sitemap.ts` | Sitemap |
| `app/robots.ts` | Robots.txt |

### Creare — Content
| File | Cosa |
|---|---|
| `content/site.ts` | Dati globali |
| `content/services.ts` | Servizi |
| `content/faq.ts` | FAQ |
| `content/testimonials.ts` | Testimonianze |

### Eliminare
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- `app/layout.tsx` e `app/page.tsx` originali (sostituiti da `app/[locale]/`)

---

## Verifica

1. `npm run build` — nessun errore
2. `npm run lint` — nessun warning/errore
3. Dev server — navigare tutte le pagine in IT e EN
4. Cambio lingua — il language switcher mantiene la pagina corrente
5. Accessibilità — navigazione completa solo con tastiera (Tab, Enter, Escape)
6. Skip link — visibile su primo Tab, porta al contenuto
7. Mobile — hamburger menu funzionante, focus trap, close su Escape
8. Responsive — mobile (375px), tablet (768px), desktop (1280px)
9. SEO — metadata, Open Graph, hreflang, structured data nel sorgente HTML
10. Dark mode — `prefers-color-scheme: dark` funziona
11. Lighthouse — target > 90 su tutte le metriche

---

## Ordine di esecuzione

1. **Fase 0** — Pulizia, dipendenze, CLAUDE.md, launch.json
2. **Fase 1** — i18n setup + design system + configurazioni + tipi
3. **Fase 2** — Componenti UI + layout (header, footer, nav, menu, language switcher)
4. **Fase 3** — Content layer + messaggi traduzione + tutte le pagine
5. **Fase 4** — SEO (metadata, structured data, sitemap, robots)
6. **Verifica** — Build, lint, test manuale su tutte le pagine e lingue
