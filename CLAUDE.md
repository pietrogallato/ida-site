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
- `--color-primary`: sage green (#6B8F71) — usare per CTA, link, accenti
- `--color-secondary`: warm beige (#D4C5A9) — usare per sfondi secondari
- `--color-accent`: soft teal (#5B9A8B) — usare per elementi di accento
- Dark mode: classe `dark` su `<html>`, variabili invertite automaticamente

### Typography
- Font: Inter (via next/font/google)
- Heading: `font-semibold` o `font-bold`
- Body: `font-normal` (400)

### Spacing
- Usa scala Tailwind standard (4, 8, 12, 16, 24, 32, 48, 64, 96)
- Sezioni: `py-16 md:py-24` per padding verticale
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

## Accessibilità (OBBLIGATORIO)

- Ogni immagine DEVE avere `alt` descrittivo (o `alt=""` se decorativa)
- Ogni form input DEVE avere `<label>` associato
- Errori form collegati con `aria-describedby`
- Gerarchia heading corretta (h1 → h2 → h3, mai saltare livelli)
- Focus ring visibile su tutti gli elementi interattivi
- Contrasto colori minimo 4.5:1 (testo normale) e 3:1 (testo grande)
- Tutti i bottoni/link con testo leggibile o `aria-label`
- Supporto `prefers-reduced-motion` per animazioni
- Skip-link come primo elemento focusable

## Deploy

- Piattaforma: Vercel
- Branch principale: `main`
- Build automatico su push
