# Security Audit Execution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eseguire la security audit descritta in `docs/superpowers/specs/2026-04-10-security-audit-design.md` e produrre il report `docs/superpowers/specs/2026-04-10-security-audit-report.md` con tutti i finding organizzati per Passata A/B/C, nel formato approvato.

**Architecture:** Questo è un piano di audit, non di codice: ogni task ispeziona una porzione della superficie di attacco del sito, applica una checklist concreta, e appende i finding trovati al report. Il report cresce in modo incrementale e viene committato dopo ogni task, così ogni task produce valore consegnabile da solo. TDD non si applica (non c'è codice da testare); la definizione di "done" per ogni task è "tutti i check della sezione sono stati valutati e i finding corrispondenti sono stati scritti nel report con evidence file:riga e il formato approvato".

**Tech Stack:** Next.js 16.1.6, React 19.2, TypeScript 5, next-intl 4, next-sanity 12, Resend 6, Sanity 5, Tailwind 4, Framer Motion 12, deploy Vercel.

**Formato finding (riferimento, da usare in tutti i task):**

```
### F-NN — Titolo sintetico
- **Severity**: Critical | High | Medium | Low
- **Category**: Input validation / Headers / GDPR / Supply chain / ...
- **Evidence**: `path/to/file.ts:42-58`
  \`\`\`ts
  // snippet opzionale
  \`\`\`
- **Impact**: scenario concreto di cosa può succedere
- **Exploitation**: facilità, prerequisiti, chi può farlo
- **Remediation**: fix consigliata (con codice se è modifica locale)
- **Effort**: S / M / L
```

**Regole di numerazione finding:**
- Numerazione globale progressiva `F-01`, `F-02`, ... attraverso tutto il report.
- Ogni task che aggiunge finding continua la numerazione dell'ultimo task.
- Se un task non trova nulla, scrive comunque nella sezione di appartenenza una riga `_Nessun finding._` per documentare che l'area è stata esaminata.

**Regola GDPR amplifier (dalla spec §3):** finding che toccano dati del form contatti salgono di un livello di severità. Applicala esplicitamente quando rilevante.

---

## File Structure

**File prodotto dall'audit:**
- Create: `docs/superpowers/specs/2026-04-10-security-audit-report.md`

**File letti (non modificati) durante l'audit:**
- `app/api/contact/route.ts`
- `app/api/revalidate/route.ts`
- `app/studio/[[...tool]]/page.tsx`, `app/studio/[[...tool]]/layout.tsx`
- `sanity.config.ts`, `sanity.cli.ts`, `sanity/schemas/*`
- `next.config.ts`
- `proxy.ts` (middleware next-intl)
- `app/layout.tsx`, `app/[locale]/layout.tsx`
- `app/robots.ts`, `app/sitemap.ts`
- `app/[locale]/privacy/**/*`
- `components/sections/contact-form.tsx`
- `lib/sanity.ts`, `lib/emails/*`, `lib/portable-text-components.tsx`
- `package.json`, `package-lock.json`
- `.env*` (se presenti — solo nomi variabili, mai valori)
- `i18n/routing.ts`, `i18n/request.ts`
- Qualsiasi altro file toccato dall'area in esame

---

## Task 1: Initialize report file and structure

**Files:**
- Create: `docs/superpowers/specs/2026-04-10-security-audit-report.md`

**Rationale:** Creare lo scheletro del report con tutte le sezioni vuote così i task successivi possono appendere finding nella sezione giusta senza dover ricreare la struttura ogni volta.

- [ ] **Step 1: Verificare commit di partenza**

```bash
git rev-parse HEAD
git status --short
```

Expected: albero pulito o solo file non-tracciati irrilevanti. Annotare il SHA di partenza — andrà nel campo "commit analizzato" del report.

- [ ] **Step 2: Creare il report con lo scheletro completo**

Contenuto iniziale (scrivere come file nuovo):

```markdown
# Security Audit Report — Ida Sato Site

**Data**: 2026-04-10
**Commit analizzato**: <SHA-dal-step-1>
**Design di riferimento**: `docs/superpowers/specs/2026-04-10-security-audit-design.md`
**Scala severità**: Critical / High / Medium / Low (regole in design §5)
**Threat model (pesi)**: 1) PII form contatti (GDPR-first) → 2) Spam/bot → 3) Attacker mirato

---

## 1. Executive summary

_Da compilare nel Task 12 (dopo aver raccolto tutti i finding)._

---

## 2. Scope & threat model (recap)

Vedi design `docs/superpowers/specs/2026-04-10-security-audit-design.md` §2-§3.

---

## 3. Findings — Passata A (attack surface)

### 3.1 `POST /api/contact`

_Da compilare nel Task 2._

### 3.2 `POST /api/revalidate`

_Da compilare nel Task 3._

### 3.3 `/studio/*`

_Da compilare nel Task 4._

### 3.4 Client bundle pubblico

_Da compilare nel Task 5._

### 3.5 Query Sanity (GROQ)

_Da compilare nel Task 5._

### 3.6 Form client e rendering contenuti CMS

_Da compilare nel Task 5._

---

## 4. Findings — Passata B (checklist trasversale)

### 4.1 Security headers

_Da compilare nel Task 6._

### 4.2 Gestione segreti ed env

_Da compilare nel Task 7._

### 4.3 Supply chain / dipendenze

_Da compilare nel Task 8._

### 4.4 Logging, error handling, robots/sitemap, routing i18n

_Da compilare nel Task 9._

### 4.5 Resend delivery, backup, monitoring

_Da compilare nel Task 10._

---

## 5. Findings — Passata C (GDPR gap analysis)

_Da compilare nel Task 11._

---

## 6. Dependency audit (output sintetico)

_Da compilare nel Task 8._

---

## 7. External configuration recommendations

_Da compilare nel Task 10 (consolidato)._

---

## 8. Remediation roadmap

_Da compilare nel Task 12 (ordinata per severity × 1/effort)._
```

- [ ] **Step 3: Sostituire `<SHA-dal-step-1>` con lo SHA reale**

Editare il report e rimpiazzare `<SHA-dal-step-1>` con il valore stampato dallo Step 1.

- [ ] **Step 4: Commit dello scheletro**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs: init security audit report skeleton"
```

**Definition of done:** il file esiste, ha tutte le sezioni previste, lo SHA è reale, commit fatto.

---

## Task 2: Review `POST /api/contact` (Passata A.1)

**Files:**
- Read: `app/api/contact/route.ts`
- Read: `components/sections/contact-form.tsx`
- Read: `lib/emails/contact-email.tsx` (o il file che esporta `ContactEmail`)
- Read: `types/` (ricerca `ContactFormData`, `ContactAPIResponse`)
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 3.1)

- [ ] **Step 1: Leggere tutti i file dell'entry point**

Leggere integralmente `app/api/contact/route.ts`, `components/sections/contact-form.tsx`, `lib/emails/contact-email.tsx` e i tipi correlati.

- [ ] **Step 2: Applicare questa checklist concreta e raccogliere finding**

Per ciascuna voce, decidere: (a) nessun issue, (b) finding. Nota severità considerando l'amplifier GDPR (qui sempre applicabile perché si toccano PII potenzialmente art. 9).

**Input validation:**
1. Content-Type è verificato? Accettato solo `application/json`? → vedere riga 35-38.
2. I campi sono validati server-side (presenza, lunghezza massima, formato)? → riga 64-73.
3. Il `name` ha un limite di lunghezza *prima* di essere usato in `subject` email?
4. Il `phone` è validato (lunghezza, pattern) o solo troncato?
5. Il `message` ha un limite? C'è un minimo? Pattern per rifiutare solo URL spam?
6. C'è un limite di body size (bytes) sul POST? Default Next.js = 1MB? Documentare.
7. Il regex email `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` è sufficiente, o permette pattern che potrebbero fare injection? (notare: `@` vietato evita `\r\n` nei casi tipici ma non tutti).

**Email header injection:**
8. `replyTo = sanitizedEmail` → è stato sanitizzato per `\r\n`? → riga 76.
9. `subject` include `${sanitizedName}` → `sanitizedName` è stato sanitizzato per `\r\n`? Se no, è un finding **High+amplifier → Critical** o **High** a seconda dello sfruttamento.
10. Il body text include nome/email/phone/message non escapati per newline/control chars? In `text` è OK (è plain text), ma nel react template (`ContactEmail`) viene escapato correttamente da React? Verificare.
11. `from` è hard-coded `onboarding@resend.dev`? Se sì, è il sender di test di Resend: non abilita DMARC alignment sul dominio del cliente, non è brandabile. Questo è un finding di config (High) per il threat model GDPR (email PII su dominio non controllato).

**Rate limiting:**
12. Il rate limit è in-memory (`Map`) → su Vercel serverless ogni invocation può avere un'istanza diversa → il limite è per-lambda-istanza, non per-IP globale. Finding **High** (bypass banalmente).
13. La `Map` non viene mai pulita → memory leak nel tempo di vita di un'istanza lambda calda. Finding **Low/Medium**.
14. IP è estratto da `x-forwarded-for` primo elemento → su Vercel è fidato, ma confermare che non esiste un modo di spoofarlo. Se l'app non valida la provenienza di `x-forwarded-for`, annotare. Su Vercel è rewritten quindi OK, ma va documentato.
15. Rate limit: 5 req / 15 min → valutare se è ragionevole per un form contatti.

**Honeypot / timing:**
16. Honeypot ritorna `success: true` fake → corretto per non dare hint ai bot.
17. Timing check `< 2s` è server-side ma usa `body.timestamp` che arriva dal client → un bot può inviare timestamp arbitrario. Finding **Low** (difesa in profondità inefficace).

**PII / logging:**
18. `console.error("Resend error:", error)` → cosa contiene `error`? Potenzialmente il body dell'email con PII del mittente. Finding **High** (PII in log Vercel).
19. `console.error("Contact API error")` nel catch → non include il body esplicitamente, ma se Next mette il request log automatico potrebbe esserci leak. Documentare.
20. `console.warn("CONTACT_EMAIL env variable is not set")` al module load → solo metadata, OK.

**DoS / resource:**
21. Nessun timeout esplicito sulla chiamata Resend.
22. Nessun limite sul numero di richieste concorrenti per questo endpoint.
23. Il body viene parsato con `request.json()` senza `maxSize`: Next default 1MB. Documentare.

**Error response leakage:**
24. I messaggi di errore restituiti sono generici ("Invalid content type", "Too many requests", "Failed to send email"): OK.
25. Lo stack trace non viene mai ritornato al client: OK.

**Client-side (`contact-form.tsx`):**
26. Il timestamp usato per il timing check viene generato client-side: come sopra, facile da spoofare.
27. L'honeypot è `position: -9999px` + `tabIndex=-1` + `aria-hidden`: OK per a11y e bot naive. Bot sofisticati lo ignorano.
28. Nessun token CSRF: in pratica il form è `same-origin` only e l'endpoint accetta solo JSON con Content-Type esplicito (cross-origin form submission non può impostare Content-Type non semplice senza preflight) → è protetto "by default" dalle regole CORS del browser. Documentare come safe ma annotare la dipendenza da quel meccanismo.
29. Nessun CAPTCHA: per un form contatti di bassa volumetria è accettabile; per spam sofisticato no. Annotare come Medium (hardening) se serve.

- [ ] **Step 3: Scrivere la sezione 3.1 del report con i finding trovati**

Per ogni finding identificato nello Step 2, appenderlo sotto l'heading `### 3.1 POST /api/contact`, sostituendo il placeholder `_Da compilare nel Task 2._`. Numerazione progressiva iniziando da `F-01`. Se una voce della checklist non produce finding, non scrivere nulla (non "F-NN: OK"). Se tutta la sezione è pulita, scrivere `_Nessun finding in quest'area._`.

Usare il formato finding standard. Includere snippet di codice dove utile a rendere concreto l'exploit.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 3.1 POST /api/contact findings"
```

**Definition of done:** tutti i 29 punti della checklist sono stati valutati; i finding sono scritti nella sezione 3.1 col formato standard; numerazione globale iniziata da F-01.

---

## Task 3: Review `POST /api/revalidate` (Passata A.2)

**Files:**
- Read: `app/api/revalidate/route.ts`
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 3.2)

- [ ] **Step 1: Leggere il file integralmente**

- [ ] **Step 2: Applicare questa checklist e raccogliere finding**

1. La signature è verificata con `@sanity/webhook` prima di qualsiasi parsing del payload? → riga 11-13. Sì.
2. `const secret = process.env.SANITY_REVALIDATION_SECRET!` usa non-null assertion senza early exit. Se la variabile manca in runtime, `isValidSignature(body, signature, undefined)` fallisce o crasha silenziosamente? Leggere il codice di `@sanity/webhook` se necessario. Finding **Medium** (config fragile; in prod segreto probabilmente settato, ma se qualcuno lo rimuove il webhook accetta comunque tutto o crasha — entrambe sono brutte).
3. `body = req.text()` prima → OK (la signature di solito è calcolata sul raw body).
4. `JSON.parse(body)` dopo la verifica → OK.
5. `payload.slug.current` viene interpolato in `revalidatePath(\`/it/blog/${payload.slug.current}\`)`. C'è rischio di path traversal? `revalidatePath` di Next.js accetta un path, un slug malevolo come `../../`? Verificare il comportamento di `revalidatePath` con path arbitrari. Finding **Low/Medium** se può causare invalidazione di path non previste; **Low** se Next normalizza.
6. Il payload non valida `_type` contro una whitelist: `if (payload._type === "testimonial")` altrimenti fallback su "blog". Un `_type` arbitrario ricade nel blog branch. Impact: basso (solo revalidation extra), ma è un'ambiguità. Finding **Low**.
7. Nessun rate limit sull'endpoint revalidate: un attaccante con signature valida potrebbe fare DoS su revalidation? Improbabile (Sanity controlla chi può creare webhook), ma annotare.
8. Errore 401 generico: OK.
9. Nessuna log di abuse / invocazioni sospette: annotare.
10. Amplification: ogni call revalidate fino a 5 path (sitemap + blog IT/EN + slug IT/EN). Costo accettabile.

- [ ] **Step 3: Scrivere la sezione 3.2 del report**

Sostituire `_Da compilare nel Task 3._` con i finding. Continuare la numerazione globale.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 3.2 POST /api/revalidate findings"
```

**Definition of done:** 10 punti valutati, sezione 3.2 compilata, commit fatto.

---

## Task 4: Review `/studio/*` (Passata A.3)

**Files:**
- Read: `app/studio/[[...tool]]/page.tsx`
- Read: `app/studio/[[...tool]]/layout.tsx`
- Read: `sanity.config.ts`
- Read: `sanity.cli.ts`
- Read: `next.config.ts` (sezione headers `/studio/:path*`)
- Read: `app/robots.ts`
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 3.3)

- [ ] **Step 1: Leggere tutti i file**

- [ ] **Step 2: Applicare questa checklist e raccogliere finding**

1. La route `/studio` è pubblicamente accessibile? Sì, non c'è middleware auth. Documentare come comportamento atteso (Sanity Studio gestisce auth internamente).
2. Quale authentication method usa Sanity Studio? Verificare in `sanity.config.ts` — ci sono auth customizations? Se no, è l'auth di default di Sanity (SSO + email magic link). Verificare che `sanity.io` controlli effettivamente che l'utente sia membro del progetto prima di permettere operazioni.
3. Anche senza login, la UI Sanity Studio viene servita (mostra solo il form di login). Un attaccante può enumerare `projectId` e `dataset` guardando il bundle client. Sono già in `NEXT_PUBLIC_SANITY_PROJECT_ID` → informazione pubblica by design. Finding **Low** (documentare esposizione).
4. Headers CSP per `/studio/:path*` (next.config.ts riga 16-22): ha SOLO `X-Content-Type-Options` e `Referrer-Policy`. **NON ha** `X-Frame-Options`, **NON ha** `Content-Security-Policy`, **NON ha** `Permissions-Policy`. Questo significa che Studio può essere iframe-embeddato da qualsiasi origine? Verificare se Sanity Studio stesso imposta frame-ancestors lato JS (improbabile, deve essere a livello HTTP). Finding **Medium/High** (clickjacking dello studio, che può portare a takeover se combinato con social engineering di un amministratore loggato).
5. Robots: `/studio` è indicizzato dai motori di ricerca? Verificare `app/robots.ts`. Se non è escluso, è un Medium (SEO noise, attack surface discovery).
6. Vision tool è abilitato (`visionTool()` in plugins). Vision permette query GROQ arbitrarie. Per un utente loggato con permessi read, può leggere dati sensibili. Se il dataset contiene dati privati (bozze, email clienti), è un vettore di esfiltrazione. Verificare cosa c'è nel dataset. Finding severità dipende dal contenuto.
7. `structureTool()` permette CRUD. Stessa considerazione: protetto da auth Sanity.
8. `basePath: "/studio"` è coerente con `app/studio`. OK.
9. CORS origins: verificato in Sanity manage (esterno al repo). Annotare come external config recommendation (Task 10).
10. Access control: chi ha accesso al progetto Sanity? Esterno al repo, annotare come raccomandazione.
11. 2FA sugli account con accesso: stessa cosa, annotare.
12. Il bundle Studio ha dipendenze pesanti (`sanity` v5, `@sanity/vision`, `styled-components`) che girano in client-land: verificare se ci sono CVE note per queste. Link al Task 8 (supply chain).

- [ ] **Step 3: Scrivere la sezione 3.3 del report**

Compilare con i finding. Link-back a Task 8 e Task 10 per i punti cross-cut.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 3.3 /studio findings"
```

**Definition of done:** 12 punti valutati, sezione 3.3 compilata, commit fatto.

---

## Task 5: Review client bundle + GROQ + form/CMS rendering (Passata A.4 + A.5 + A.6)

**Files:**
- Read: `lib/sanity.ts`
- Read: `lib/portable-text-components.tsx`
- Read: `app/layout.tsx`
- Read: `app/[locale]/layout.tsx`
- Read: `app/[locale]/blog/**/*.tsx` (render di PortableText)
- Read: `components/layout/*.tsx` (analytics, header, footer)
- Read: `next.config.ts` (images remotePatterns, CSP connect-src/frame-src)
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezioni 3.4, 3.5, 3.6)

Questo task combina tre sotto-sezioni perché sono strettamente correlate e più piccole delle altre.

- [ ] **Step 1: Leggere tutti i file rilevanti**

- [ ] **Step 2: Sezione 3.4 — Client bundle pubblico**

Checklist:
1. Enumerare tutte le variabili `NEXT_PUBLIC_*` referenziate nel codice:
   ```bash
   grep -rn "NEXT_PUBLIC_" --include="*.ts" --include="*.tsx" app/ components/ lib/ i18n/ sanity/
   ```
2. Per ciascuna: è public by design (OK), o è un leak accidentale?
3. Ci sono altre stringhe hardcoded sensibili? URL interni? Email che non dovrebbero essere nel bundle? Endpoint privati?
4. Vercel Analytics e Speed Insights: leggere `app/[locale]/layout.tsx`. Stanno mandando dati a `va.vercel-scripts.com` e `vitals.vercel-insights.com` (coerente con CSP connect-src). Documentare come processor Vercel.
5. Google Maps embed: verificare dove viene usato (`frame-src https://www.google.com` nella CSP suggerisce uso embed). Implica un GET third-party da Google con user IP + Referer. Finding **Low** (GDPR-rilevante: Google come processor non dichiarato). Amplifier NON si applica (non è del form).
6. Google Fonts: CSP ha `fonts.googleapis.com` e `fonts.gstatic.com`. Se le font sono caricate direttamente da Google, implica IP degli utenti passati a Google. Verificare: sono self-hosted via `next/font` (preferito per privacy) o caricate run-time da `fonts.googleapis.com`? Leggere come vengono caricate le font. Se via `next/font/google`, Next le downloada al build time e le serve self-hosted → CSP ha le entries ma non sono usate → finding **Low** (CSP over-permissiva, pulizia). Se sono via `<link>`, finding **Medium** (GDPR — IP utenti verso Google).
7. Source maps in produzione: sono esposte? Verificare `next.config.ts` per `productionBrowserSourceMaps` e output effettivo. Default Next.js = false. Documentare.
8. Sentry / error tracking: verificare se presente. Se sì, verificare sanitizzazione PII.

- [ ] **Step 3: Sezione 3.5 — Query Sanity (GROQ)**

Checklist su `lib/sanity.ts`:
1. Tutte le query usano parametri `$variable` invece di template interpolation? Scorrere ogni `client.fetch(...)`:
   - `getPosts` → `$locale`, `$topicSlug`. Parametrizzato ✓. Ma `${hasTopicFilter ? '&& topic->slug.current == $topicSlug' : ''}` è template di struttura query — non è user input, è un booleano. OK.
   - `getPostBySlug` → `$slug`, `$locale`. OK.
   - `getResources` → `$contentType`, `$topicSlug`. OK.
   - `getTopics`, `getFeaturedTestimonials`, `getAllTestimonials`, `getTestimonialStats`, `getAllPostSlugs` → nessun input esterno. OK.
   - `getAllBlogItems` → usa branch; params sono scope locale. OK.
   - `getBlogCounts` → `$locale`, `$topicSlug`. OK.
2. Overfetching: ogni query ritorna solo i campi necessari? In particolare per i `testimonial` verificare che campi PII (email cliente se presente nello schema, dati interni) non siano esposti al client. Leggere `sanity/schemas/*` per testimonial.
3. `useCdn: true` → significa che i dati possono essere cached fino a ~1 min. Non è un rischio di sicurezza, ma annotare se qualche dato deve essere sempre fresh (non sembra il caso).
4. Le query vengono eseguite server-side (dentro server components)? O anche client-side? Verificare se `client.fetch` è mai chiamato da un `"use client"` component. Se sì, il dataset ID e il traffico diventano visibili al client — comunque già visibili.
5. Il dataset è `public` o `private`? Visible da `sanity.cli.ts` / config. Se è `public`, significa che chiunque può fare query GROQ arbitrarie usando il projectId pubblico. Questo è enorme: significa che la protezione contro data exfil dipende interamente da cosa è nel dataset. Finding **Critical** o **High** a seconda del contenuto. Verificare cosa contiene il dataset (testimonials con nomi? bozze post? commenti clienti?).

- [ ] **Step 4: Sezione 3.6 — Form client e rendering contenuti CMS**

Checklist:
1. `contact-form.tsx`: ci sono punti in cui input utente viene renderizzato non-escaped? (Di base React escapa tutto, ma `dangerouslySetInnerHTML` sarebbe un red flag). Verificare.
2. `lib/portable-text-components.tsx`: leggere tutti i custom components. Particolare attenzione a:
   - Block con `href` esterno: viene renderizzato con `rel="noopener noreferrer"` e `target="_blank"`? Reverse tabnabbing. Se `target="_blank"` senza `rel="noopener"`, finding **Medium**.
   - Immagini: sono caricate solo da `cdn.sanity.io` (coerente con `images.remotePatterns` e CSP `img-src`)? O si accettano URL arbitrari?
   - HTML custom / iframe: esistono marks o block che iniettano HTML raw?
3. Tutte le pagine che renderizzano contenuto CMS (blog post body, testimonial text): il testo passa da `@portabletext/react` (safe by default) o da `dangerouslySetInnerHTML`? Verificare.
4. Link esterni in generale (hero, footer, navigation): controllare `target="_blank"` + `rel`.

- [ ] **Step 5: Scrivere le tre sezioni nel report**

Compilare 3.4, 3.5, 3.6 con i finding. Continuare numerazione globale.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add sections 3.4-3.6 client bundle, GROQ, CMS rendering"
```

**Definition of done:** sezioni 3.4, 3.5, 3.6 compilate; tutti i check fatti; commit.

---

## Task 6: Security headers completeness (Passata B.1)

**Files:**
- Read: `next.config.ts`
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 4.1)

- [ ] **Step 1: Leggere `next.config.ts` sezione headers integralmente**

- [ ] **Step 2: Checklist headers completi**

Per ogni header di sicurezza, verificare presenza e valore. Per ciascuno mancante/debole → finding.

**Headers già presenti (verificare valore):**
1. `X-Content-Type-Options: nosniff` → presente. OK.
2. `X-Frame-Options: DENY` → presente (routes non-studio). OK per non-studio. Manca su /studio (già rilevato Task 4).
3. `Referrer-Policy: strict-origin-when-cross-origin` → presente. OK (alternativa più restrittiva: `no-referrer`, ma per i link esterni legittimi è OK).
4. `Permissions-Policy: camera=(), microphone=(), geolocation=()` → presente ma limitata a 3 feature. Mancano molte altre (payment, usb, magnetometer, accelerometer, gyroscope, fullscreen, picture-in-picture, autoplay, encrypted-media, midi, display-capture, clipboard-read, clipboard-write, ecc.). Finding **Low/Medium** (hardening).
5. `Content-Security-Policy`:
   - `default-src 'self'` ✓
   - `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com` → **`unsafe-inline`** è un problema. Next.js 16 supporta nonce-based CSP? Finding **High** se può essere eliminato, **Medium/Low** se è un tradeoff noto accettato con compensanti.
   - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` → `unsafe-inline` su style è meno grave ma comunque evitabile. Finding **Medium**.
   - `font-src 'self' https://fonts.gstatic.com` → se usiamo `next/font` self-hosted, `fonts.gstatic.com` è non necessario (over-permissive). Finding **Low**.
   - `img-src 'self' data: blob: https://cdn.sanity.io` → `data:` e `blob:` aumentano superficie. Documentare se necessari (OG images, canvas generation). Finding **Low**.
   - `connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com` → OK per analytics.
   - `frame-src 'self' https://www.google.com` → per Google Maps embed. Implica Google come processor. Finding **Medium** (GDPR — annotare anche in Passata C).
   - `frame-ancestors 'none'` ✓ (anti-clickjacking).
   - **MANCANTI** (elencare tutti come finding **Low/Medium** hardening):
     - `base-uri 'none'` o `base-uri 'self'` (previene `<base href>` injection).
     - `form-action 'self'` (controlla dove i form possono fare POST).
     - `object-src 'none'` (blocca Flash/plugin legacy).
     - `upgrade-insecure-requests` (forza HTTPS per sub-resources).
     - `worker-src 'self'` (se non usati, restringere).
     - `manifest-src 'self'` (se c'è un webmanifest).

**Headers COMPLETAMENTE assenti (findings Medium/Low):**
6. `Strict-Transport-Security` (HSTS) → non presente. Vercel di default imposta `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` ma dovrebbe essere esplicito nel codice. Finding **Medium** (documentare che dipende da config Vercel, non da repo).
7. `Cross-Origin-Opener-Policy` → non presente. Per un sito con embed (Google Maps) attivare `same-origin-allow-popups` è ragionevole. Finding **Low**.
8. `Cross-Origin-Embedder-Policy` → non presente. Finding **Low**.
9. `Cross-Origin-Resource-Policy` → non presente. Finding **Low**.
10. `X-DNS-Prefetch-Control` → non critico.
11. `X-XSS-Protection` → deprecato, OK assente.

- [ ] **Step 3: Scrivere la sezione 4.1 del report**

Documentare ogni finding con snippet di `next.config.ts:xx-yy`. Per le CSP carenti, proporre una CSP rafforzata come remediation (sarà utile quando si scriverà il fix plan).

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 4.1 security headers findings"
```

**Definition of done:** tutti gli headers sopra elencati sono stati valutati, sezione 4.1 compilata, commit.

---

## Task 7: Secrets management and env variables (Passata B.2)

**Files:**
- Read: `.env.example` (se esiste), `.env.local` (solo nomi), `.env` (solo nomi)
- Read: `next.config.ts`, `proxy.ts`, `app/layout.tsx`, `app/[locale]/layout.tsx`
- Read: tutti i file che usano `process.env.*`
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 4.2)

- [ ] **Step 1: Enumerare tutti gli usi di `process.env`**

```bash
grep -rn "process\.env\." --include="*.ts" --include="*.tsx" app/ components/ lib/ i18n/ sanity/ next.config.ts proxy.ts sanity.config.ts sanity.cli.ts
```

- [ ] **Step 2: Per ogni variabile, decidere se è pubblica o segreta**

Classificare:
- **Pubbliche (`NEXT_PUBLIC_*`)**: finiscono nel bundle client.
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - Altre?
- **Segrete (server-only)**:
  - `RESEND_API_KEY`
  - `CONTACT_EMAIL`
  - `SANITY_REVALIDATION_SECRET`
  - Altre?

- [ ] **Step 3: Checklist**

1. Nessuna variabile segreta è mai prefissata `NEXT_PUBLIC_`: verificare con grep.
2. Nessuna chiave API è hardcoded nel codice: cercare pattern come `sk_live`, `re_`, stringhe base64 lunghe, ecc.
3. Le non-null assertions (`process.env.FOO!`) sono sicure? Se la variabile manca, crash runtime. Casi trovati:
   - `lib/sanity.ts:5-6` (`NEXT_PUBLIC_SANITY_PROJECT_ID!`, `NEXT_PUBLIC_SANITY_DATASET!`) → se mancano al build time il sito non build-a, quindi OK.
   - `sanity.config.ts:9-10` stessa storia.
   - `app/api/revalidate/route.ts:5` (`SANITY_REVALIDATION_SECRET!`) → già rilevato Task 3.
4. File `.env.example` esiste e documenta tutte le variabili necessarie? Se no, finding **Low** (developer UX).
5. `.env.local`, `.env`, `.env.production` sono in `.gitignore`? Verificare:
   ```bash
   cat .gitignore | grep -E "^\.env"
   ```
6. Nessun file `.env*` è tracciato nel git:
   ```bash
   git ls-files | grep -E "^\.env"
   ```
7. Il `RESEND_API_KEY` è usato solo server-side? Grep per conferma: `grep -rn "RESEND_API_KEY" --include="*.ts" --include="*.tsx"`. Dovrebbe apparire solo in `app/api/contact/route.ts`.
8. `CONTACT_EMAIL`: stesso check. Solo server-side.
9. `SANITY_REVALIDATION_SECRET`: solo server-side.

- [ ] **Step 4: Scrivere la sezione 4.2**

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 4.2 secrets and env findings"
```

**Definition of done:** tutte le env enumerate e classificate; 9 punti valutati; commit.

---

## Task 8: Supply chain / dependency audit (Passata B.3)

**Files:**
- Read: `package.json`, `package-lock.json`
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezioni 4.3 e 6)

- [ ] **Step 1: Eseguire `npm audit`**

```bash
npm audit --json > /tmp/npm-audit.json 2>&1 || true
cat /tmp/npm-audit.json | head -200
```

Salvare l'output completo, poi creare un riassunto.

Alternativa se `--json` è rumoroso:

```bash
npm audit 2>&1 | head -100
```

- [ ] **Step 2: Eseguire `npm outdated`**

```bash
npm outdated 2>&1 | head -50
```

- [ ] **Step 3: Per ogni dipendenza diretta, verificare stato di manutenzione**

Lista dipendenze dirette da `package.json`:
- `@portabletext/react`, `@radix-ui/*`, `@react-email/components`, `@sanity/*`, `@vercel/*`, `clsx`, `framer-motion`, `lucide-react`, `next`, `next-intl`, `next-sanity`, `react`, `react-dom`, `resend`, `sanity`, `styled-components`

Per ciascuna, verificare:
- Versione installata vs. latest (da `npm outdated`)
- CVE noti (da `npm audit`)
- Manutenzione attiva (ultimo release date)

Per pacchetti con CVE o versioni molto obsolete, creare un finding dedicato.

- [ ] **Step 4: Attenzione particolare a:**

1. `next` 16.1.6 → verificare che sia la latest patch di 16.1.x (bugfix di sicurezza).
2. `react` 19.2 → verificare latest.
3. `sanity` 5.18 → verificare latest (Sanity ha rilasciato 6.x?). Se major obsoleto, finding **Medium**.
4. `styled-components` 6.3.12 → in un progetto Tailwind, perché è presente? Probabilmente dipendenza transitiva di sanity. Se diretta, è un red flag (dead code, attack surface). Verificare.
5. `framer-motion` 12.34.3 → animation lib, CVE rari.
6. `resend` 6.9.2 → latest?

- [ ] **Step 5: Scrivere sezione 4.3 (findings supply chain) e sezione 6 (dependency audit output sintetico)**

Sezione 6 = tabella compatta delle dipendenze con versione installata, latest, severità vulnerabilità se presenti.
Sezione 4.3 = finding narrativi sui problemi trovati (pacchetti obsoleti maggiori, CVE sfruttabili, dipendenze inutili).

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 4.3 supply chain and section 6 dependency audit"
```

**Definition of done:** `npm audit` eseguito, `npm outdated` eseguito, ogni dipendenza diretta valutata, sezioni 4.3 e 6 compilate, commit.

---

## Task 9: Logging, error handling, robots/sitemap, i18n routing (Passata B.4)

**Files:**
- Read: `app/global-error.tsx`, `app/[locale]/error.tsx`, `app/[locale]/not-found.tsx`
- Read: `app/robots.ts`, `app/sitemap.ts`
- Read: `proxy.ts`, `i18n/routing.ts`, `i18n/request.ts`
- Read: tutti gli usi di `console.*` nel codice
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 4.4)

- [ ] **Step 1: Enumerare tutti gli usi di `console.log`, `console.error`, `console.warn`, `console.info`**

```bash
grep -rn "console\." --include="*.ts" --include="*.tsx" app/ components/ lib/ i18n/ sanity/
```

- [ ] **Step 2: Checklist logging**

1. Nessun `console.log` con payload utente (PII): scorrere i risultati. Se un log include direttamente `body`, `email`, `name`, `message`, `phone` → finding **High+amplifier → Critical** (PII in log retention Vercel).
2. `console.error("Resend error:", error)` in `api/contact` già rilevato Task 2 — fare cross-reference.
3. Error boundaries (`error.tsx`, `global-error.tsx`): mostrano stack trace in produzione? React Error Boundary di default in prod mostra solo un messaggio generico. Verificare.

- [ ] **Step 3: Checklist error handling**

1. I catch block nelle API routes non rimandano `error.message` al client: verificato in Task 2 per `/api/contact`. Fare lo stesso per `/api/revalidate` (Task 3 non l'ha controllato esplicitamente — controllare ora).
2. Gli error boundary non leakano info interne.

- [ ] **Step 4: Robots e sitemap**

1. Leggere `app/robots.ts`:
   - `/studio` è escluso da indexing? Se no, finding **Medium**.
   - `/api/*` è escluso? Se no, finding **Low** (crawler potrebbe hit l'API).
   - `/studio/vision` (GROQ explorer) indicizzato? Importante escludere.
2. Leggere `app/sitemap.ts`:
   - La sitemap enumera solo pagine pubbliche?
   - Nessun URL privato (admin, preview)?
   - Gestisce entrambi i locale?

- [ ] **Step 5: i18n routing**

1. `proxy.ts` (middleware) → solo next-intl routing. Verificare che non ci sia un match `/:path*` con redirect che potrebbe diventare open redirect.
2. `i18n/routing.ts` → localePrefix, pathnames. Verificare che non ci siano pattern che permettono locale arbitrario.
3. Trailing slash behavior: gestito uniformemente?
4. Locale injection: un URL `/xx-malicious/page` viene rifiutato correttamente?

- [ ] **Step 6: Scrivere la sezione 4.4 del report**

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 4.4 logging, errors, robots, i18n"
```

**Definition of done:** tutti i 4 sotto-ambiti valutati, sezione 4.4 compilata, commit.

---

## Task 10: Resend delivery, backup, monitoring + External config recommendations (Passata B.5 + section 7)

**Files:**
- Read: `lib/emails/contact-email.tsx`
- Read: `app/api/contact/route.ts` (sezione Resend)
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezioni 4.5 e 7)

- [ ] **Step 1: Checklist Resend delivery**

1. Mittente `from`: `"Sito Ida Sato <onboarding@resend.dev>"` → è il dominio di test Resend. Finding **High** (vedi Task 2). Reiterare qui e strutturare come raccomandazione esterna.
2. DMARC alignment: usando `onboarding@resend.dev`, il dominio dell'utente Ida non ha controllo né visibilità sulla reputazione email. Se l'utente vuole inviare da `@dominio-ida.it` deve configurare:
   - Dominio verificato in Resend dashboard.
   - SPF record DNS.
   - DKIM record DNS.
   - DMARC record DNS.
3. Link tracking: Resend ha feature di link tracking (embeds un redirect Resend nei link). È abilitato di default? Se sì, implica che il mittente sa quando il destinatario clicca — questo è un trattamento dati e va dichiarato in privacy policy o disabilitato.
4. Email body contiene PII: il destinatario è `CONTACT_EMAIL` (quindi Ida stessa), non terze parti. Il contenuto in transito è TLS (Resend → inbox destinazione). A riposo, nei log Resend, le email vengono conservate X giorni: verificare retention policy Resend e documentare.

- [ ] **Step 2: Checklist backup / DR**

1. Sanity dataset: esiste un backup/export programmato? Sanity offre export CLI (`sanity dataset export`). Verificare nella config o docs interne. Se no, raccomandare setup.
2. Vercel: il codice è su git (GitHub?). Il deploy history è su Vercel (rollback possibile). Annotare.
3. Env secrets: dove sono backed up? Se solo su Vercel dashboard, un'eliminazione accidentale li perde. Raccomandare 1Password/Bitwarden/file cifrato offline.

- [ ] **Step 3: Checklist monitoring / alerting**

1. Visibilità su abuse di `/api/contact`: esistono alert su spike di traffic? Vercel ha logs ma non alerting out of the box sui pattern. Raccomandare setup minimo (Vercel Log Drains + alerting esterno, o Uptime Robot/Better Stack per synthetic).
2. Alerting su 5xx da `/api/contact` e `/api/revalidate`: stessa cosa.
3. Uptime monitoring esterno: se il sito va giù, l'utente lo scopre? Raccomandare.

- [ ] **Step 4: Scrivere sezione 4.5 (findings Resend/backup/monitoring) e sezione 7 (external config recommendations consolidata)**

Sezione 7 deve raccogliere tutte le raccomandazioni esterne dai task precedenti in un'unica checklist azionabile per l'utente:
- DNS: SPF/DKIM/DMARC per dominio Resend verificato.
- Vercel: Firewall rules, log drains, rate limit edge, protection bypass token.
- Sanity: gestione accessi, 2FA, CORS origins, backup dataset.
- Privacy policy: integrazioni da aggiornare (dal Task 11).
- Monitoring/alerting: uptime, error rate, abuse detection.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 4.5 Resend/backup/monitoring and section 7 external recs"
```

**Definition of done:** sezioni 4.5 e 7 compilate, commit.

---

## Task 11: GDPR gap analysis (Passata C)

**Files:**
- Read: `app/[locale]/privacy/**/*.tsx`
- Read: tutti i file già letti nei task precedenti (riferirsi a note accumulate)
- Read: `messages/it.json`, `messages/en.json` (sezioni privacy se presenti)
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezione 5)

- [ ] **Step 1: Enumerare tutti i dati personali effettivamente raccolti dal codice**

Lista attesa:
- Form contatti: `name`, `email`, `phone` (opzionale), `message` (potenziali dati art. 9 GDPR → sensibili).
- Rate limit: `ip` (da `x-forwarded-for`).
- Vercel Analytics: raccoglie pageview, referrer, user agent, country, device type (nessun cookie, "privacy-friendly" ma comunque trattamento dati).
- Vercel Speed Insights: Web Vitals (LCP, CLS, INP) → nessun PII per sé, ma combinato è fingerprintable.
- Google Maps embed (se usato): IP + Referer inviato a Google.
- Google Fonts (se caricate da CDN): IP + Referer a Google.
- Log server Vercel: IP, user agent, path, timing (retention default Vercel).
- Log Resend: email destinatario + contenuto (retention Resend).
- Dataset Sanity: contenuto editoriale (non PII di utenti del sito, se non si salvano submission nel CMS — verificare che il form contatti NON scriva in Sanity).

- [ ] **Step 2: Enumerare tutti i processor/terze parti realmente toccati**

- Resend (email provider)
- Sanity (CMS)
- Vercel (hosting + Analytics + Speed Insights)
- Google (Fonts via CDN, se applicabile; Maps embed, se applicabile)
- Eventuali altri rilevati nei task precedenti

- [ ] **Step 3: Leggere la privacy policy attuale**

Leggere `app/[locale]/privacy/**/*.tsx` e/o stringhe in `messages/it.json` / `messages/en.json`. Fare una lista di cosa dichiara:
- Quali dati raccoglie?
- Quali processor menziona?
- Quale base giuridica dichiara?
- Quanto tempo conserva i dati?
- Quali diritti dell'interessato elenca?
- C'è un riferimento al DPO o contatto privacy?

- [ ] **Step 4: Tabella gap**

Creare una tabella con colonne: **Dato / Processor** | **Usato dal codice?** | **Dichiarato in policy?** | **Azione consigliata**.

Esempi attesi di gap:
- Resend non menzionato in policy → aggiungere come processor.
- IP loggato per rate limit non dichiarato → aggiungere (base giuridica: legittimo interesse per prevenzione abusi).
- Google Maps/Fonts come processor non dichiarati → aggiungere o rimuovere dipendenza.
- Retention email Resend non specificata → specificare.
- Base giuridica per trattamento del contenuto messaggio (potenzialmente art. 9) → consenso esplicito o legittimo interesse del trattamento sanitario, **consultare avvocato**.
- Informativa sulla NON raccolta dati particolari tramite form (se scelta così) oppure messaggio che avverte "non inserire dati sanitari in questo form".
- Mancanza di DPIA per trattamento dati particolari → **consultare avvocato**.
- DPA con Resend/Sanity/Vercel: esistono (SaaS li offrono) ma vanno accettati e conservati dal titolare — questo è compito utente, non codice.

- [ ] **Step 5: Scrivere la sezione 5 del report**

Struttura:
- Sezione 5.1: Dati personali raccolti (tabella).
- Sezione 5.2: Processor toccati (tabella).
- Sezione 5.3: Gap con privacy policy attuale (tabella gap).
- Sezione 5.4: Raccomandazioni azionabili (lista puntata, ordinata per urgenza).
- Sezione 5.5: Punti che richiedono parere legale (non faccio io).

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add section 5 GDPR gap analysis"
```

**Definition of done:** 5 sub-sezioni compilate; lista gap completa; commit.

---

## Task 12: Executive summary + remediation roadmap + final commit

**Files:**
- Modify: `docs/superpowers/specs/2026-04-10-security-audit-report.md` (sezioni 1 e 8)

- [ ] **Step 1: Contare i finding per severità**

Scorrere tutto il report e contare quanti finding per ciascuna severità:
- Critical: N
- High: M
- Medium: K
- Low: L

- [ ] **Step 2: Identificare i Top 3 rischi**

I 3 finding con l'impatto/severità più alta, tipicamente tutti i Critical + i primi High per urgenza. Elencarli con numero finding e una riga di descrizione.

- [ ] **Step 3: Scrivere Executive summary (sezione 1)**

Struttura:
```markdown
## 1. Executive summary

**Finding count**
- Critical: N
- High: M
- Medium: K
- Low: L
- **Totale**: N+M+K+L

**Top 3 rischi**
1. F-XX — titolo — una riga di impact.
2. F-YY — titolo — una riga di impact.
3. F-ZZ — titolo — una riga di impact.

**Raccomandazione generale**
Una sintesi 3-5 righe: lo stato generale del sito, i pattern dominanti di issue (es. "principalmente hardening, pochi exploit immediati" oppure "diversi gap critici su PII"), e il prossimo passo suggerito (triage dei Critical/High con l'utente e produzione fix plan).
```

- [ ] **Step 4: Scrivere Remediation roadmap (sezione 8)**

Ordinare i finding per priorità usando la formula: `(severity_score × 1/effort_score)` dove:
- Critical = 4, High = 3, Medium = 2, Low = 1
- Effort S = 1, M = 2, L = 3

Produrre una tabella ordinata:

| Priorità | Finding | Severity | Effort | Score |
|----------|---------|----------|--------|-------|
| 1 | F-XX | Critical | S | 4.0 |
| 2 | F-YY | High | S | 3.0 |
| ... | ... | ... | ... | ... |

Sotto la tabella, raggruppare in 3 bucket:
- **Do now (Critical + High)**: lista finding.
- **Do soon (Medium)**: lista finding.
- **Hardening backlog (Low)**: lista finding.

Aggiungere una nota: "Questa roadmap è input per il prossimo piano di fix; alcune voci richiederanno input dell'utente per scelte di config esterna o testi legali."

- [ ] **Step 5: Pass finale di coerenza**

Leggere l'intero report da cima a fondo, verificare:
- Numerazione finding progressiva senza buchi né duplicati.
- Ogni sezione ha contenuto (niente placeholder residui).
- Executive summary counts corrispondono ai finding reali.
- Top 3 rischi corrispondono ai finding più gravi.
- Remediation roadmap include tutti i finding.

Fix inline di qualsiasi discrepanza trovata.

- [ ] **Step 6: Commit finale**

```bash
git add docs/superpowers/specs/2026-04-10-security-audit-report.md
git -c commit.gpgsign=false commit -m "docs(audit): add executive summary and remediation roadmap"
```

- [ ] **Step 7: Presentare il report all'utente**

Produrre un messaggio di riepilogo nel chat (non un nuovo file) con:
- Path del report.
- Counts per severità.
- Top 3 rischi riassunti.
- Domanda: "Vuoi procedere al triage? Dimmi quali finding (per numero) vuoi includere nel piano di fix, oppure dimmi 'tutti i Critical/High' per un bucket automatico."

**Definition of done:** report completo, coerente, committato; messaggio di riepilogo inviato; prossimo step (triage) chiaramente indicato all'utente.

---

## Self-Review del plan (fatto dall'autore)

**1. Spec coverage:**
- Design §2 Scope in-scope → coperto da Task 2-11 ✓
- Design §3 Threat model GDPR-first → coperto come amplifier esplicito in Task 2 e centralmente in Task 11 ✓
- Design §4 Passata A (6 entry point) → Task 2, 3, 4, 5 ✓
- Design §4 Passata B (6 categorie trasversali) → Task 6, 7, 8, 9, 10 ✓
- Design §4 Passata C (GDPR gap) → Task 11 ✓
- Design §5 Severity scale → referenziata in tutti i task via "formato finding" in testa + amplifier GDPR esplicito ✓
- Design §6 Struttura report → scheletro in Task 1, sezioni popolate dai task successivi, executive + roadmap in Task 12 ✓
- Design §7 Transizione a fix → Task 12 step 7 presenta triage all'utente ✓
- Design §8 Assunzioni → nessuna azione necessaria, già documentate nel design

**2. Placeholder scan:** riletto, nessun "TBD/TODO/implement later/appropriate/similar to". Le checklist dei task contengono domande concrete da valutare, non istruzioni vaghe.

**3. Type consistency:** non ci sono tipi da verificare (piano non-codice). I nomi dei file citati in ogni task sono coerenti col file structure iniziale.

**4. Granularità:** i task 2-11 sono più lunghi dei classici "2-5 min per step" perché ogni task raccoglie una checklist di audit. Questo è intenzionale: ogni task rappresenta un'area logica del report con una definition of done chiara (sezione compilata + commit). Gli step all'interno di ciascun task mantengono la granularità fine (read, checklist, write, commit).

**5. Rischio di merge in-file:** il report cresce in modo sequenziale; ogni task tocca sezioni diverse. Nessun rischio di conflitto se i task vengono eseguiti in ordine. Se eseguiti in parallelo via subagent, richiederebbero coordinamento sulla numerazione `F-NN` — raccomandare esecuzione sequenziale.

**Raccomandazione esecuzione:** **inline sequenziale** tramite `superpowers:executing-plans`, non subagent-driven, perché i task condividono un singolo file (report) e condividono uno stato (numerazione finding) che si propaga task → task. Un subagent fresh per task perderebbe il contesto della numerazione.
