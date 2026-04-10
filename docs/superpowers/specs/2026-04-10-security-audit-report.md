# Security Audit Report — Ida Sato Site

**Data**: 2026-04-10
**Commit analizzato**: `6268f27d06e1a24de2fbdd11f447ca8896cd4c66`
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

Questa è l'area più sensibile del sito dal punto di vista GDPR (amplifier applicato dove rilevante). File esaminati: `app/api/contact/route.ts`, `components/sections/contact-form.tsx`, `lib/emails/contact-email.tsx`, `types/index.ts`.

**Controlli già in ordine (non-finding):** content-type enforcement (`route.ts:35-38`), presenza/formato campi server-side (`route.ts:64-73`), limite lunghezza name/message/phone prima dell'uso (`route.ts:89-91`), troncamento a 100 char nel subject (`route.ts:97`), sanitizzazione `\r\n` in `replyTo` (`route.ts:76`), honeypot + fake-success anti-oracle (`route.ts:48-51`), messaggi di errore generici al client, nessuno stack trace esposto, protezione CSRF implicita via Content-Type preflight (il form è JSON-only, che forza CORS preflight per richieste cross-origin).

---

#### F-01 — Rate limit in-memory bypassabile su Vercel serverless

- **Severity**: High
- **Category**: Rate limiting / Anti-abuse
- **Evidence**: `app/api/contact/route.ts:15-30`
  ```ts
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_MAX = 5;
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
  ```
- **Impact**: Il rate limit è mantenuto in una `Map` JavaScript in-process. Su Vercel Functions ogni invocation può essere servita da una lambda istanza diversa (cold start di nuovi worker, scaling orizzontale, regional routing). Il limite "5 req per 15 min" è di fatto per-lambda-istanza, non per-IP globale. Un attaccante che rimbalza tra istanze può inviare ordini di grandezza più richieste. Peggio: le lambda vengono ricreate spesso, quindi anche senza sforzo lo state si perde. Con amplifier GDPR (form PII) → **High**.
- **Exploitation**: Banale. Nessun tool speciale: un client che fa loop in parallelo con piccole pause già ottiene multiple istanze. Richiede solo `curl`. Permette spam massivo di email → saturazione casella Ida + consumo crediti Resend + potenziale abuse della reputazione del mittente.
- **Remediation**: Spostare il rate limit su uno store condiviso tra istanze. Opzioni ordinate per effort crescente:
  1. **Vercel Firewall** (rate limiting edge, gratuito su Pro plan): configurazione dichiarativa, nessun codice, massima efficacia. **Preferito se il plan Vercel lo include.**
  2. **Upstash Redis** free tier + libreria `@upstash/ratelimit`: drop-in replacement della funzione `isRateLimited`, supporta sliding window, persistenza distribuita.
  3. **Vercel KV** (wrapper Upstash Redis): stesso risultato, integrazione Vercel nativa.
- **Effort**: S (opzione 1) / M (opzioni 2-3)

---

#### F-02 — Mittente email hardcoded `onboarding@resend.dev` (no DMARC alignment, no branding)

- **Severity**: High
- **Category**: Email deliverability / Brand security
- **Evidence**: `app/api/contact/route.ts:94`
  ```ts
  from: "Sito Ida Sato <onboarding@resend.dev>",
  ```
- **Impact**: `onboarding@resend.dev` è il dominio di prova generale di Resend. Implicazioni:
  1. **Deliverability**: le email tendono a finire in Spam/Promozioni perché non c'è allineamento DMARC/SPF/DKIM con un dominio di Ida. Per un form contatti di una psicologa, perdere anche un solo messaggio è un problema serio.
  2. **Brand trust**: il destinatario (Ida) vede un mittente non-brandizzato; può scambiarlo per phishing.
  3. **Modalità "test" di Resend**: `onboarding@resend.dev` è spesso limitato a inviare solo a email verificate del proprio account Resend. Se `CONTACT_EMAIL` non è verificata nel dashboard Resend, i send falliscono silenziosamente o vengono rifiutati — il form apparirebbe funzionante al cliente ma le email non arriverebbero mai a Ida. **Da verificare urgentemente** nel dashboard Resend lo stato delivery attuale.
  4. **Reputazione**: eventuali abusi del dominio di prova impattano reputazione condivisa.
