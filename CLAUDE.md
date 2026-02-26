# Ida Sato — Sito Psicologa

## Comandi

```bash
npm run dev          # Dev server con Turbopack (localhost:3000)
npm run build        # Build di produzione
npm run start        # Server di produzione
npm run lint         # ESLint
```

## Struttura progetto

```
app/[locale]/        → Pagine con routing i18n (it/en)
components/ui/       → Componenti base riusabili (button, card, container, heading)
components/layout/   → Layout (header, footer, navigation, mobile-menu, theme-toggle, language-switcher)
components/sections/ → Sezioni composte per le pagine (hero, services-preview, ecc.)
components/providers/→ Context providers (theme-provider)
content/             → Dati strutturati (site config, services, faq, testimonials)
messages/            → Traduzioni i18n (it.json, en.json)
i18n/                → Configurazione next-intl (config, routing, request)
lib/                 → Utility e helper (metadata, structured-data, utils)
types/               → Tipi TypeScript condivisi
public/images/       → Immagini statiche
```

## Convenzioni di codice

- **Naming file**: kebab-case per tutti i file (`contact-form.tsx`, non `ContactForm.tsx`)
- **Naming componenti**: PascalCase per export (`export function ContactForm`)
- **Naming variabili/funzioni**: camelCase
- **Server Components** di default — aggiungere `"use client"` solo quando necessario (stato, effetti, event handler)
- **Import paths**: usare alias `@/` (es. `@/components/ui/button`)
- **Tipi**: preferire `interface` per oggetti, `type` per union/alias
- **Props**: definire inline se semplici, estrarre in `interface` se complesse

## i18n (next-intl)

- **Locales**: `it` (default), `en`
- **Aggiungere traduzioni**: editare `messages/it.json` e `messages/en.json`
- **Usare nelle Server Components**: `const t = await getTranslations('namespace')`
- **Usare nelle Client Components**: `const t = useTranslations('namespace')`
- **Pathnames localizzati**: definiti in `i18n/routing.ts`
  - `/chi-sono` (it) → `/about` (en)
  - `/servizi` (it) → `/services` (en)
  - `/contatti` (it) → `/contact` (en)

## Design System

### Colori (CSS variables in globals.css)
- `--color-primary`: sage green (#6B8F71) — usare per sfondi (bottoni, CTA bg, badge)
- `--color-primary-text`: sage dark (#5A7A5F) — usare per testo e link su sfondi chiari (4.8:1 su bianco)
- `--color-primary-dark`: (#5A7A5F) — usare per hover su link e bg con testo bianco
- `--color-secondary`: warm beige (#D4C5A9) — usare per sfondi secondari
- `--color-accent`: soft teal (#5B9A8B) — usare per elementi di accento
- Dark mode: classe `dark` su `<html>`, variabili invertite automaticamente
- **IMPORTANTE**: NON usare `text-primary` per testo leggibile — il contrasto è solo 3.6:1. Usare `text-primary-text` (4.8:1)

### Typography
- Heading: Playfair Display (serif, via `--font-heading`) — `font-semibold` o `font-bold`
- Body: DM Sans (sans-serif, via `--font-sans`) — `font-normal` (400)
- I titoli h1-h6 ereditano il font serif da globals.css

### Spacing
- Usa scala Tailwind standard (4, 8, 12, 16, 24, 32, 48, 64, 96)
- Sezioni: `py-16 md:py-24` per padding verticale
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

## Accessibilità (OBBLIGATORIO — verificare ad OGNI modifica)

**Ogni modifica al codice DEVE essere valutata per l'accessibilità WCAG 2.1 AA.**

### Checklist per ogni modifica
- [ ] Contrasto colori: 4.5:1 per testo normale, 3:1 per testo grande e UI components
- [ ] Testo su sfondi chiari: usare `text-primary-text` (NON `text-primary`, che ha solo 3.6:1)
- [ ] Immagini: `alt` descrittivo e localizzato (via i18n), o `alt=""` se decorativa
- [ ] Icone decorative: `aria-hidden="true"`
- [ ] Form input: `<label>` associato, errori con `aria-describedby` e `aria-invalid`
- [ ] Heading: gerarchia corretta (h1 → h2 → h3, mai saltare livelli, un solo h1 per pagina)
- [ ] Focus: ring visibile su tutti gli elementi interattivi
- [ ] Link/bottoni: testo leggibile o `aria-label`
- [ ] Animazioni: rispettare `prefers-reduced-motion` (usare `useReducedMotion()` di Framer Motion)
- [ ] Keyboard: tutti gli elementi interattivi raggiungibili via Tab
- [ ] Skip-link: mantenere come primo elemento focusable
- [ ] Dark mode: verificare che i contrasti siano validi anche in dark mode

## Analytics

- `@vercel/analytics` — pageviews e visitatori (privacy-friendly, no cookies)
- `@vercel/speed-insights` — Web Vitals reali (LCP, CLS, INP, TTFB)
- Entrambi integrati in `app/[locale]/layout.tsx`, attivi solo in produzione

## Deploy

- Piattaforma: Vercel
- Branch principale: `main`
- Build automatico su push