- **Exploitation**: non è un exploit attivo, è un misconfig che ha impatto operativo immediato e GDPR-rilevante (potenziali data loss: contatti di pazienti che non arrivano).
- **Remediation**:
  1. Verificare il dominio di Ida in Resend (Dashboard → Domains → Add Domain).
  2. Configurare i record DNS richiesti da Resend: SPF, DKIM (2 record CNAME), e — se ancora non presente — DMARC (`v=DMARC1; p=quarantine; rua=mailto:dmarc@<dominio>`).
  3. Cambiare `from` in `"Sito Ida Sato <noreply@<dominio-ida>>"` o analogo.
  4. Verificare che Resend confermi il dominio come "Verified".
  5. Fare un send di test e controllare gli header SPF/DKIM/DMARC nel client (es. Gmail → Show Original).
- **Effort**: M (richiede accesso DNS + dashboard Resend)

---

#### F-03 — Subject email costruito con `sanitizedName` non ripulito da newline

- **Severity**: Medium
- **Category**: Email header injection (difesa in profondità)
- **Evidence**: `app/api/contact/route.ts:89,97`
  ```ts
  const sanitizedName = body.name.slice(0, 200);
  // ...
  subject: `Nuovo messaggio da ${sanitizedName.slice(0, 100)}`,
  ```
- **Impact**: `sanitizedName` è solo troncato, non ripulito da `\r\n` o altri caratteri di controllo. Se Resend accettasse il valore passandolo direttamente come header SMTP `Subject:` raw, un attaccante potrebbe iniettare header arbitrari (es. `Bcc: exfil@evil.com`) usando `name = "Alice\r\nBcc: ..."`. **In pratica** Resend espone un'API HTTP JSON: il `subject` è un campo JSON, non un header raw SMTP; Resend costruisce gli header lato suo e (secondo le loro docs) normalizza/rifiuta caratteri di controllo. Il vettore è quindi mitigato dal provider, ma la dipendenza dalla loro normalizzazione è un single point of failure. Con amplifier GDPR il rischio residuo sale.
- **Exploitation**: richiede che Resend cambi comportamento o abbia un bug. Non sfruttabile oggi, ma è un'omissione evitabile in 1 riga di codice.
- **Remediation**: applicare la stessa sanitizzazione usata per `replyTo` anche a nome e phone:
  ```ts
  const stripCtl = (s: string) => s.replace(/[\r\n\t\0]/g, " ").trim();
  const sanitizedName = stripCtl(body.name).slice(0, 200);
  const sanitizedEmail = body.email.replace(/[\r\n]/g, "");
  const sanitizedPhone = body.phone ? stripCtl(body.phone).slice(0, 30) : undefined;
  ```
- **Effort**: S

---

#### F-04 — `console.error("Resend error:", error)` può leakare metadata PII nei log Vercel

- **Severity**: Medium (Low baseline + amplifier GDPR)
- **Category**: Logging / PII handling
- **Evidence**: `app/api/contact/route.ts:120`
  ```ts
  console.error("Resend error:", error);
  ```
- **Impact**: L'oggetto `error` ritornato dall'SDK Resend può contenere, a seconda dell'errore, l'email del destinatario, il subject, e in alcuni casi frammenti del payload inviato. Questo log finisce nei Runtime Logs di Vercel, con retention di default di 1h (Hobby) fino a 3gg (Pro) e più per Enterprise. Un log con email del mittente + subject "Nuovo messaggio da <nome>" costituisce trattamento PII non strettamente necessario in violazione del principio di minimizzazione GDPR. Sebbene non sia un breach, un audit DPO lo segnalerebbe.
- **Exploitation**: non è un exploit; è un data leak passivo verso i log del provider hosting.
- **Remediation**: loggare solo metadata non-PII:
  ```ts
  if (error) {
    console.error("Resend send failed", {
      statusCode: error.statusCode,
      name: error.name,
      // NON: message (può contenere email/subject), NON: l'oggetto intero
    });
    return NextResponse.json<ContactAPIResponse>({ success: false, error: "Failed to send email" }, { status: 500 });
  }
  ```
- **Effort**: S

---

#### F-05 — Rate limit `Map` mai pulita (memory leak su lambda caldi)

- **Severity**: Low
- **Category**: Resource management
- **Evidence**: `app/api/contact/route.ts:15, 19-30`
  ```ts
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  ```
- **Impact**: Ogni IP visto crea una entry nella Map. Le entry scadute non vengono mai rimosse (il check `now > entry.resetAt` resetta il count ma non rimuove la chiave). Su un'istanza lambda che resta calda a lungo e vede molti IP unici, la Map cresce indefinitamente. Crash OOM nel worst case. In pratica le lambda Vercel riciclano frequentemente quindi l'impatto è limitato.
- **Exploitation**: un attaccante potrebbe accelerare il leak facendo richieste da molti IP (difficile sfruttabile, e comunque richiede attacco distribuito).
- **Remediation**: irrilevante se si adotta F-01 remediation (store condiviso). Altrimenti cleanup opportunistico:
  ```ts
  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    // Cleanup opportunistico
    if (rateLimitMap.size > 1000) {
      for (const [key, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(key);
      }
    }
    // ... resto invariato
  }
  ```
- **Effort**: S

---

#### F-06 — Timing check anti-bot si affida a un timestamp client-side fornito dal client

- **Severity**: Low
- **Category**: Anti-bot (difesa in profondità debole)
- **Evidence**: `app/api/contact/route.ts:54-56` + `components/sections/contact-form.tsx:69-76`
  ```ts
  // server
  if (body.timestamp && Date.now() - body.timestamp < 2000) {
    return NextResponse.json<ContactAPIResponse>({ success: true });
  }
  ```
- **Impact**: Il timestamp viene generato lato client al mount (`mountTime.current`) e inviato nel body. Un bot può semplicemente inviare un timestamp arbitrario nel passato e bypassare il check. La protezione è ornamentale.
- **Exploitation**: banale.
- **Remediation**: spostare il timestamp lato server. Opzioni:
  1. **Token firmato**: endpoint `GET /api/contact/token` che emette un token HMAC contenente `now()`; il form include il token nel POST; il server verifica che `now - token.time >= 2s`. Robusto ma aggiunge round-trip.
  2. **Cookie signed**: server emette cookie con timestamp firmato alla prima GET della pagina contatti.
  3. **Rimuovere il check** se si adotta Vercel Firewall o un CAPTCHA: ridondante.
- **Effort**: M (opzioni 1-2) / S (opzione 3 — solo rimozione)

---

#### F-07 — Nessuna validazione pattern per il campo `phone`

- **Severity**: Low
- **Category**: Input validation
- **Evidence**: `app/api/contact/route.ts:90` + `lib/emails/contact-email.tsx:65`
  ```ts
  const sanitizedPhone = body.phone?.slice(0, 30);
  // ...
  <Link href={`tel:${phone.replace(/\s/g, "")}`} style={link}>
  ```
- **Impact**: Il `phone` viene accettato come stringa arbitraria troncata a 30 char, e nel template email viene interpolato in un `href="tel:..."`. React escapa gli attributi HTML (quindi niente XSS nel rendering), ma un phone contenente caratteri non validi come `"><script>` viene comunque serializzato testualmente in tutto il body email: a seconda del client email e del livello di sanitizzazione, può risultare in un "href: tel:malformed" innocuo ma fastidioso. Non c'è vulnerabilità sfruttabile, ma il campo non è nemmeno minimamente sanity-checked (non è "telefono", è "stringa di 30 char").
- **Exploitation**: nessuna vera, solo noise.
- **Remediation**: aggiungere una validazione leggera (soft — non bloccare phone esteri):
  ```ts
  if (body.phone && !/^[\d\s+\-().]{3,30}$/.test(body.phone)) {
    return NextResponse.json<ContactAPIResponse>({ success: false, error: "Invalid phone" }, { status: 400 });
  }
  ```
- **Effort**: S

---

#### F-08 — Nessun CAPTCHA / challenge (difesa in profondità anti-bot)

- **Severity**: Low (hardening)
- **Category**: Anti-bot
- **Evidence**: `components/sections/contact-form.tsx` (intero, nessuna integrazione CAPTCHA)
- **Impact**: Per bot sofisticati (puppeteer, Playwright, form farms umane) honeypot + timing check non bastano. Il volume di un sito di una singola psicologa è basso quindi il rischio oggi è contenuto, ma se F-01 non viene risolto con un firewall rate-limit, la difesa anti-spam è debole. Se Ida dovesse subire un'ondata di spam, non ha leve attive.
- **Exploitation**: N/A.
- **Remediation**: opzioni per toughness crescente:
  1. **hCaptcha** o **Cloudflare Turnstile** (invisible, privacy-friendly, GDPR-compliant): integrazione leggera.
  2. **reCAPTCHA v3 di Google**: da evitare per il threat model GDPR — aggiunge Google come processor.
  3. **Vercel Firewall** con challenge dinamico: se il plan lo include, è la soluzione "coperta automaticamente".
- **Effort**: M

---

#### F-09 — Nessun timeout esplicito sulla chiamata a Resend

- **Severity**: Low
- **Category**: Resource management / DoS defensive
- **Evidence**: `app/api/contact/route.ts:93`
  ```ts
  const { error } = await resend.emails.send({ /* ... */ });
  ```
- **Impact**: Se Resend ha un'outage o una latenza elevata, la lambda resta bloccata fino al timeout di Vercel Functions (10s Hobby, 60s Pro). Un attaccante che satura l'endpoint può accumulare lambda stuck, consumando quota di execution time.
- **Exploitation**: richiede outage Resend o condizioni di lentezza; attacco attivo difficile.
- **Remediation**: wrap con `AbortController` timeout:
  ```ts
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const { error } = await resend.emails.send({ /* ... */ }, { signal: controller.signal });
    // ...
  } finally {
    clearTimeout(timeout);
  }
  ```
  (verificare che il client Resend accetti `signal`; altrimenti usare `Promise.race` con un timeout promise).
- **Effort**: S

### 3.2 `POST /api/revalidate`

File esaminati: `app/api/revalidate/route.ts`, `node_modules/@sanity/webhook/dist/index.js` (comportamento libreria).

**Controlli già in ordine (non-finding):**
- La signature HMAC-SHA256 è verificata **prima** di qualsiasi parsing del payload (`route.ts:11-13`). ✓
- `body = req.text()` raw prima di `JSON.parse` → hash calcolato sul body esatto, nessun mismatch di canonicalizzazione. ✓
- Il non-null assertion `SANITY_REVALIDATION_SECRET!` (`route.ts:5`) **non è pericoloso**: `@sanity/webhook` in `createHS256Signature` valida esplicitamente `!secret || typeof secret != "string"` e lancia un `WebhookSignatureFormatError`, che è un signature error riconosciuto e convertito in `isValidSignature === false` → route ritorna 401. Se l'env sparisce in runtime, l'endpoint rifiuta tutto anziché accettare tutto. ✓ Fail-safe.
- Errori generici 401 / 400 senza leak interno. ✓
- `revalidatePath` è un'operazione relativamente cheap e bounded a max ~5 path per chiamata. ✓

---

#### F-10 — Nessuna protezione contro replay del webhook

- **Severity**: Medium
- **Category**: Authentication / Replay protection
- **Evidence**: `app/api/revalidate/route.ts:7-13` + comportamento `@sanity/webhook` `decodeSignatureHeader` (solo check `timestamp >= MINIMUM_TIMESTAMP = 2021-01-01`)
  ```ts
  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  ```
- **Impact**: La libreria `@sanity/webhook` firma la coppia `(timestamp, body)` con HMAC-SHA256, ma **non verifica che il timestamp sia recente**. Una richiesta firmata valida può essere replayed indefinitamente: un attaccante che riesce a intercettare UN solo webhook valido (es. via man-in-the-middle, log leakato, proxy compromesso, debugger intermedio) può riutilizzarla per causare revalidation arbitrarie del sito. Impatto concreto:
  - Amplification DoS contro la cache ISR di Next.js (forzando rebuild costosi delle pagine).
  - Consumo di quota build/bandwidth Vercel.
  - Nessun accesso a dati protetti (il payload è solo `_type` + `slug`).
  È un Medium — non un data breach, ma è una superficie di abuso evitabile con poche righe.
- **Exploitation**: richiede l'intercetto di un webhook valido; improbabile in HTTPS diretto Sanity → Vercel, ma plausibile se qualcuno ha accesso a log applicativi, Vercel log drains, o configurazioni di proxy intermedie (Postman collezionate dagli sviluppatori, screenshot in issue tracker, ecc).
- **Remediation**: dopo la verifica della signature, estrarre e validare il timestamp della firma:
  ```ts
  import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

  const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000; // 5 minuti

  export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get(SIGNATURE_HEADER_NAME);

    if (!signature || !(await isValidSignature(body, signature, secret))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Anti-replay: rifiuta webhook più vecchi di 5 minuti
    const match = signature.match(/^t=(\d+)/);
    const timestamp = match ? parseInt(match[1], 10) : 0;
    if (!timestamp || Date.now() - timestamp > MAX_WEBHOOK_AGE_MS) {
      return NextResponse.json({ error: "Webhook expired" }, { status: 401 });
    }

    // ... resto invariato
  }
  ```
- **Effort**: S

---

#### F-11 — `_type` non whitelistato: payload arbitrario cade nel branch "blog"

- **Severity**: Low
- **Category**: Input validation / Defense in depth
- **Evidence**: `app/api/revalidate/route.ts:22-38`
  ```ts
  if (payload._type === "testimonial") {
    revalidatePath("/it");
    // ...
  } else {
    // qualsiasi altro _type (o nessuno) finisce qui
    revalidatePath("/it/blog");
    revalidatePath("/en/blog");
    // ...
  }
  ```
- **Impact**: Con una signature valida, un payload con `_type = "anythingElse"` (o assente) fa comunque partire la revalidation del blog. Non è sfruttabile da un esterno (serve la firma), ma è un'ambiguità: se Sanity aggiunge un nuovo schema, i webhook per quel tipo faranno revalidation sbagliate invece di essere rifiutati con `200 { ignored: true }` o `400 unknown type`. Ordine di grandezza minore perché è post-signature.
- **Exploitation**: N/A (post-authentication).
- **Remediation**: esplicitare la whitelist:
  ```ts
  switch (payload._type) {
    case "testimonial":
      revalidatePath("/it");
      revalidatePath("/en");
      revalidatePath("/it/recensioni");
      revalidatePath("/en/reviews");
      break;
    case "post":
    case "resource":
    case "topic":
      revalidatePath("/it/blog");
      revalidatePath("/en/blog");
      if (payload.slug?.current) {
        revalidatePath(`/it/blog/${payload.slug.current}`);
        revalidatePath(`/en/blog/${payload.slug.current}`);
      }
      break;
    default:
      return NextResponse.json({ ignored: true, reason: "unknown type" });
  }
  revalidatePath("/sitemap.xml");
  ```
- **Effort**: S

---

#### F-12 — `revalidatePath` con slug utente potrebbe normalizzare percorsi inattesi

- **Severity**: Low
- **Category**: Input validation
- **Evidence**: `app/api/revalidate/route.ts:35-37`
  ```ts
  if (payload?.slug?.current) {
    revalidatePath(`/it/blog/${payload.slug.current}`);
    revalidatePath(`/en/blog/${payload.slug.current}`);
  }
  ```
- **Impact**: `payload.slug.current` proviene da Sanity ma è post-autenticazione webhook — in pratica è fidato. Tuttavia se un editor Sanity malizioso (o uno compromesso) crea un post con `slug = "../../"` o simile, `revalidatePath` riceverebbe `/it/blog/../../`. Next.js normalmente normalizza i path, ma il comportamento con caratteri speciali non è testato qui. Impatto massimo: revalidation di path non previste → ISR cache miss, nessuna esposizione di dati. Low.
- **Exploitation**: richiede accesso scrittura a Sanity — minaccia insider, non esterna.
- **Remediation**: validare lo slug con un pattern conservativo:
  ```ts
  const SLUG_RE = /^[a-z0-9-]+$/i;
  if (payload?.slug?.current && SLUG_RE.test(payload.slug.current)) {
    revalidatePath(`/it/blog/${payload.slug.current}`);
    revalidatePath(`/en/blog/${payload.slug.current}`);
  }
  ```
- **Effort**: S

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
