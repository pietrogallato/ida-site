# Security Audit Report — Ida Sato Site

**Data**: 2026-04-10
**Commit analizzato**: `6268f27d06e1a24de2fbdd11f447ca8896cd4c66`
**Design di riferimento**: `docs/superpowers/specs/2026-04-10-security-audit-design.md`
**Scala severità**: Critical / High / Medium / Low (regole in design §5)
**Threat model (pesi)**: 1) PII form contatti (GDPR-first) → 2) Spam/bot → 3) Attacker mirato

---

## 1. Executive summary

**Finding count (53 IDs; 52 actionable + 1 non-finding)**

| Severity | Count | Note |
|----------|-------|------|
| Critical | 1 | F-46 (trattamento dati sanitari art. 9 GDPR) |
| High | 8 | F-01, F-02, F-17, F-23, F-31, F-49, F-50, F-52 |
| Medium | 18 | vedi §4, §5 |
| Low / Hardening | 23 | vedi §4, §5 |
| Conditional (verify) | 2 | F-15, F-21 (dipendono da verifica visibility dataset Sanity) |
| Non-finding (area esaminata) | 1 | F-45 (template email OK) |

**Top 3 rischi**

1. **F-46 — Form contatti può raccogliere dati sanitari (art. 9) senza base giuridica adeguata né warning utente** ⚖️
   Il canale email per una psicologa attira per natura descrizioni di problemi psicologici (dati particolari). La privacy policy dichiara solo basi art. 6, e non c'è né disclaimer né consenso esplicito nel form. Rischio regolatorio + legale diretto.

2. **F-01 / F-02 — Rate limit in-memory su Vercel serverless + mittente email `onboarding@resend.dev`**
   Due debolezze del canale più sensibile del sito (form contatti): (a) il rate limit è di fatto per-lambda e bypassabile con poco sforzo, (b) il mittente è il dominio di test Resend, con probabili problemi di delivery/spam e nessun DMARC alignment. Il cliente può credere che il form funzioni mentre messaggi reali finiscono in Spam o vengono droppati.

3. **F-31 + F-49 + F-50 — Next.js 16.1.6 con 5 advisory aperte + Resend e Google non dichiarati come processor**
   Debito tecnico + compliance: dependency con CVE pubbliche (HTTP smuggling, CSRF bypass, DoS) non patched, e privacy policy che omette due processor significativi. Google Maps in particolare implica trasferimento extra-EU non dichiarato.

**Raccomandazione generale**

Il sito parte da una **base di codice pulita**: nessuna RCE, nessun SQL/NoSQL injection, nessun XSS runtime, nessun leak di segreti nel bundle, validazione input presente, CSRF mitigato, honeypot+timing in place, query GROQ parametrizzate. La maggior parte dei 52 finding sono di tre classi:

1. **Hardening difensivo** (~23 Low): CSP da rafforzare, headers COOP/COEP/HSTS espliciti, Permissions-Policy completa, robots.txt più stretto, dipendenze da aggiornare. Fix quasi tutti S-effort.
2. **Difesa in profondità e osservabilità** (~18 Medium): rate limit distribuito, logging/monitoring, backup Sanity, retention documentate, `/studio` dietro auth edge.
3. **Compliance GDPR** (1 Critical + 4-5 High): il nodo è il form contatti, che tocca dati sanitari. Richiede input legale ⚖️ e modifiche UI (disclaimer + checkbox) + aggiornamento testo privacy policy. Parallelamente vanno rimossi/consenti-gatted gli embed Google Maps e Vercel Analytics.

**Prossimo passo suggerito**: triage dei Critical + High con l'utente, confermare gli approcci di remediation per ciascuno (soprattutto le scelte di config esterna Vercel/Sanity/Resend e le decisioni legali su F-46/F-48/F-52), poi produrre un `superpowers:writing-plans` dedicato al fix implementativo. Le voci Low vanno tenute in backlog e affrontate in un secondo sprint di hardening.

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

File esaminati: `app/studio/[[...tool]]/page.tsx`, `app/studio/[[...tool]]/layout.tsx`, `sanity.config.ts`, `sanity.cli.ts`, `next.config.ts` (sezione headers `/studio/:path*`), `app/robots.ts`.

**Contesto**: Sanity Studio è embeddato come route Next.js (`NextStudio`) al path `/studio`. L'autenticazione è gestita interamente da Sanity SSO (email magic link di default). Chiunque può raggiungere l'URL e vedere il form di login; per qualsiasi operazione serve essere membro del progetto Sanity.

**Controlli già in ordine (non-finding):**
- `app/studio/[[...tool]]/layout.tsx:5` imposta `metadata.robots = "noindex"` → esclude lo Studio dall'indicizzazione anche senza Disallow in `robots.txt`. ✓
- `NextStudio` è un wrapper ufficiale, gestisce CSRF e auth Sanity internamente. ✓
- `structureTool` e `visionTool` sono plugin ufficiali di Sanity. ✓
- L'accesso in scrittura richiede membership al progetto Sanity, controllo lato Sanity backend. ✓

---

#### F-13 — Headers di sicurezza incompleti per `/studio/*` (manca X-Frame-Options/CSP/frame-ancestors)

- **Severity**: Medium
- **Category**: Headers / Clickjacking
- **Evidence**: `next.config.ts:16-22`
  ```ts
  {
    source: "/studio/:path*",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ],
  },
  ```
- **Impact**: Le rotte `/studio/*` **NON** hanno `X-Frame-Options`, `Content-Security-Policy` con `frame-ancestors`, `Permissions-Policy` né altri header restrittivi. Un attaccante può embeddare `/studio` in un iframe su un sito malevolo (`<iframe src="https://sito-ida/studio">`), sovrapporlo con UI civetta e ingannare un amministratore loggato a cliccare controlli dello Studio (clickjacking). Esempi di azioni pericolose: pubblicare bozze, cancellare contenuti, creare testimonial fake. L'impatto è limitato al fatto che Sanity Studio usa fetch CORS verso `api.sanity.io` (il browser potrebbe bloccare alcune operazioni), ma molte operazioni nello Studio sono purely client-side drag/click e funzionano in frame. Sanity non pubblicizza `/studio` come "frame-safe by default", quindi la difesa deve stare lato nostro.
- **Exploitation**: richiede che un admin loggato visiti il sito malevolo con una sessione attiva nello Studio. Plausibile via phishing mirato (email "controlla questo articolo nel sito di un collega") — coerente col threat model (3) "attacker mirato".
- **Remediation**: aggiungere al blocco `/studio/:path*` almeno:
  ```ts
  {
    source: "/studio/:path*",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Content-Security-Policy",
        // Studio ha bisogno di molte origini per iframe e asset; va costruita con attenzione.
        // Partire permissiva e stringere dopo il primo test:
        value: [
          "default-src 'self' https://*.sanity.io https://cdn.sanity.io",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sanity.io",
          "style-src 'self' 'unsafe-inline' https://*.sanity.io https://fonts.googleapis.com",
          "font-src 'self' https://*.sanity.io https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.sanity.io https://cdn.sanity.io",
          "connect-src 'self' https://*.sanity.io https://*.api.sanity.io wss://*.api.sanity.io",
          "frame-src 'self' https://*.sanity.io",
          "frame-ancestors 'self'",
        ].join("; "),
      },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  },
  ```
  Dopo il deploy, aprire lo Studio e verificare che non si rompa (aprire DevTools → Console, cercare errori CSP). Rilassare o aggiungere origini mancanti finché lo Studio funziona.
  
  **Alternativa più semplice** se non si vuole gestire una CSP custom: spostare `/studio` dietro Vercel Password Protection (Pro plan feature) — aggiunge uno step di auth al bordo, blocca completamente i frame non autorizzati e riduce la superficie pubblica.
- **Effort**: M (costruzione CSP + test) / S (Vercel Password Protection se disponibile)

---

#### F-14 — Vision tool abilitato: arbitrary GROQ execution per utenti autenticati

- **Severity**: Medium
- **Category**: Least privilege / Data exposure
- **Evidence**: `sanity.config.ts:12`
  ```ts
  plugins: [structureTool(), visionTool()],
  ```
- **Impact**: `visionTool()` espone nello Studio un playground GROQ dove utenti autenticati possono eseguire query arbitrarie sul dataset, incluso `*[_type == "testimonial"]{..., publishedAt, _createdAt, _updatedAt}` o `*[_type == "post"]{..., body}` per leggere anche bozze e contenuti non pubblicati. Non è un bug — è feature — ma è una superficie di data exfiltration se un account editor viene compromesso (phishing, password reuse, session hijack). Nel threat model GDPR, se il dataset contiene mai dati personali di terzi (es. testimonianze con autori reali non anonimizzati, note interne su clienti), questo è un vettore.
- **Exploitation**: richiede compromissione di un account Sanity con accesso al dataset. Non è attaccabile da anonimi.
- **Remediation**: valutazioni in ordine:
  1. **Rimuovere `visionTool()` dai plugin in produzione**, lasciarlo abilitato solo in development via env check:
     ```ts
     const plugins = [structureTool()];
     if (process.env.NODE_ENV === "development") {
       plugins.push(visionTool());
     }
     export default defineConfig({ /* ... */ plugins });
     ```
  2. Se Vision serve in prod per query di supporto, abilitare 2FA obbligatorio sugli account Sanity con accesso al progetto (config esterna, vedi Task 10).
  3. Rivedere i ruoli Sanity: assegnare ruolo `viewer` invece di `editor` dove possibile.
- **Effort**: S (opzione 1)

---

#### F-15 — Dataset Sanity potenzialmente pubblico (da verificare)

- **Severity**: da determinare (potenzialmente High se confermato)
- **Category**: Data exposure / External config
- **Evidence**: `sanity.config.ts:10`, `lib/sanity.ts:4-9`
  ```ts
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  ```
- **Impact**: Sanity permette di configurare i dataset come "public" o "private". Se il dataset di questo progetto è **public** (impostazione da dashboard Sanity, esterna al repo), chiunque conosca il `projectId` (che è `NEXT_PUBLIC_*` quindi visibile nel bundle client) può fare query GROQ arbitrarie direttamente contro `https://<projectId>.api.sanity.io/v2026-03-28/data/query/<dataset>?query=...` senza alcuna autenticazione, bypassando completamente lo Studio. In tal caso un attaccante può:
  - Leggere tutti i post (inclusi drafts se esposti a GROQ anonimo).
  - Leggere tutti i testimonial (inclusi i campi `publishedAt`, `_createdAt`, eventuali campi privati nello schema).
  - Fare discovery dell'intero schema via `*[_type == "system.schema"]`.
  
  Il rischio dipende interamente dal contenuto del dataset.
  
  Se invece il dataset è **private**, le query anonime vengono rifiutate e questo è un non-finding. La distinzione va verificata.
- **Exploitation**: banale da verificare con un `curl`:
  ```bash
  curl -s "https://<projectId>.api.sanity.io/v2026-03-28/data/query/<dataset>?query=*%5B_type%20%3D%3D%20%22post%22%5D%7B_id%2Ctitle%7D%5B0..2%5D"
  ```
  Se la risposta contiene dati → dataset pubblico → finding High (con amplifier GDPR se il dataset contiene mai PII di terzi) o Medium (se contiene solo contenuto editoriale già pubblicato). Se risponde `401`/`403` → non-finding.
- **Remediation**:
  1. **Verificare**: eseguire il curl sopra sostituendo projectId/dataset reali.
  2. **Se pubblico**: andare su sanity.io/manage → progetto → API → CORS and Datasets → impostare il dataset come **Private**. Ricontrollare che l'app funzioni (le query lato server continueranno a funzionare se hanno un token; verificare se `lib/sanity.ts` usa un token o legge anonimamente).
  3. **Se si usa client read anonimo lato server**: aggiungere un `SANITY_READ_TOKEN` con scope `viewer`, impostarlo in env e passarlo al client:
     ```ts
     export const client = createClient({
       projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
       dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
       apiVersion: "2026-03-28",
       useCdn: true,
       token: process.env.SANITY_READ_TOKEN, // solo server-side
     });
     ```
- **Effort**: S (verifica + toggle) / M (se serve rifattorizzare per usare token)

---

#### F-16 — Discovery dello Studio banale via bundle client (documentazione, non bloccante)

- **Severity**: Low
- **Category**: Attack surface documentation
- **Evidence**: `NEXT_PUBLIC_SANITY_PROJECT_ID` e `NEXT_PUBLIC_SANITY_DATASET` sono embedded nel bundle client di tutte le pagine (sono referenziati in `lib/sanity.ts` che è importato dalle pagine server, ma Next può inlinare literal env se il tipo è `NEXT_PUBLIC_*` anche lato client).
- **Impact**: Un attaccante che ispeziona il JS del sito trova sempre `projectId` e `dataset`, e può tentare il path `/studio` senza dover fare discovery. Questo è il design intenzionale di `NEXT_PUBLIC_*`: non è un bug, ma è bene documentarlo perché amplifica F-14 e F-15: la "sicurezza per oscurità" su Studio path, dataset name o projectId **non esiste**. L'unica difesa reale sono i permessi Sanity lato server + gli header su `/studio/*` + la visibility del dataset.
- **Exploitation**: N/A (documentazione).
- **Remediation**: nessuna azione sul codice — accettare come fatto noto. Assicurarsi che le protezioni F-13/F-14/F-15 siano in ordine.
- **Effort**: S (documentazione)

### 3.4 Client bundle pubblico

File esaminati: `app/[locale]/layout.tsx`, `app/layout.tsx` (se presente), `components/ui/cookie-banner.tsx`, `app/[locale]/contatti/page.tsx`, `next.config.ts` (images + CSP), `lib/portable-text-components.tsx`.

**Inventario env pubblici nel bundle (grep):**
- `NEXT_PUBLIC_SANITY_PROJECT_ID` (sanity.cli.ts, sanity.config.ts, lib/sanity.ts)
- `NEXT_PUBLIC_SANITY_DATASET` (idem)

Entrambe sono pubbliche by design (l'API Sanity pubblica usa projectId come identificativo non segreto). Non sono leak — sono scelte. Vedi F-16 per documentazione implicita dello Studio path.

**Font loading**: Playfair Display e DM Sans caricati via `next/font/google` (`app/[locale]/layout.tsx:3, 20-30`). `next/font` scarica i file al build time e li serve self-hosted da `/` → **non** viene fatta nessuna chiamata runtime a `fonts.googleapis.com` / `fonts.gstatic.com`. → vedi F-19 per la CSP over-permissiva.

---

#### F-17 — Vercel Analytics e Speed Insights caricati senza consenso esplicito

- **Severity**: High (Medium baseline + amplifier GDPR per processor con IP)
- **Category**: GDPR / Consent management
- **Evidence**: `app/[locale]/layout.tsx:10-11, 145-146`
  ```ts
  import { SpeedInsights } from "@vercel/speed-insights/next";
  import { Analytics } from "@vercel/analytics/next";
  // ...
  <SpeedInsights />
  <Analytics />
  ```
  combinati con il cookie banner puramente informativo:
  `components/ui/cookie-banner.tsx:27-30`
  ```ts
  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);
  ```
- **Impact**: Vercel Analytics si presenta come "privacy-friendly, cookieless", ma in pratica raccoglie IP, user agent, referrer, percorso, paese, tipo di device. Vercel è un processor USA; anche senza cookie, il trattamento di IP costituisce trattamento di dati personali ai sensi del GDPR e dell'art. 122 Codice Privacy italiano (implementazione ePrivacy). L'orientamento del Garante Privacy è che:
  1. Analytics "cookieless" basata solo su aggregazioni e con IP minimizzati → possibile base giuridica *legittimo interesse* con informativa chiara; l'utente mantiene il diritto di opporsi.
  2. Analytics con IP pieno, fingerprinting, persistenza su device (anche via localStorage) → richiede **consenso preventivo** prima dell'attivazione.
  
  Il cookie banner attuale **non chiede consenso**: mostra solo un testo con link alla privacy policy e un bottone "dismiss" che nasconde il banner. L'Analytics parte comunque al primo caricamento della pagina, prima che l'utente abbia interagito in qualsiasi modo. Questo pattern è stato sanzionato in diversi provvedimenti del Garante italiano (es. provvedimenti su Google Analytics 2022-2023 — pattern analogo).
  
  **Il mismatch critico**: tutta la valutazione legale dipende da cosa dichiara la privacy policy (vedi Task 11). Se la policy dichiara "legittimo interesse" → bisogna verificare che l'impact assessment esista e che ci sia opt-out. Se la policy dichiara "consenso" → il codice attuale è fuori conformità perché non aspetta il consenso.
- **Exploitation**: N/A (compliance, non exploit).
- **Remediation** — due path, da scegliere in base alla base giuridica dichiarata in policy:

  **Path A — Legittimo interesse (strada più semplice):**
  1. Documentare la DPIA/LIA (Legitimate Interest Assessment) nella privacy policy.
  2. Aggiungere un meccanismo di **opt-out** facilmente accessibile (link in footer "Gestisci tracking" o nel banner).
  3. Quando l'utente sceglie opt-out, non renderizzare `<Analytics />` e `<SpeedInsights />`:
     ```tsx
     const [analyticsConsent, setAnalyticsConsent] = useState(true); // default ON
     // ...
     {analyticsConsent && (
       <>
         <SpeedInsights />
         <Analytics />
       </>
     )}
     ```
  4. Verificare che Vercel Analytics abbia l'opzione "IP anonymization" attiva nel dashboard Vercel.

  **Path B — Consenso preventivo (più rigoroso, raccomandato per un sito di psicologa con dati sensibili):**
  1. Trasformare il cookie banner in un vero consent banner con bottoni "Accetta" / "Rifiuta" (entrambi equivalenti graficamente, non "dark pattern").
  2. Salvare il consenso in localStorage.
  3. Renderizzare Analytics/Speed Insights **solo** se consenso concesso:
     ```tsx
     {hasConsent && (
       <>
         <SpeedInsights />
         <Analytics />
       </>
     )}
     ```
  4. Permettere la revoca del consenso da una pagina dedicata o da un link "Gestisci preferenze" in footer.
  
  In entrambi i casi, aggiornare la privacy policy di conseguenza (vedi Task 11 per gap analysis).
- **Effort**: M (Path A) / M-L (Path B, richiede anche il rifacimento del banner)

---

#### F-18 — Google Maps iframe embedded incondizionatamente (Google come processor non-consentito)

- **Severity**: Medium (High con amplifier se il form contatti e la mappa sono nella stessa pagina, perché l'utente è già in contesto PII)
- **Category**: Third-party embed / GDPR
- **Evidence**: `app/[locale]/contatti/page.tsx:221-230`
  ```tsx
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2808.8!2d11.45!3d45.45!..."
    width="100%"
    height="350"
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title={t("map.iframeTitle")}
  />
  ```
- **Impact**: L'iframe di Google Maps viene caricato automaticamente quando l'utente visita `/contatti` (lazy, ma comunque automatico appena scrolla). Al momento del load, il browser invia a Google:
  - IP dell'utente
  - User-Agent
  - Referer con l'URL della pagina contatti (visto `referrerPolicy="no-referrer-when-downgrade"` → su HTTPS→HTTPS il referer completo passa)
  - Cookies di sessione Google esistenti (se l'utente è loggato, Google può correlare la visita al suo account)
  
  Google diventa un processor del trattamento "localizzazione studio" e va dichiarato in privacy policy. Inoltre, Google Maps imposta cookie `NID`, `CONSENT`, `SOCS` su `.google.com` durante il load → cookie di terze parti finalità profilazione. **Questo è un trattamento che richiede consenso preventivo** ai sensi ePrivacy.
  
  L'aggravante col form contatti: la stessa pagina contiene il form (PII potenzialmente art. 9). La coincidenza temporale "utente apre pagina contatti → Google registra la visita → utente invia messaggio" crea un set di dati correlabili.
- **Exploitation**: N/A (compliance, non exploit).
- **Remediation** — due path:

  **Path A — Consent-gated embed:**
  1. Mostrare un placeholder statico (screenshot mappa + "Clicca per caricare la mappa interattiva (carica contenuti Google)").
  2. Solo al click dell'utente, sostituire con l'iframe reale.
  ```tsx
  const [mapLoaded, setMapLoaded] = useState(false);
  return mapLoaded ? (
    <iframe src="https://www.google.com/maps/embed?pb=..." /* ... */ />
  ) : (
    <button onClick={() => setMapLoaded(true)} className="...">
      <img src="/images/map-placeholder.jpg" alt="Posizione studio" />
      <span>Clicca per caricare la mappa (Google Maps)</span>
    </button>
  );
  ```

  **Path B — Rimuovere Google Maps:**
  - Sostituire con un'indicazione testuale dell'indirizzo + link "Apri in Maps" che apre una nuova scheda solo al click (nessun load inline → nessun trattamento automatico).
  - Oppure usare un provider di mappe privacy-friendly (OpenStreetMap via `react-leaflet` o `maplibre-gl` self-hosted).
- **Effort**: S (Path A) / M (Path B con react-leaflet)

---

#### F-19 — CSP lista `fonts.googleapis.com` e `fonts.gstatic.com` non utilizzati a runtime

- **Severity**: Low
- **Category**: CSP hardening
- **Evidence**: `next.config.ts:40-42`
  ```ts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  ```
  combinato con `app/[locale]/layout.tsx:3, 20-30` che usa `next/font/google` (self-hosting al build time).
- **Impact**: Le voci `fonts.googleapis.com` in `style-src` e `fonts.gstatic.com` in `font-src` non sono più necessarie: `next/font/google` scarica le font al build time e le serve da `'self'`. Avere queste origini nella CSP significa che, se mai un attaccante riuscisse a iniettare uno `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` o un `<link as="font">`, passerebbe la CSP inutilmente. È un CSP relaxation senza beneficio.
- **Exploitation**: richiede già un vettore di injection; è ornamentale.
- **Remediation**: rimuovere le due origini dalla CSP:
  ```ts
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  ```
- **Effort**: S

---

#### F-20 — Tre `dangerouslySetInnerHTML` in `<head>` richiedono `'unsafe-inline'` in `script-src`

- **Severity**: Medium
- **Category**: CSP hardening
- **Evidence**: `app/[locale]/layout.tsx:106-131`
  ```tsx
  <script
    dangerouslySetInnerHTML={{
      __html: `(function() { /* theme init */ })();`,
    }}
  />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteSchema()) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessSchema(locale)) }} />
  ```
  combinato con `next.config.ts:38`
  ```ts
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  ```
- **Impact**: L'uso di inline scripts costringe a tenere `'unsafe-inline'` in `script-src`, che di fatto disattiva le garanzie più forti della CSP contro XSS: qualsiasi `<script>` inline iniettato (es. tramite un bug di sanitizzazione in un futuro componente) verrebbe eseguito. Per la pagina pubblica (non studio) questo è il finding di CSP più significativo. Note positive:
  - I 3 script attuali sono **tutti contenuto controllato dal codice**, non input utente (theme init statico; ld+json da `siteConfig` hard-coded). **Non sono vulnerabilità attive** ma bloccano un hardening importante.
  - Le `ld+json` sono tipo `application/ld+json` che non viene eseguito come script, ma il tag `<script>` inline attira comunque il check CSP `script-src`.
- **Exploitation**: non diretto; è un "relaxation" della difesa in profondità.
- **Remediation** — due opzioni:

  **Opzione A — Nonce CSP (raccomandato):**
  1. Generare un nonce crypto-random per ogni request in un middleware o nel root layout.
  2. Passare il nonce come prop agli script inline.
  3. Sostituire `'unsafe-inline'` con `'nonce-<valore>'` nella CSP, e usare `'strict-dynamic'` per amplificare la sicurezza.
  4. Next.js 16 supporta questo pattern nativamente con headers dinamici.
  
  Esempio:
  ```tsx
  // middleware.ts
  import { NextResponse } from "next/server";
  export function middleware(req) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com; ...`;
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("x-nonce", nonce);
    return res;
  }
  ```
  ```tsx
  // layout.tsx
  import { headers } from "next/headers";
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  <script nonce={nonce} dangerouslySetInnerHTML={{ __html: "..." }} />
  ```

  **Opzione B — Esternalizzare gli script inline:**
  1. Spostare il theme init in un file statico `public/theme-init.js` e includerlo come `<script src="/theme-init.js" />`.
  2. Per le `ld+json` usare `next-seo` o `next/script` strategy `beforeInteractive` con `src` externa (ma ld+json per sua natura è contenuto, non script — meglio opzione A o C).
  
  **Opzione C — Accettare come tradeoff documentato:**
  - Siccome gli script sono tutti server-controlled, il rischio XSS da inline script è nullo finché non si introducono inline script con input utente. Documentare come "noto, accettato, tracciato" nel code style e aggiungere un lint rule che vieta nuovi `dangerouslySetInnerHTML` in layout. Meno sicuro di A ma più semplice.
- **Effort**: M (A) / M (B) / S (C)

---

### 3.5 Query Sanity (GROQ)

File esaminati: `lib/sanity.ts`, `sanity/schemas/testimonial.ts` (+ altri schemi dati per contesto).

**Controlli già in ordine (non-finding):**
- Tutte le query in `lib/sanity.ts` usano parametri `$locale`, `$slug`, `$topicSlug`, `$contentType` anziché interpolazione diretta di input utente. ✓
- Le porzioni di query assemblate tramite template string (`${hasTopicFilter ? '...' : ''}`) sono controllate da booleani interni, non da input esterno. ✓
- Nessuna query accetta un fragment GROQ arbitrario dal client. ✓

---

#### F-21 — `lib/sanity.ts` usa `useCdn: true` + nessun token → client read anonimo (dipende da F-15)

- **Severity**: dipende da F-15 (fino a High se il dataset è public)
- **Category**: Data exposure / Dataset visibility
- **Evidence**: `lib/sanity.ts:4-9`
  ```ts
  export const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: "2026-03-28",
    useCdn: true,
  });
  ```
- **Impact**: Nessun `token` è passato al client Sanity → le query vengono eseguite come "anonymous read". Se il dataset è pubblico (F-15), chiunque può replicare le stesse query direttamente da browser senza passare per il sito. Se il dataset è privato, le query del sito falliranno. Entrambe le opzioni implicano una verifica da fare nel dashboard Sanity — il codice come scritto dà per scontato "dataset pubblico". Fare cross-reference con F-15 per la verifica empirica.
- **Exploitation**: se dataset pubblico → trivially exploitable; altrimenti non sfruttabile.
- **Remediation**: stesse raccomandazioni di F-15. Se si sposta il dataset a privato, aggiungere `token: process.env.SANITY_READ_TOKEN` al client e verificare che tutte le server-side pages continuino a funzionare. Nessuna chiamata a `client.fetch` è fatta da un componente `"use client"` in questo codebase, quindi il token non verrebbe esposto al bundle.
- **Effort**: S (config)

---

### 3.6 Form client e rendering contenuti CMS

File esaminati: `components/sections/contact-form.tsx`, `lib/portable-text-components.tsx`, tutte le pagine che renderizzano PortableText (blog).

**Controlli già in ordine (non-finding):**
- `contact-form.tsx` non usa `dangerouslySetInnerHTML`; tutti gli input sono componenti controllati; l'errore di rete è solo una stringa localizzata, nessun rendering di HTML arbitrario. ✓
- `portable-text-components.tsx` renderizza i link con `rel="noopener noreferrer"` e `target="_blank"` per URL esterni (check `isExternal = value?.href?.startsWith("http")`) → prevenzione reverse tabnabbing. ✓
- Le immagini dentro portable text sono renderizzate tramite `next/image` che valida `src` contro `next.config.ts:images.remotePatterns` (solo `cdn.sanity.io`). URL con schema `javascript:` o `data:` saltano il domain match → next/image ritorna un errore di configurazione, non esegue. ✓

---

#### F-22 — `portable-text-components.tsx` non valida `value?.href` dei link prima di metterli in `<a href>`

- **Severity**: Low
- **Category**: XSS defense in depth
- **Evidence**: `lib/portable-text-components.tsx:30-42`
  ```tsx
  link: ({ children, value }) => {
    const isExternal = value?.href?.startsWith("http");
    return (
      <a
        href={value?.href}
        // ...
      >
  ```
- **Impact**: Un editor Sanity malizioso (insider) può impostare `value.href = "javascript:alert(document.cookie)"`. React generalmente NON escapa gli URL negli attributi `href` — li passa come sono, ed è il browser a eseguire `javascript:` se cliccato. Il check `startsWith("http")` serve solo a decidere `target="_blank"`, non a validare lo schema. Risultato: un link `javascript:` scritto via Sanity Studio viene renderizzato e cliccabile → clickjacking-to-XSS per utenti che cliccano.
  
  Questo è un **insider threat**: serve accesso editor Sanity. In un progetto con 1-2 editor fidati è basso rischio, ma coerente col threat model (3) "attacker mirato" dove un account editor compromesso diventa vettore. React 18+ ha un warning dev-only per schemi pericolosi, ma non blocca in produzione.
- **Exploitation**: richiede compromissione account editor Sanity → pubblicazione di un post con link malevolo → vittima clicca il link. Probabilità bassa ma fattibile.
- **Remediation**: validare lo schema in whitelist:
  ```tsx
  link: ({ children, value }) => {
    const href = value?.href;
    const safe = href && /^(https?:|mailto:|tel:|\/)/i.test(href);
    if (!safe) {
      return <span className="text-foreground-muted">{children}</span>;
    }
    const isExternal = href.startsWith("http");
    return (
      <a
        href={href}
        className="text-primary-text underline decoration-primary/30 hover:text-primary-dark hover:decoration-primary"
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  ```
- **Effort**: S

---

## 4. Findings — Passata B (checklist trasversale)

### 4.1 Security headers

File esaminato: `next.config.ts:13-58`.

**Headers presenti (non-finding):**
- `X-Content-Type-Options: nosniff` su tutte le route (`next.config.ts:19, 28`). ✓
- `X-Frame-Options: DENY` su route non-studio (`next.config.ts:27`). ✓ (manca su /studio → F-13)
- `Referrer-Policy: strict-origin-when-cross-origin` su tutte le route (`next.config.ts:20, 29`). ✓
- `Content-Security-Policy` presente con `default-src 'self'`, `frame-ancestors 'none'` → anti-clickjacking OK (`next.config.ts:37, 44`). ✓

I finding sotto si concentrano su (a) CSP con `'unsafe-inline'` e directive mancanti, (b) Permissions-Policy molto parziale, (c) HSTS / COOP/COEP/CORP non espliciti nel repo.

---

#### F-23 — CSP usa `'unsafe-inline'` in `script-src` e `style-src`

- **Severity**: High (script-src) + Medium (style-src)
- **Category**: CSP / XSS defense
- **Evidence**: `next.config.ts:38-39`
  ```ts
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  ```
- **Impact**: `'unsafe-inline'` in `script-src` disabilita in pratica una delle protezioni principali di CSP: qualsiasi XSS (anche un bug dormiente introdotto domani) può eseguire `<script>...</script>` inline. Senza di esso, un XSS riflesso o persistente da CMS (cfr. F-22) verrebbe bloccato dal browser. `'unsafe-inline'` in `style-src` ha impatto minore (CSS injection → data exfil limitata, defacement), ma rimane evitabile. Il motivo della presenza è documentato in F-20: Next.js App Router inietta 3 `<script>` inline in layout per i18n locale, Vercel Analytics init e Speed Insights init.
- **Exploitation**: nessun exploit diretto oggi (nessun XSS noto), ma qualsiasi futuro XSS diventa automaticamente sfruttabile. La presenza di input utente (form contatti, CMS Sanity) aumenta il baseline di rischio.
- **Remediation**: tre opzioni, in ordine di robustezza:
  1. **Nonce-based CSP** (preferito per Next.js 16): generare un nonce random per request in `proxy.ts` (middleware), metterlo in un header custom, leggerlo nei RSC e applicarlo ai `<Script strategy="beforeInteractive">` o tag inline. Next.js ha documentazione ufficiale per questo pattern. Richiede refactor dei 3 punti in F-20 che usano `dangerouslySetInnerHTML`. Eliminare `'unsafe-inline'` dopo la migrazione.
  2. **Hash-based CSP**: calcolare SHA-256 di ciascuno script inline statico e metterli in `script-src 'sha256-...'`. Funziona solo se gli script non cambiano. Fragile ai refactor.
  3. **Accettare il tradeoff** documentato (come già discusso in F-20 Opzione C) ma almeno aggiungere `'strict-dynamic'` se migrato a nonce. Non risolve il problema, solo riconosce.
- **Effort**: M (opzione 1) / S (opzione 2 se script stabili) / S (opzione 3, doc only)

---

#### F-24 — CSP manca direttive di hardening: `base-uri`, `form-action`, `object-src`, `upgrade-insecure-requests`

- **Severity**: Medium
- **Category**: CSP hardening
- **Evidence**: `next.config.ts:36-46` (block CSP intero)
- **Impact**: Quattro direttive che chiudono vettori residui di XSS / hijacking:
  - `base-uri 'none'` (o `'self'`) — impedisce a un XSS di iniettare `<base href="https://evil.com/">` e reindirizzare tutti i relative URL del sito verso un dominio attaccante. Senza questa, un XSS parziale diventa totale.
  - `form-action 'self'` — previene che un form del sito faccia POST verso un dominio attaccante (es. credential harvesting via form injection). Per il form contatti che tratta PII, questo è GDPR-rilevante.
  - `object-src 'none'` — blocca `<object>`, `<embed>`, `<applet>` (Flash/Java legacy). Superficie minima oggi, ma è one-liner.
  - `upgrade-insecure-requests` — forza ogni sub-request HTTP a essere promossa a HTTPS, evitando mixed content che degrada la security UI del browser.
  Con amplifier GDPR su `form-action` (PII contatti) → **Medium**.
- **Exploitation**: nessun exploit diretto, ma ognuna delle 4 direttive manca nel depth-in-defense. In combinazione con F-23 (`'unsafe-inline'` attivo) aumentano l'area d'attacco in caso di XSS.
- **Remediation**: aggiungere tutte e 4 al blocco CSP:
  ```ts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self'",
      "img-src 'self' data: blob: https://cdn.sanity.io",
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "frame-src 'self' https://www.google.com",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  ```
- **Effort**: S

---

#### F-25 — CSP `img-src` include `data:` e `blob:` senza necessità documentata

- **Severity**: Low
- **Category**: CSP hardening
- **Evidence**: `next.config.ts:41`
  ```ts
  "img-src 'self' data: blob: https://cdn.sanity.io",
  ```
- **Impact**: `data:` URIs in `img-src` permettono di esfiltrare dati codificati come base64 dentro `<img src="data:...">` in caso di XSS, aggirando alcuni filtri di DLP. `blob:` ha impatto simile. Next.js `next/image` non richiede `data:`/`blob:` per il suo funzionamento normale (usa URL remote o `/_next/image?url=...`). Se non ci sono usi espliciti di `data:`/`blob:` nel codice, sono over-permissive.
- **Exploitation**: nessun exploit diretto; riduce l'efficacia di CSP come mitigazione XSS.
- **Remediation**: verificare con `grep -rn "data:image\|URL\.createObjectURL" --include="*.ts" --include="*.tsx" app/ components/ lib/` se esiste uso reale. Se no, rimuovere `data:` e `blob:`. Se sì (es. canvas preview), mantenere solo quello necessario.
- **Effort**: S

---

#### F-26 — `Permissions-Policy` incompleta (solo 3 feature)

- **Severity**: Low
- **Category**: Headers hardening
- **Evidence**: `next.config.ts:30-33`
  ```ts
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ```
- **Impact**: `Permissions-Policy` è un allowlist: ciò che non viene esplicitamente disabilitato rimane accessibile via JS. Il sito dichiara solo `camera`, `microphone`, `geolocation`; rimangono abilitate feature che il sito non usa: `payment`, `usb`, `serial`, `hid`, `bluetooth`, `magnetometer`, `accelerometer`, `gyroscope`, `ambient-light-sensor`, `clipboard-read`, `clipboard-write`, `display-capture`, `encrypted-media`, `fullscreen`, `midi`, `picture-in-picture`, `publickey-credentials-get`, `screen-wake-lock`, `web-share`, `xr-spatial-tracking`, `autoplay`, `interest-cohort` (FLoC). Un XSS potrebbe usarle per fingerprinting o abuse.
- **Exploitation**: pre-requisito XSS. Hardening puro.
- **Remediation**: espandere la lista:
  ```ts
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "ambient-light-sensor=()",
      "autoplay=()",
      "battery=()",
      "bluetooth=()",
      "camera=()",
      "clipboard-read=()",
      "clipboard-write=()",
      "display-capture=()",
      "document-domain=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "hid=()",
      "idle-detection=()",
      "interest-cohort=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "publickey-credentials-get=()",
      "screen-wake-lock=()",
      "serial=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  ```
- **Effort**: S

---

#### F-27 — `Strict-Transport-Security` (HSTS) non dichiarato esplicitamente nel repo

- **Severity**: Medium
- **Category**: Transport security
- **Evidence**: `next.config.ts:26-47` — nessun entry `Strict-Transport-Security` nel block headers per route non-studio.
- **Impact**: HSTS indica al browser di forzare HTTPS per N secondi, impedendo downgrade SSL-strip. Vercel di default abilita HSTS (`max-age=63072000; includeSubDomains; preload` a livello di edge), quindi in produzione il sito è probabilmente già protetto — ma questo è "config Vercel", non garantito dal repo. Se il sito viene spostato a un altro hosting, o se Vercel cambia default, si perde la protezione. Inoltre, senza `preload` esplicito nella HSTS preload list Chrome, un primo visitatore su HTTP è vulnerabile. **Da verificare** con `curl -I https://<dominio-ida>` che header manda l'edge Vercel oggi.
- **Exploitation**: richiede MITM sul primo accesso in HTTP (wifi pubblico). Probabilità bassa ma reale su reti non fidate.
- **Remediation**: aggiungere esplicitamente nel block non-studio:
  ```ts
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  ```
  E sottomettere il dominio a https://hstspreload.org/ per preload list Chrome.
- **Effort**: S (codice) + manuale (submit preload)

---

#### F-28 — Headers cross-origin (COOP / COEP / CORP) non dichiarati

- **Severity**: Low
- **Category**: Cross-origin isolation
- **Evidence**: `next.config.ts:26-47` — nessun entry `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Resource-Policy`.
- **Impact**: La triade COOP/COEP/CORP protegge da Spectre-like attacks e da XS-Leaks (cross-site information leak). Per un sito con embed di terze parti (Google Maps iframe → F-18), `COEP: require-corp` è troppo restrittivo e romperebbe l'embed. Ma `COOP: same-origin-allow-popups` e `CORP: same-origin` sono applicabili senza rotture. Hardening puro, non blocca exploit noti.
- **Exploitation**: scenari avanzati (XS-Leaks, timing attack su cross-origin). Threat model 3 (attacker mirato).
- **Remediation**: aggiungere:
  ```ts
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ```
  **Non** aggiungere COEP a meno di rimuovere Google Maps iframe (F-18). Testare che il link WhatsApp/Google Maps continui a funzionare.
- **Effort**: S

### 4.2 Gestione segreti ed env

File esaminati: `.env.example`, `.env.local` (solo nomi variabili, mai valori), `.gitignore`, `lib/sanity.ts`, `sanity.config.ts`, `sanity.cli.ts`, `app/api/contact/route.ts`, `app/api/revalidate/route.ts`.

**Inventario variabili d'ambiente (tutte enumerate):**

| Variabile | Classe | Usata in | Note |
|-----------|--------|----------|------|
| `RESEND_API_KEY` | Segreta | `app/api/contact/route.ts:7` | server-only ✓ |
| `CONTACT_EMAIL` | Segreta (PII dell'owner) | `app/api/contact/route.ts:9, 12` | server-only ✓ |
| `SANITY_REVALIDATION_SECRET` | Segreta | `app/api/revalidate/route.ts:5` | server-only ✓, già trattata in F-08 |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Pubblica | `lib/sanity.ts:5`, `sanity.config.ts:9`, `sanity.cli.ts:5` | by design, nel bundle client |
| `NEXT_PUBLIC_SANITY_DATASET` | Pubblica | `lib/sanity.ts:6`, `sanity.config.ts:10`, `sanity.cli.ts:6` | by design, nel bundle client |

**Controlli già in ordine (non-finding):**
- Nessuna variabile segreta è prefissata `NEXT_PUBLIC_` ✓.
- Nessun segreto hardcoded nel codice (grep su `sk_live`, `sk_test`, `re_...`, `Bearer`) ✓.
- `.gitignore` contiene `.env*` → tutti i file `.env*` sono esclusi ✓.
- `git ls-files` non trova nessun file `.env` tracciato ✓.
- `RESEND_API_KEY`, `CONTACT_EMAIL`, `SANITY_REVALIDATION_SECRET` sono usati **solo** in `app/api/*`, cioè route server (RSC / API handler). Non finiscono nel bundle client ✓.
- `lib/sanity.ts` è chiamato solo da RSC/server actions, non da `"use client"`, quindi `NEXT_PUBLIC_*` resta nel contesto Node al fetch time (e va bene anche fosse nel client: sono pubbliche by design).

I finding sotto sono limitati a *gap di documentazione/brittleness* delle env, non a leak.

---

#### F-29 — `.env.example` incompleto: mancano `NEXT_PUBLIC_SANITY_*` e `SANITY_REVALIDATION_SECRET`

- **Severity**: Low
- **Category**: DevEx / Configurazione
- **Evidence**: `.env.example` (intero file)
  ```
  RESEND_API_KEY=
  CONTACT_EMAIL=
  ```
- **Impact**: Il file `.env.example` documenta solo 2 delle 5 env necessarie. Un developer che clona il repo e fa `cp .env.example .env.local` si ritrova un build rotto perché mancano `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_REVALIDATION_SECRET`. Non è un rischio di sicurezza in sé, ma aumenta la probabilità che qualcuno finisca a debuggare a caso e finisca per hardcodare valori nel codice o committare per sbaglio un `.env` per far partire il build. Impatto indiretto sulla security posture.
- **Exploitation**: nessuno diretto.
- **Remediation**: aggiornare `.env.example`:
  ```
  # Resend API key for contact form emails
  # Get yours at https://resend.com
  RESEND_API_KEY=

  # Email address to receive contact form submissions
  CONTACT_EMAIL=

  # Sanity project identifiers (public, safe to commit to .env.example)
  NEXT_PUBLIC_SANITY_PROJECT_ID=
  NEXT_PUBLIC_SANITY_DATASET=production

  # Secret shared with Sanity webhook for /api/revalidate signature verification
  # Generate with: openssl rand -hex 32
  SANITY_REVALIDATION_SECRET=
  ```
- **Effort**: S

---

#### F-30 — Non-null assertions su `process.env.*` senza early-exit o schema validation

- **Severity**: Low
- **Category**: Config robustness
- **Evidence**: Casi diretti di `process.env.FOO!`:
  - `lib/sanity.ts:5-6` (`NEXT_PUBLIC_SANITY_PROJECT_ID!`, `NEXT_PUBLIC_SANITY_DATASET!`)
  - `sanity.config.ts:9-10` (idem)
  - `sanity.cli.ts:5-6` (idem)
  - `app/api/revalidate/route.ts:5` (`SANITY_REVALIDATION_SECRET!`) — già rilevato in F-08
- **Impact**: Il pattern `!` dice al compilatore "questa variabile esiste sicuramente", ma a runtime non c'è nessun controllo. Se la variabile manca al boot:
  - `NEXT_PUBLIC_SANITY_*` → il build Next.js fallisce in produzione (gli env pubblici sono risolti a build time), quindi è self-healing per il deploy Vercel.
  - `SANITY_REVALIDATION_SECRET` → il codice passa `undefined` a `isValidSignature`, comportamento dipendente dal provider (F-08 già copre).
  
  Nessuna di queste esplode in maniera grave, ma è difesa in profondità mancata: una `env.ts` con validazione (es. con `zod` o similari) al boot avrebbe dato fail-fast con errore chiaro invece di errori cryptic runtime.
- **Exploitation**: nessuna.
- **Remediation** (opzione minima): creare `lib/env.ts` che valida e ri-esporta:
  ```ts
  // lib/env.ts
  const required = [
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    "NEXT_PUBLIC_SANITY_DATASET",
    "RESEND_API_KEY",
    "CONTACT_EMAIL",
    "SANITY_REVALIDATION_SECRET",
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  export const env = {
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET as string,
    RESEND_API_KEY: process.env.RESEND_API_KEY as string,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL as string,
    SANITY_REVALIDATION_SECRET: process.env.SANITY_REVALIDATION_SECRET as string,
  };
  ```
  E sostituire ogni `process.env.X!` con `env.X`. Opzionalmente usare `zod` per validazione più rigorosa.
- **Effort**: S

### 4.3 Supply chain / dipendenze

Eseguiti `npm audit` e `npm outdated` al commit di riferimento. Totale vulnerabilità riportate da `npm audit`: **12 (5 high, 7 moderate, 0 critical)**. Vedi §6 per la tabella compatta delle dipendenze dirette.

---

#### F-31 — Next.js 16.1.6 ha 5 advisory aperte, fix disponibile in 16.2.3

- **Severity**: High (Medium baseline + amplifier per contact form → il sito tratta PII)
- **Category**: Supply chain / CVE
- **Evidence**: `npm audit` e `package.json`
  ```
  next  16.0.0-beta.0 - 16.1.6
  Severity: moderate
  - GHSA-ggv3-7p47-pfv8 — HTTP request smuggling in rewrites
  - GHSA-3x4c-7xq6-9pq8 — Unbounded next/image disk cache growth → DoS storage
  - GHSA-h27x-g6w4-24gq — Unbounded postponed resume buffering → DoS
  - GHSA-mq59-m269-xvcx — null origin can bypass Server Actions CSRF checks
  - GHSA-jcc7-9wpm-mj36 — null origin can bypass dev HMR websocket CSRF checks
  fix available via `npm audit fix --force` → next@16.2.3
  ```
- **Impact**: Cinque advisory npm classificate `moderate` ma la severity reale per questo sito è più alta. In particolare:
  - **GHSA-mq59-m269-xvcx** (Server Actions CSRF bypass) è il più rilevante: il sito usa React 19 / App Router e anche se il form contatti è un API route classico, qualsiasi Server Action futura sarebbe esposta.
  - **GHSA-ggv3-7p47-pfv8** (HTTP request smuggling in rewrites) tocca `next.config.ts` rewrites/i18n routing.
  - Le due DoS (cache crescita, buffer) sono amplificate dal traffico low-volume del sito ma rilevanti se un attaccante punta saturation.
  Con amplifier GDPR (contact form presente) → **High**.
- **Exploitation**: exploit pubblici nelle GHSA note; CSRF bypass è il più pratico.
- **Remediation**: aggiornare Next.js: `npm i next@16.2.3 eslint-config-next@16.2.3`. È un minor bump, rischio bassi-medi. Rifare build + test manuale del form + Studio. Se bump troppo oneroso, monitorare advisory e pianificare upgrade nel prossimo ciclo.
- **Effort**: S

---

#### F-32 — `sanity` 5.18 obsoleto: 5.20 disponibile, catena vulnerabilità js-yaml/lodash

- **Severity**: Medium
- **Category**: Supply chain / CVE
- **Evidence**: `npm outdated` mostra `sanity@5.18.0 → 5.20.0`; `npm audit` elenca:
  ```
  js-yaml <3.14.2 → prototype pollution (GHSA-mh29-5h37-fv8m)
    via @vercel/frameworks → @sanity/cli → sanity → next-sanity
  lodash <=4.17.23 → code injection via _.template (GHSA-r5fr-rjxr-66jc)
                     + prototype pollution (GHSA-f23m-r3pf-42rh)
  lodash-es <=4.17.23 → stesse CVE di lodash
  ```
- **Impact**: Le vulnerabilità sono in dipendenze transitive di `sanity` (CLI + studio build). Sono sfruttabili solo se:
  1. Un attaccante può fornire YAML malevolo al CLI `sanity` (es. CI che processa config da PR untrusted). Il sito non ha workflow CI che gira `sanity` su input esterni → vettore chiuso.
  2. `lodash._template` viene chiamato su stringa user-controlled. Nel codice del sito non c'è nessuna chiamata a lodash; l'uso è solo interno a Sanity Studio.
  
  Nel contesto di questo repo il rischio residuo è basso (sono tool di dev/build, non runtime di produzione), ma è hygiene: ogni upgrade futuro delle dipendenze sanity-ecosystem porterà queste fix. Il fix richiede però `--force` e un bump maggiore di sanity → 5.14.1 secondo npm (la CLI propone un downgrade peculiare, da verificare manualmente).
- **Exploitation**: non sfruttabile nel modello di minaccia attuale del sito.
- **Remediation**:
  1. Aggiornare `sanity` e `@sanity/vision` alla latest compatibile (`5.20.0`): `npm i sanity@5.20.0 @sanity/vision@5.20.0 @sanity/image-url@2.1.1 next-sanity@12.2.2`.
  2. Rifare `npm audit` e verificare che lodash/js-yaml siano risolti o almeno confinati a dev tree.
  3. Se Sanity 6.x è disponibile stabile, pianificare upgrade maggiore separato (breaking changes schema/Studio).
- **Effort**: M (rischio di breaking change Studio)

---

#### F-33 — `styled-components` 6.3.12 è nelle dependencies ma non è usato da nessun file sorgente

- **Severity**: Low
- **Category**: Supply chain / dead dependency
- **Evidence**: `package.json:31` (intro di `"styled-components": "^6.3.12"` in `dependencies`). `grep -rn "from ['\"]styled-components['\"]" --include="*.{ts,tsx}"` nel sorgente → **nessun match**. Il progetto è Tailwind-first (`globals.css`, `tailwind.config.ts`), nessun componente usa styled-components.
- **Impact**: Dipendenza viva non usata = attacco supply chain gratuito. Il pacchetto viene comunque installato (runtime dep), quindi:
  - Aumenta inutilmente il bundle di produzione (se importato per errore in futuro → incremento KB).
  - Allarga la superficie di supply-chain attack: qualunque CVE futura su styled-components richiede patching anche senza beneficio.
  - Rende più rumoroso `npm audit`.
  Dal lato sicurezza è Low, ma è un easy win.
- **Exploitation**: indiretta (supply chain compromise di pacchetti non utilizzati).
- **Remediation**: `npm uninstall styled-components`. Eseguire `npm run build` per confermare che nessuna dep transitiva richieda styled-components come peer. Se una dep peer-depende su di esso, documentare e lasciare.
- **Effort**: S

---

#### F-34 — Vulnerabilità transitive hardcoded: `picomatch`, `vite`, `flatted`, `brace-expansion`

- **Severity**: Low (tooling dev-time, non runtime di produzione)
- **Category**: Supply chain / tooling
- **Evidence**: `npm audit`:
  ```
  picomatch <=2.3.1 || 4.0.0 - 4.0.3 (high) — ReDoS + POSIX injection
  vite 7.0.0 - 7.3.1 (high) — path traversal, ws arbitrary file read
  flatted <=3.4.1 (high) — prototype pollution, unbounded recursion DoS
  brace-expansion <1.1.13 || >=4.0.0 <5.0.5 (moderate) — process hang, memory exhaustion
  ```
- **Impact**: Queste sono tutte deps transitive che appaiono nel tree del repo perché:
  - `vite` arriva da `@sanity/vision` (Studio dev server).
  - `picomatch` da `@parcel/watcher` / `tinyglobby` (file watcher dev).
  - `flatted` da ESLint config cache.
  - `brace-expansion` da `@typescript-eslint`.
  Nessuna di queste gira in runtime di produzione Vercel: sono solo dev tool. Un attaccante che vuole sfruttarle dovrebbe già avere accesso allo sviluppatore locale (es. dev server esposto). Il sito in produzione non è esposto. Rimangono hygiene: `npm audit fix` (non `--force`) le risolve senza impatto funzionale.
- **Exploitation**: non raggiungibile dalla produzione.
- **Remediation**: eseguire `npm audit fix` (non `--force`). Verificare che il lockfile sia aggiornato e che `npm run build` + `npm run dev` funzionino. Commit del nuovo `package-lock.json`.
- **Effort**: S

---

#### F-35 — `@vercel/analytics` 1.6.1 e `@vercel/speed-insights` 1.3.1 major outdated (disponibili 2.x)

- **Severity**: Low
- **Category**: Supply chain / outdated major
- **Evidence**: `npm outdated`:
  ```
  @vercel/analytics      1.6.1   1.6.1  2.0.1
  @vercel/speed-insights 1.3.1   1.3.1  2.0.0
  ```
- **Impact**: Major bump disponibile da Vercel per entrambi i SDK. Le release 2.x includono miglioramenti alla privacy (consent management), fingerprinting ridotto, e fix minori. Nessuna CVE nota. Major bump → breaking changes leggeri (API di init). Rilevante indirettamente per F-17 (consent per analytics).
- **Exploitation**: nessuna.
- **Remediation**: quando si affronta F-17 (consent gating), aggiornare anche a 2.x per beneficiare dei controlli di privacy nativi:
  ```
  npm i @vercel/analytics@^2 @vercel/speed-insights@^2
  ```
- **Effort**: S

### 4.4 Logging, error handling, robots/sitemap, routing i18n

File esaminati: `app/api/contact/route.ts`, `app/api/revalidate/route.ts`, `app/[locale]/error.tsx`, `app/robots.ts`, `app/sitemap.ts`, `proxy.ts`, `i18n/routing.ts`.

**Controlli già in ordine (non-finding):**
- `app/[locale]/error.tsx` è un error boundary client pulito: mostra solo "500" + testo tradotto + bottone reset, non logga l'oggetto `error` né mostra stack trace (`error.tsx:14-22`). ✓
- `app/api/contact/route.ts:126` logga `"Contact API error"` come stringa fissa, senza oggetto (diverso da `route.ts:120` che logga `error`, già coperto da F-04). ✓
- `app/api/revalidate/route.ts` non logga nulla in nessun branch (nessun `console.*`). ✓
- Non c'è nessun `global-error.tsx` custom che possa leakare più informazioni di quello i18n. ✓
- `proxy.ts` (middleware) delega tutto a next-intl: matcher limitato a `/` e `/(it|en)/:path*`, nessun rewrite dinamico custom → no open redirect. ✓
- `i18n/routing.ts` definisce pathnames esplicite per ogni pagina, no catch-all wildcard che possa essere abusato. ✓
- `app/sitemap.ts` enumera solo pagine pubbliche + blog post da Sanity, nessun path admin/preview/studio. ✓

---

#### F-36 — `robots.ts` permissivo: non esclude `/studio`, `/api/*`, né percorsi sensibili

- **Severity**: Medium
- **Category**: Information disclosure / Discovery
- **Evidence**: `app/robots.ts:4-12`
  ```ts
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
  ```
- **Impact**: `allow: "/"` autorizza crawler su tutti i path, inclusi:
  - `/studio/*` → il CMS login page viene indicizzato da Google se il bot lo scopre. Cfr. F-16 (banner/discovery Studio). Una ricerca Google `site:<dominio-ida> studio` rivelerebbe immediatamente la presenza del CMS.
  - `/studio/vision` → peggio: il tool GROQ explorer (cfr. F-14) potenzialmente indicizzato. Se Google clicca e screenshot-a, appare in cache il boot di Sanity.
  - `/api/contact` e `/api/revalidate` → le API route rispondono su GET con 405 o simile; i bot le hit comunque, consumando budget e inquinando i log.
  - Qualsiasi futura route semi-privata (es. `/admin`) non sarebbe esclusa by default.
  Anche se `robots.txt` non è un meccanismo di sicurezza (i bot malevoli lo ignorano), è la prima linea contro indicizzazione non voluta da motori legittimi. Con amplifier GDPR (Studio può esporre flow con dati di contatto nei draft se usato per salvare messaggi) → **Medium**.
- **Exploitation**: banale discovery via Google/Bing. Nessun exploit attivo, ma riduce la sicurezza per oscurità che F-16 già critica.
- **Remediation**: riscrivere `robots.ts`:
  ```ts
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/studio/", "/api/"],
        },
      ],
      sitemap: `${siteConfig.url}/sitemap.xml`,
    };
  }
  ```
  Nota: questo non protegge da discovery attivo — serve comunque mettere `/studio` dietro un'auth edge (cfr. F-12). È solo hygiene.
- **Effort**: S

---

#### F-37 — `sitemap.ts` non restituisce `alternates.languages` per i blog post senza translation link

- **Severity**: Low
- **Category**: SEO / Metadata hygiene (non security-critical)
- **Evidence**: `app/sitemap.ts:61-80`
  ```ts
  for (const post of posts) {
    const langPrefix = post.language === "it" ? "it" : "en";
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${baseUrl}/${langPrefix}/blog/${post.slug}`,
      // ...
    };
    if (post.translationSlug && post.translationLang) {
      entry.alternates = { /* ... */ };
    }
    entries.push(entry);
  }
  ```
- **Impact**: Un post senza `translationOf` viene emesso senza alternates linguistici. Questo non è una vulnerabilità di sicurezza — è un gap SEO (hreflang). Lo includo qui perché l'ispezione è stata fatta nel tempo del Task 9 e per completezza. Nessun impatto diretto su sicurezza, ma il reviewer umano deve saperlo.
- **Exploitation**: non applicabile.
- **Remediation**: fuori scope audit. Registrare in backlog SEO.
- **Effort**: S — ma non prioritario in questo audit.

---

#### F-38 — `sitemap.ts` fetch di tutti i post senza filtro lingua, causa duplicazione URL

- **Severity**: Low
- **Category**: Information disclosure / Data consistency
- **Evidence**: `app/sitemap.ts:50-59`
  ```ts
  const posts: { slug: string; language: string; ... }[] = await client.fetch(
    `*[_type == "post"] { ... }`,
  );
  for (const post of posts) {
    const langPrefix = post.language === "it" ? "it" : "en";
    entries.push({ url: `${baseUrl}/${langPrefix}/blog/${post.slug}`, ... });
  }
  ```
- **Impact**: La query espone ogni post in ogni lingua presente in Sanity. Se un editor mette un post in stato draft con `language: "it"` ma senza slug EN, il loop comunque emette `/it/blog/<slug>`. **Se un editor crea un post in una lingua non-supportata** (es. `language: "fr"`), il ternario collassa a `"en"` e produce `/en/blog/<slug>` → URL inconsistente. Non è un leak segreto (il post è published), ma riduce l'integrità della sitemap e può esporre contenuti prima del tempo se l'editor stressa il workflow. Non è un problema di sicurezza classico.
- **Exploitation**: n/a.
- **Remediation**: filtrare GROQ a lingue supportate e skip `!defined(publishedAt)`:
  ```ts
  `*[_type == "post" && language in ["it","en"] && defined(publishedAt) && defined(slug.current)] { ... }`
  ```
- **Effort**: S

---

#### F-39 — `/api/revalidate` non registra né `Error` né diagnostics

- **Severity**: Low
- **Category**: Observability
- **Evidence**: `app/api/revalidate/route.ts` (file intero, 45 righe)
  - Nessun `console.log` / `console.warn` / `console.error`.
  - Silent return su signature invalid (401) → non si sa se un bot sta martellando.
  - Silent return su payload invalido (400) → stesso.
- **Impact**: Rovescio della medaglia di F-04 (troppo logging PII nel contact form): qui troppo poco. Se un attaccante prova a brute-force la signature HMAC per forgiare un payload, non c'è alcun segnale nei log. Idealmente si dovrebbe contare i 401 per rate-limit e alerting. Questa è observability, non sicurezza diretta.
- **Exploitation**: n/a (defensive hardening).
- **Remediation**: aggiungere metriche/log strutturati (senza PII):
  ```ts
  if (!signature || !(await isValidSignature(body, signature, secret))) {
    console.warn("revalidate: invalid signature", { ip: req.headers.get("x-forwarded-for"), ts: Date.now() });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  ```
  Idealmente pipare a Vercel Log Drains o Axiom per alerting.
- **Effort**: S

---

#### F-40 — Middleware `proxy.ts` matcher copre solo root e `/(it|en)/*`, lascia escoperte rotte pubblicate senza locale prefix

- **Severity**: Low
- **Category**: i18n routing consistency
- **Evidence**: `proxy.ts:7`
  ```ts
  export const config = {
    matcher: ["/", "/(it|en)/:path*"],
  };
  ```
- **Impact**: Il middleware next-intl gira solo su `/` e sotto `/(it|en)/*`. Questo significa che `/api/*`, `/studio/*`, `/sitemap.xml`, `/robots.txt`, `/_next/*` restano escluse — corretto. Ma significa anche che se un attaccante visita un path che non matcha (es. `/xx/foo` con locale inesistente), il comportamento dipende dal fallback di next-intl: redirect a default locale o 404? Next-intl `localePrefix: "as-needed"` (default) reindirizza path senza locale a quello default. Un URL malformato come `/fr/contatti` viene **404** perché `fr` non è in `locales`. ✓ Non è un vero bug di sicurezza, ma vale la pena aggiungere un test e documentare. Nessun vettore di open redirect trovato perché next-intl non costruisce redirect da path utente arbitrari.
- **Exploitation**: n/a.
- **Remediation**: aggiungere un test manuale (o in CI) che verifichi:
  - `/fr/contatti` → 404
  - `/it/contatti%00` → gestito correttamente (no crash)
  - `/it/contatti?redirect=//evil.com` → parametri query non processati dal middleware
  Lasciare il matcher invariato. Documentare comportamento atteso in `proxy.ts` con commento.
- **Effort**: S

### 4.5 Resend delivery, backup, monitoring

File esaminati: `app/api/contact/route.ts` (Resend init + invio), `lib/emails/contact-email.tsx` (template email), `package.json` (versione Resend).

**Nota**: la maggior parte dei finding Resend è già coperta da F-02 (mittente `onboarding@resend.dev`) e F-04 (log PII). Qui aggiungo solo gap nuovi: link tracking, retention, backup Sanity, monitoring.

---

#### F-41 — Link tracking Resend non esplicitamente disabilitato (default provider = on?)

- **Severity**: Low (amplifier GDPR → Medium se il link tracking è effettivamente attivo)
- **Category**: GDPR / Email privacy
- **Evidence**: `app/api/contact/route.ts:93-117`
  ```ts
  const { error } = await resend.emails.send({
    from: "Sito Ida Sato <onboarding@resend.dev>",
    to: CONTACT_EMAIL,
    replyTo: sanitizedEmail,
    subject: `Nuovo messaggio da ${sanitizedName.slice(0, 100)}`,
    react: ContactEmail({ ... }),
    text: [ ... ].join("\n"),
  });
  ```
- **Impact**: Resend offre "click tracking" e "open tracking" (pixel + redirect wrapper) come feature opzionali. Il codice non specifica esplicitamente `headers` o `tags` che le disabilitino — il comportamento dipende dalla configurazione di default sul dashboard Resend, che **da verificare**. Se attivi, i link nell'email (es. `tel:`, `mailto:` o link a siti esterni) vengono riscritti come redirect via `r.resend.com/...`, e l'apertura viene trackata via pixel. Per una email di contatto con PII, questo è un trattamento dati non-consented del destinatario (Ida) e possibilmente dell'interessato (il mittente del form). Inoltre, quando Ida clicca "Rispondi" per contattare il paziente, se il link è stato riscritto può avere latenza o portare a un URL non voluto.
- **Exploitation**: non è un exploit. È un potenziale default non-privacy-friendly che va neutralizzato.
- **Remediation**: nel dashboard Resend → Settings → Tracking, disabilitare "Click tracking" e "Open tracking" per il progetto. Opzionalmente nel codice passare header espliciti:
  ```ts
  await resend.emails.send({
    // ...
    headers: {
      "List-Unsubscribe": "<mailto:...>", // se mai si invia newsletter
    },
  });
  ```
  Dopo il fix, verificare inviando un test e ispezionando l'HTML source: i link NON devono essere wrapped in `r.resend.com`.
- **Effort**: S (config dashboard)

---

#### F-42 — Retention messaggi Resend non documentata nel repo

- **Severity**: Medium (amplifier GDPR già applicato al baseline Low)
- **Category**: GDPR / Data retention
- **Evidence**: nessun riferimento a retention policy in `CLAUDE.md`, `README.md`, privacy policy, o codice.
- **Impact**: Resend conserva le email inviate per un periodo (default: ~30 giorni, visibili nel dashboard "Emails" come storico). Questo è un secondo luogo in cui le PII del form contatti sono conservate (oltre alla casella di posta di Ida). La privacy policy del sito deve dichiararlo se vero — cfr. F-44 (Passata C). Il log retention Resend non è sotto il controllo del codice: è config dashboard. Serve verificare nel piano Resend attuale quale retention è attiva (Free tier: 30 giorni; Pro: 90 giorni configurabile).
- **Exploitation**: indiretto — un takeover dell'account Resend esporrebbe storico PII dei contatti.
- **Remediation**:
  1. Verificare retention attuale in Resend dashboard → Logs settings.
  2. Ridurre al minimo compatibile con il debug (es. 7-14 giorni).
  3. Documentare il valore scelto nella privacy policy (cfr. F-44).
  4. Aggiungere 2FA sull'account Resend.
- **Effort**: S (config dashboard + doc)

---

#### F-43 — Nessun backup/export programmato del dataset Sanity

- **Severity**: Medium
- **Category**: Backup / Disaster recovery
- **Evidence**: nessun workflow CI/GitHub Actions, nessuno script `package.json` per `sanity dataset export`, nessuna docu su backup nel repo.
- **Impact**: Il dataset Sanity contiene tutti i contenuti editoriali (blog post, testimonianze, servizi, topic, FAQ). Se il dataset viene eliminato per errore, compromesso, o se l'account Sanity ha un problema, il contenuto è perso. Sanity offre versioning interno e undo, ma non un vero backup offline: un account compromesso può cancellare anche la history. Per un sito content-driven, questo è rischio operativo.
  
  Il codice è su git → backuppato via GitHub. Gli asset media (immagini caricate nel Studio) e i documenti Sanity sono l'unica cosa **non** coperta da git.
- **Exploitation**: indiretto — si attiva su incident (compromise, human error, Sanity outage).
- **Remediation**:
  1. Opzione A (manuale ricorrente): creare uno script `scripts/backup-sanity.sh` che esegue `sanity dataset export production backup-$(date +%Y%m%d).tar.gz` e documentarlo in `CLAUDE.md`. L'utente lo esegue mensilmente.
  2. Opzione B (automatica CI): GitHub Action schedulata che chiama Sanity API con un token read-only, crea l'export, e lo salva come artifact o su S3/Vercel Blob. Richiede `SANITY_AUTH_TOKEN` come secret repo.
  3. Opzione C (paid): Sanity stessa offre backup enterprise.
  Preferita: **B** se c'è tempo, **A** come interim.
- **Effort**: M (CI automation) / S (script manuale)

---

#### F-44 — Nessun monitoring / alerting su endpoint pubblici

- **Severity**: Medium
- **Category**: Observability / Incident response
- **Evidence**: nessuna config di log drains, webhooks di alerting, uptime monitor, in repo o documentazione.
- **Impact**: Senza alerting:
  - Un abuse burst su `/api/contact` (migliaia di request/minuto) non genera alert → spam di mail a Ida finché non se ne accorge lei stessa.
  - Un downtime del sito (deploy rotto, Sanity fetch failing) non viene rilevato → pazienti che cercano il sito non lo trovano e non c'è segnale finché non scrive qualcuno.
  - Un 5xx spike su `/api/contact` silenzioso significa form rotto → messaggi persi.
  - Brute-force silenzioso su `/api/revalidate` (F-39) non rilevato.
  Il threat model include spam/bot come priorità 2: manca l'occhio per vederlo.
- **Exploitation**: indiretto — peggiora MTTR su qualsiasi incident.
- **Remediation**: setup minimo con strumenti gratuiti:
  1. **Uptime monitor** (Better Stack/UptimeRobot free): sonda `GET /it` e `GET /en` ogni 5 minuti.
  2. **Error rate alert**: Vercel Analytics include "Log Drains" (plan Pro); gratis si può usare Axiom free tier collegato via log drain.
  3. **Abuse alert su `/api/contact`**: una semplice GitHub Action che legge Vercel analytics API 1x/giorno e alerta se request > soglia.
  4. **Webhook pagina Status**: opzionale, per comunicare downtime ai visitatori.
- **Effort**: M (setup iniziale) — una volta fatto, praticamente zero manutenzione.

---

#### F-45 — `lib/emails/contact-email.tsx`: review veloce (non-finding, documentazione)

File esaminato per completezza. `ContactEmail` (template React Email) riceve `name`, `email`, `phone`, `message`, `receivedAt` come prop e li renderizza in markup statico. React Email escapa i valori by default → nessun HTML injection via campi utente. Il template non fa fetch esterni, non include tracking pixel, non embedda immagini remote. ✓ nessun finding.

---

## 5. Findings — Passata C (GDPR gap analysis)

**Disclaimer**: questa è gap analysis tecnica, non consulenza legale. Per le voci marcate ⚖️ è **obbligatorio** consultare un DPO / avvocato specializzato in protezione dati, soprattutto perché il titolare è una psicologa che può trattare dati di natura sanitaria (art. 9 GDPR).

File esaminati: `app/[locale]/privacy/page.tsx`, `messages/it.json` / `messages/en.json` sezione `privacy`, + tutti i file touchati dai task precedenti.

---

### 5.1 Dati personali effettivamente raccolti dal codice

| Dato | Fonte | Dove finisce | Nota |
|------|-------|--------------|------|
| Nome | Form contatti `body.name` | Email Resend → casella Ida; log Resend (retention F-42) | PII base |
| Email | Form contatti `body.email` | Email Resend (`replyTo`) → casella Ida; log Resend | PII base |
| Telefono (opz.) | Form contatti `body.phone` | Email Resend → casella Ida; log Resend | PII base |
| Testo messaggio | Form contatti `body.message` (5000 char) | Email Resend → casella Ida; log Resend | **Potenzialmente art. 9** ⚖️ (dati sanitari) |
| IP sorgente | Header `x-forwarded-for` usato per rate limit (`route.ts:41`) | Map in-memory volatile (F-01) + **log Vercel** (retention edge) | PII (indirizzo IP = dato personale per GDPR) |
| Timestamp submit | `body.timestamp` (anti-bot check) | Non persistito | non-PII |
| User-Agent | (implicito nei log Vercel edge) | Log Vercel | PII combinato |
| Country / region | Vercel Analytics | Vercel Analytics backend | PII aggregato |
| Pageviews, referrer, device | Vercel Analytics + Speed Insights | Vercel backend | PII aggregato ("privacy friendly" ma dato personale) |
| Web Vitals (LCP, CLS, INP, TTFB) | Vercel Speed Insights | Vercel backend | Non-PII diretta, fingerprintable |
| Preferenza tema (chiaro/scuro), locale | localStorage | Solo device utente | Non-PII |
| Contenuti blog / testimonianze | Sanity CDN (server-side fetch) | Pubblicati come pagine | Non-PII |

### 5.2 Processor / terze parti realmente toccati dal codice

| Processor | Scopo | Dove nel codice | Dati trasferiti |
|-----------|-------|-----------------|-----------------|
| **Vercel Inc.** (US/EU) | Hosting + Analytics + Speed Insights | `app/[locale]/layout.tsx:10-11, 145-146`, deployment | IP, UA, pageviews, Web Vitals, log applicativi, payload email via serverless |
| **Resend** (US/EU) | Invio email contact form | `app/api/contact/route.ts:7, 93-117` | Nome, email, telefono, messaggio, IP sorgente (via header) |
| **Sanity AS** (NO/EU) | CMS + CDN asset (`cdn.sanity.io`) | `lib/sanity.ts`, `sanity/`, `app/studio/*` | Nessun dato utente del sito (solo contenuto editoriale); ma CDN vede IP+UA al download asset |
| **Google LLC** (US) — Maps | Embed iframe `/contatti` | `next.config.ts:43` (`frame-src https://www.google.com`), `app/[locale]/contatti/page.tsx` (component iframe) | IP, referrer, cookies Google del visitatore. **F-18** |
| **Google LLC** (US) — Fonts | Dichiarato in CSP, **NON usato a runtime** (`next/font` self-hosted) | `next.config.ts:40, 44` | Nessuno — la CSP è over-permissive (**F-19**) |
| **GitHub** (per deployment) | Fuori dal trattamento dati utente | n/a | n/a |

### 5.3 Gap: codice vs privacy policy attuale

Tabella di confronto riga per riga:

| Elemento | Nel codice? | Dichiarato in policy? | Gap |
|----------|-------------|----------------------|-----|
| Nome | ✅ | ✅ (`dataCollected`) | OK |
| Email | ✅ | ✅ (`dataCollected`) | OK |
| Telefono | ✅ | ✅ (`dataCollected`) | OK |
| Messaggio testo libero | ✅ | ✅ (`dataCollected`) | **⚖️ Manca warning su dati sanitari** (art. 9) → **F-46** |
| IP sorgente form | ✅ (rate limit + log Vercel) | ❌ (policy non dichiara raccolta IP dai visitatori) | **F-47** |
| User-Agent / log Vercel | ✅ (implicito) | ❌ | **F-47** |
| Base giuridica `messaggio` | — | ✅ ma dichiara art. 6(1)(a) + 6(1)(b) generica | **⚖️ F-46** — se il messaggio può contenere dati sanitari, serve base art. 9 (consenso esplicito) |
| Vercel Analytics | ✅ | ✅ (`analytics`) ma "nessun consenso necessario" | **F-17** + **F-48** (consenso mancante + dichiarazione errata sul consenso) |
| Vercel Speed Insights | ✅ | ⚠️ menzionato sotto Analytics | Parziale (ok) |
| Resend come processor | ✅ | ❌ **Resend NON è elencato** in `thirdParty` della policy | **F-49** |
| Google Maps iframe | ✅ | ❌ (`thirdParty` non menziona Google) | **F-50** + **F-18** già aperto |
| Google Fonts | Dichiarato CSP ma non usato | ❌ | **F-19** (solo code fix, no policy gap) |
| Sanity CDN | ✅ | ✅ (menzionata) | OK |
| Cookie / localStorage | ✅ (solo tema + locale) | ✅ (`cookies`) | OK (dichiarazione coerente) |
| Retention Resend (email) | ✅ (30gg default) | ❌ "tempo strettamente necessario" — troppo vago | **F-51** |
| Retention log Vercel | ✅ | ❌ non dichiarata | **F-51** |
| Retention rate-limit IP map | ✅ (volatile 15min) | ❌ non dichiarata | **F-51** |
| Diritti dell'interessato | — | ✅ (`rights`) | OK |
| Titolare + contatto privacy | — | ✅ (`controller`) | OK (nessun DPO esplicito; per psicologa non obbligatorio se no-larga-scala) |
| DPIA per trattamento art. 9 | — | ❌ | **⚖️ F-52** |
| DPA firmati con processor | — | ❌ (non è pubblico, ma va conservato dal titolare) | **F-53** (check operativo, non codice) |

---

#### F-46 — Modulo contatti può raccogliere dati sanitari (art. 9 GDPR) senza base giuridica adeguata né warning

- **Severity**: Critical (amplifier massimo: dati sensibili + psicologa)
- **Category**: GDPR / Art. 9
- **Evidence**: `app/api/contact/route.ts:91` (`sanitizedMessage = body.message.slice(0, 5000)`), `components/sections/contact-form.tsx` (textarea libera), `messages/it.json` sezione `legalBasis` (dichiara solo art. 6).
- **Impact**: ⚖️ Un visitatore che contatta una psicologa per un consulto può — e tipicamente *vuole* — descrivere il proprio problema: ansia, depressione, traumi, diagnosi pregresse. Questi sono dati particolari ex art. 9 GDPR. Il trattamento di dati particolari richiede:
  1. Una **base giuridica speciale** ex art. 9(2) (tipicamente lettera (a) consenso esplicito, o (h) medicina/sanità).
  2. **Misure di sicurezza rafforzate**.
  3. Potenzialmente **DPIA** (art. 35) se large-scale.
  
  La policy attuale dichiara solo art. 6(1)(a)/(b)/(f), che **non sono sufficienti** per art. 9. Inoltre non c'è warning nel form che avverta l'utente di non inserire dati sanitari, né un checkbox di consenso esplicito.
  
  Impact:
  - **Regolatorio**: esposizione a sanzione Garante in caso di ispezione/segnalazione.
  - **Legale**: responsabilità civile del titolare in caso di data breach.
  - **Tecnico**: il canale email (Resend → Gmail/outlook di Ida) non è uno standard appropriato per dati clinici.
- **Exploitation**: non è un exploit tecnico; è una non-conformità che si attiva ad ogni submission reale.
- **Remediation** (da concordare con avvocato ⚖️):
  1. **Opzione A — Escludere dati sanitari dal canale**: aggiungere nel form un disclaimer visibile prima del submit: *"Non inserire in questo modulo informazioni relative alla tua salute mentale o fisica, diagnosi, terapie in corso. Per un primo contatto clinico usa il telefono o WhatsApp."* Dichiarare in privacy policy che il canale è solo per richieste organizzative (appuntamenti, info generali).
  2. **Opzione B — Trattare come dati particolari**: aggiungere checkbox consenso esplicito art. 9(2)(a), DPIA, processor DPA verificati, cifratura end-to-end (Resend non è E2E), retention ridotta, diritto di oblio automatico. Complesso e costoso.
  3. **Consenso esplicito** (checkbox obbligatoria `required`) con testo: *"Acconsento al trattamento dei dati personali, inclusi eventuali dati particolari, ai sensi dell'art. 9(2)(a) GDPR, per la finalità di gestione della mia richiesta di consulto psicologico."*
  
  Raccomandazione di questo audit: **A + consenso checkbox**, cioè disclaimer + checkbox minimo, come compromise pragmatico.
- **Effort**: M (testo legale + UI) — **bloccato da parere legale**

---

#### F-47 — IP e user-agent raccolti (rate limit + log Vercel) non dichiarati in privacy policy

- **Severity**: Medium
- **Category**: GDPR / Trasparenza
- **Evidence**: `app/api/contact/route.ts:41` (`x-forwarded-for` → rate limit), log Vercel edge di default. Privacy policy `dataCollected` elenca solo nome/email/phone/message.
- **Impact**: L'indirizzo IP è dato personale per giurisprudenza consolidata (CJEU Breyer). Usare l'IP per rate limit è legittimo (art. 6(1)(f) legittimo interesse prevenzione abusi), ma **va dichiarato** in informativa. Stesso discorso per log Vercel che conservano IP+UA+path+timing.
- **Exploitation**: non-exploit — non-conformità di trasparenza.
- **Remediation**: aggiungere alla privacy policy (nella sezione `dataCollected` o una nuova `logs`):
  > "Per motivi di sicurezza e prevenzione abusi del modulo di contatto, raccogliamo temporaneamente l'indirizzo IP del visitatore (base giuridica: legittimo interesse del titolare, art. 6(1)(f) GDPR). Tale dato è conservato in memoria volatile per un massimo di 15 minuti e non viene persistito. Inoltre, l'infrastruttura di hosting Vercel registra log tecnici (IP, user-agent, path richiesto, timestamp) con retention di X giorni, ai fini di sicurezza e debug."
- **Effort**: S (modifica testo policy)

---

#### F-48 — Privacy policy dichiara "Vercel Analytics non necessita consenso" — affermazione opinabile

- **Severity**: Medium (amplifier GDPR)
- **Category**: GDPR / Consenso
- **Evidence**: `messages/it.json` → `privacy.analytics.text` e `privacy.cookies.text`:
  > "Vercel Analytics non utilizza cookie, non raccoglie dati personali identificabili [...] Vercel Analytics è conforme al GDPR."
  > "Non essendo presenti cookie di profilazione, non è necessario un banner di consenso ai cookie."
- **Impact**: L'affermazione è parzialmente vera (Vercel Analytics non usa cookie) ma ⚖️ opinabile dal punto di vista legale:
  1. Anche senza cookie, Vercel Analytics **raccoglie IP e user-agent** per derivare country/device (pur senza persistenza cross-session). Il Garante italiano e EDPB hanno chiarito che analytics server-side che processano IP **possono** richiedere consenso o essere giustificati da legittimo interesse con proper balancing test.
  2. La sezione `cookies` salta a "quindi nessun banner cookie serve" — il banner TTDSG/ePrivacy si applica a qualsiasi tecnologia di tracking (non solo cookie). In IT/EU il *consenso* non è strettamente legato al cookie ma al trattamento.
  3. Cfr. F-17 già aperto: codice carica Analytics prima di consenso.
  
  Il pattern sicuro è: o disabilitare analytics, o mettere un banner minimo con toggle, o dichiarare **esplicitamente** la base di legittimo interesse con test di bilanciamento.
- **Exploitation**: rischio regolatorio.
- **Remediation**:
  1. Riformulare il testo policy per non affermare "non serve consenso" come fatto, ma dichiarare la base giuridica scelta (legittimo interesse + balancing test disponibile) oppure
  2. Implementare un consent gate (F-17) e condizionare il caricamento Analytics/Speed Insights. Questa è la strada più difensiva.
- **Effort**: S (testo) + M (consent gate, stessa fix di F-17)

---

#### F-49 — Resend NON dichiarato nella lista processor in privacy policy

- **Severity**: High (amplifier GDPR — processor sul canale più sensibile)
- **Category**: GDPR / Trasparenza
- **Evidence**: `messages/it.json` → `privacy.thirdParty.text` menziona solo Vercel e Sanity. Resend gestisce **tutte** le email del form contatti e **non è menzionato**.
- **Impact**: Omissione grave: Resend riceve nome/email/phone/messaggio di ogni persona che compila il form. È un processor nel senso GDPR (art. 28), e va:
  1. Dichiarato nell'informativa con nome, ruolo, paese, scopo.
  2. Coperto da DPA (data processing agreement) firmato. Resend ne offre uno standard.
  3. Informato il visitatore del trasferimento extra-EU se applicabile.
- **Exploitation**: non-conformità diretta, esposizione a sanzione.
- **Remediation**: aggiornare `messages/it.json` / `messages/en.json` sezione `thirdParty.text` includendo Resend:
  > "Questo sito si avvale dei seguenti servizi di terze parti: Vercel Inc. (vercel.com) per l'hosting del sito e l'analisi del traffico; Sanity AS (sanity.io) per la gestione e la distribuzione dei contenuti del blog; **Resend Inc. (resend.com) per l'invio delle email generate dal modulo di contatto**. Tutti i fornitori operano in conformità al GDPR e dispongono di adeguati accordi sul trattamento dei dati (DPA), disponibili su richiesta."
  
  In parallelo, scaricare e conservare il DPA Resend.
- **Effort**: S (testo) + manuale (download DPA)

---

#### F-50 — Google Maps iframe: Google non dichiarato come processor

- **Severity**: High (amplifier GDPR: trasferimento extra-EU → US)
- **Category**: GDPR / Processor / Trasferimenti extra-EU
- **Evidence**: `next.config.ts:43` (`frame-src https://www.google.com`), `app/[locale]/contatti/page.tsx` (iframe Google Maps per sede). Privacy policy `thirdParty` non menziona Google.
- **Impact**: L'iframe Google Maps carica contenuto da `google.com` al render della pagina `/contatti`, **prima** di qualsiasi interazione utente. Questo comporta:
  1. Trasferimento di IP+UA+Referer del visitatore a Google LLC (US).
  2. Possibile set di cookie third-party `NID`, `DV`, `CONSENT` se il visitatore non li ha già.
  3. Google è processor de-facto ma è **non dichiarato**.
  4. Trasferimento extra-EU senza base giuridica (SCC, Data Privacy Framework) menzionata.
  Questa è una delle non-conformità più frequentemente sanzionate dal Garante (vedi sanzioni su Google Fonts in Germania).
  Cfr. F-18 già aperto sul code side.
- **Exploitation**: non-exploit — rischio regolatorio immediato.
- **Remediation** (due strade):
  1. **Rimuovere l'iframe** (preferito per semplicità): sostituire con una foto statica della mappa + link `<a href="https://maps.google.com/...">`. Nessun dato trasmesso a Google finché l'utente non clicca. Aggiornare CSP rimuovendo `frame-src https://www.google.com`.
  2. **Click-to-consent**: mostrare un placeholder con bottone "Carica mappa" che monta l'iframe solo dopo consenso esplicito. Aggiungere Google in privacy policy come processor con base giuridica consenso art. 6(1)(a) + trasferimento extra-EU ex DPF.
  
  Raccomandazione: **opzione 1**.
- **Effort**: S (opzione 1) / M (opzione 2)

---

#### F-51 — Retention periods troppo vaghi ("tempo strettamente necessario")

- **Severity**: Medium
- **Category**: GDPR / Principio di limitazione della conservazione (art. 5(1)(e))
- **Evidence**: `messages/it.json` → `privacy.retention.text`:
  > "I dati raccolti tramite il modulo di contatto vengono conservati per il tempo strettamente necessario a gestire la richiesta e successivamente cancellati. I dati anonimi di analytics non sono riconducibili a persone fisiche e vengono conservati secondo le policy di Vercel."
- **Impact**: "Tempo strettamente necessario" non è una retention policy: è un placeholder che non permette all'interessato di conoscere la durata. GDPR art. 13(2)(a) richiede il *periodo* o *i criteri*.
  
  In questo caso concreto:
  - Resend conserva default 30 giorni (F-42).
  - Casella email Ida conserva a discrezione (anni?).
  - Log Vercel conservano secondo il plan (da verificare).
  - Rate limit IP map: 15 minuti volatile.
- **Exploitation**: non-conformità trasparenza.
- **Remediation**: sostituire con valori concreti:
  > "Retention:
  > - I messaggi inviati tramite il modulo di contatto vengono conservati nella casella email del titolare per un massimo di 24 mesi, dopo i quali vengono cancellati salvo necessità di gestione di rapporto consolidato.
  > - Il provider di email transazionale (Resend) conserva log delle email inviate per 30 giorni.
  > - Gli indirizzi IP usati per prevenzione abusi del modulo sono conservati in memoria volatile per 15 minuti.
  > - I log tecnici dell'infrastruttura Vercel hanno retention di 1 giorno (piano attuale).
  > - I dati aggregati di Vercel Analytics sono conservati secondo policy Vercel (90 giorni)."
  
  (Adattare ai valori reali, dopo verifica nei dashboard.)
- **Effort**: S

---

#### F-52 — ⚖️ DPIA per trattamento dati sanitari non risulta effettuata

- **Severity**: High ⚖️ (dipende dal parere legale)
- **Category**: GDPR / DPIA art. 35
- **Evidence**: nessun riferimento a DPIA nel repo o nella policy.
- **Impact**: Il GDPR art. 35 impone DPIA quando il trattamento presenta "rischio elevato per i diritti e le libertà delle persone fisiche", e fornisce nell'Annex alcuni trigger: *(b) trattamento su larga scala di categorie particolari di dati ex art. 9*, *(c) monitoraggio sistematico di area pubblica*. La lista Garante italiana (2018) include esplicitamente "trattamenti effettuati da professionisti sanitari". Per uno studio individuale di psicologa la "larga scala" è discutibile (poche decine di pazienti/mese?), ma la natura dei dati impone comunque valutazione del rischio.
- **Exploitation**: rischio regolatorio.
- **Remediation**: ⚖️ **consultare DPO o avvocato** per:
  1. Valutare se DPIA è obbligatoria.
  2. Se sì, condurla (checklist WP29, analisi rischi, misure mitiganti).
  3. Documentarla e tenerla a disposizione del Garante.
  
  Se F-46 viene risolto con opzione A (escludere dati sanitari dal form), il DPIA può concentrarsi solo sul trattamento post-contatto e non sul form stesso.
- **Effort**: M ⚖️

---

#### F-53 — DPA con i processor non risulta conservato dal titolare

- **Severity**: Medium
- **Category**: GDPR / Art. 28 (rapporti con processor)
- **Evidence**: nessun riferimento nel repo (ragionevole: non è codice) — è un controllo operativo del titolare.
- **Impact**: Art. 28 richiede contratto scritto tra titolare e processor. Vercel/Sanity/Resend offrono DPA standard scaricabili dai rispettivi dashboard. Il titolare deve **scaricarli e conservarli** (o accettarli tramite click-through). Se il Garante chiede evidenza, serve produrre il contratto.
- **Exploitation**: n/a.
- **Remediation**: checklist operativa per Ida:
  - Vercel: Account Settings → Legal → Data Processing Addendum → download PDF.
  - Sanity: manage.sanity.io → Organization → Security → DPA.
  - Resend: Dashboard → Settings → Legal → DPA (o richiedere via support).
  - Conservare i 3 PDF in luogo tracciabile (Google Drive, file offline).
- **Effort**: S (manuale)

---

### 5.4 Raccomandazioni azionabili (ordinate per urgenza)

1. **⚖️ F-46**: concordare con avvocato approccio al trattamento dati sanitari → form disclaimer + checkbox consenso. **Blocking**.
2. **F-49**: aggiungere Resend alla lista processor in privacy policy. **Quick win**.
3. **F-50**: rimuovere Google Maps iframe o mettere dietro click-to-consent. **Quick win**.
4. **F-47**: dichiarare raccolta IP per rate limit e log Vercel.
5. **F-51**: sostituire retention vaghe con valori concreti.
6. **F-48**: riformulare sezione analytics + implementare consent gate (stesso fix di F-17).
7. **⚖️ F-52**: valutazione DPIA.
8. **F-53**: scaricare e conservare DPA Vercel/Sanity/Resend.

### 5.5 Punti che richiedono obbligatoriamente un parere legale ⚖️

- F-46 (base giuridica art. 9 per form contatti di una psicologa)
- F-48 (balancing test legittimo interesse analytics)
- F-52 (DPIA sì/no + condotta)
- Eventuale designazione DPO (art. 37) — non obbligatoria per studio individuale ma prudente
- Testo finale della privacy policy post-fix
- Testo consensi espliciti nel form

---

## 6. Dependency audit (output sintetico)

**Totale vulnerabilità `npm audit`**: 12 (5 high, 7 moderate, 0 critical)

### 6.1 Dipendenze dirette — stato

| Pacchetto | Installato | Latest | Gap | Note sicurezza |
|-----------|-----------|--------|-----|----------------|
| `next` | 16.1.6 | 16.2.3 | patch | **5 advisory aperte** → F-31 |
| `react` | 19.2.4 | 19.2.5 | patch | nessun CVE |
| `react-dom` | 19.2.4 | 19.2.5 | patch | nessun CVE |
| `sanity` | 5.18.0 | 5.20.0 | minor | transitivi js-yaml/lodash → F-32 |
| `@sanity/vision` | 5.18.0 | 5.20.0 | minor | stesso tree di sanity |
| `@sanity/image-url` | 2.1.0 | 2.1.1 | patch | nessun CVE |
| `next-sanity` | 12.2.1 | 12.2.2 | patch | nessun CVE diretto |
| `next-intl` | 4.8.3 | 4.9.0 | minor | nessun CVE |
| `resend` | 6.9.2 | 6.10.0 | patch | nessun CVE |
| `@react-email/components` | 1.0.8 | 1.0.12 | patch | nessun CVE |
| `@vercel/analytics` | 1.6.1 | 2.0.1 | major | F-35 (privacy improvements in 2.x) |
| `@vercel/speed-insights` | 1.3.1 | 2.0.0 | major | F-35 |
| `framer-motion` | 12.34.3 | 12.34.3 | — | nessun CVE |
| `lucide-react` | 0.475.0 | 1.8.0 | major | nessun CVE, 1.x è rinomina |
| `tailwindcss` | 4.2.1 | 4.2.2 | patch | nessun CVE |
| `@tailwindcss/postcss` | 4.2.1 | 4.2.2 | patch | nessun CVE |
| `styled-components` | 6.3.12 | 6.4.0 | minor | **non usata** → F-33 (rimuovere) |
| `@portabletext/react` | ^6.0.3 | — | — | nessun CVE |
| `@sanity/webhook` | — | — | — | usato in `/api/revalidate` |
| `clsx` | — | — | — | nessun CVE |
| `typescript` (dev) | 5.9.3 | 6.0.2 | major | dev-only |
| `eslint` (dev) | 9.39.3 | 10.2.0 | major | dev-only |

### 6.2 CVE transitive (tooling dev, non-runtime)

| Pacchetto | Severity | CVE | Catena | Runtime? |
|-----------|----------|-----|--------|----------|
| `picomatch` | high | GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj | via `@parcel/watcher`, `tinyglobby` | no (dev watcher) |
| `vite` | high | GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583 | via `@sanity/vision` | no (Studio dev) |
| `flatted` | high | GHSA-25h7-pfq9-p65f, GHSA-rf6f-7fwh-wjgh | via ESLint cache | no (dev lint) |
| `lodash` | high | GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh | via `sanity` tree | no (Studio build) |
| `lodash-es` | high | stesse di lodash | via `sanity` tree | no |
| `js-yaml` | moderate | GHSA-mh29-5h37-fv8m | via `@vercel/frameworks` → `@sanity/cli` | no (CLI) |
| `brace-expansion` | moderate | GHSA-f886-m6hf-6m8v | via `@typescript-eslint` | no (dev) |

Riassunto: **nessuna CVE in dipendenza che gira a runtime in produzione** tranne Next.js (F-31). Tutto il resto è tooling dev/build. `npm audit fix` (senza `--force`) risolve la maggior parte senza impatto; il resto richiede i bump tracciati nei finding F-31, F-32.

---

## 7. External configuration recommendations

Raccolta consolidata delle raccomandazioni che **non sono fix di codice** ma richiedono azioni su servizi esterni (DNS, Vercel, Sanity, Resend, monitoring). Ogni punto ha un cross-reference al finding che lo motiva.

### 7.1 DNS (registrar del dominio)

- [ ] **SPF record** per dominio mittente email (F-02). `v=spf1 include:_spf.resend.com -all` (o `~all` se si è ancora in fase di verifica).
- [ ] **DKIM record** (2 CNAME forniti dal dashboard Resend dopo "Add Domain") (F-02).
- [ ] **DMARC record** (F-02). Iniziare con `v=DMARC1; p=quarantine; rua=mailto:dmarc@<dominio>` e alzare a `p=reject` dopo aver verificato che non ci siano falsi positivi.
- [ ] **HSTS preload** (F-27): submit del dominio a https://hstspreload.org/.

### 7.2 Vercel dashboard

- [ ] **Vercel Firewall / Rate Limit Rules** (F-01): regola edge su `/api/contact` max 5 req/15min per IP. Piano Pro.
- [ ] **Password Protection** o **Vercel Authentication** su route `/studio/*` (F-12, F-13). Semplice toggle in Project Settings → Deployment Protection.
- [ ] **Log Drains** verso Axiom/Better Stack (F-44) per alerting e retention log.
- [ ] **Branch protection**: limitare deploy a branch `main`, no deploy su PR da fork untrusted.
- [ ] **Env secrets backup**: esportare settings env → file cifrato offline (1Password/Bitwarden). Se l'account Vercel viene perso, gli env non sono recuperabili.
- [ ] **Verificare HSTS default** (F-27): `curl -I https://<dominio>` e controllare che `strict-transport-security` sia presente con `max-age` ≥ 31536000.

### 7.3 Sanity dashboard (manage.sanity.io)

- [ ] **Dataset visibility** → private vs public (F-15). Decidere in base al threat model: se privato, aggiungere `SANITY_READ_TOKEN` server-only al client (F-21).
- [ ] **CORS origins** (F-13 related): limitare a `https://<dominio-ida>` e `http://localhost:3000` — NO wildcard.
- [ ] **2FA obbligatoria** per tutti i membri del progetto.
- [ ] **Member access**: rimuovere accessi orfani, limitare ruolo `administrator` al minimo.
- [ ] **Backup dataset schedulato** (F-43).
- [ ] **Webhook signature secret** forte (F-08) e **rotazione periodica** (es. annuale).

### 7.4 Resend dashboard

- [ ] **Dominio verificato** con SPF/DKIM/DMARC (F-02).
- [ ] **Disable click & open tracking** (F-41).
- [ ] **Log retention** configurata al minimo necessario (F-42).
- [ ] **2FA** sull'account.
- [ ] **API key scoping**: creare una API key dedicata al sito, solo permessi "send", rotazione annuale.
- [ ] **Alerting** su bounce rate / complaint rate anomali (feature Resend Pro).

### 7.5 Privacy policy e legal (dal Task 11)

- [ ] Aggiornamenti privacy policy per processor dichiarati, retention, base giuridica form contatti → vedi §5 (GDPR gap).
- [ ] **Consenso analytics** UI (cookie/consent banner condizionale) → F-17.
- [ ] **Disclaimer form contatti**: aggiungere testo esplicito "non inserire dati sanitari sensibili in questo form, usa il telefono/WhatsApp per comunicazioni cliniche".
- [ ] **DPA firmati** con Resend, Sanity, Vercel: scaricare dai rispettivi dashboard e conservare come titolare.

### 7.6 Monitoring / alerting (F-44)

- [ ] **Uptime monitor** (UptimeRobot/Better Stack free): sonde `/it`, `/en`, `/api/contact` (GET → 405 atteso ma sentinel vivo).
- [ ] **Error rate dashboard** (Axiom free o Vercel Analytics Pro).
- [ ] **Synthetic check** del flusso form contatti: 1x/settimana script che invia un form con `body.website != ""` (honeypot) e verifica che il 200 silenzioso arrivi (e che NO email venga inviata).
- [ ] **Alert Slack/email** su spike 5xx o burst request `/api/contact`.
- [ ] **Status page** pubblica (opzionale, BetterStack free include 1 status page).

---

## 8. Remediation roadmap

**Metodo di prioritizzazione**: `score = severity × 1/effort` dove
- Severity: Critical = 4, High = 3, Medium = 2, Low = 1
- Effort: S = 1, M = 2, L = 3

A parità di score, la priorità viene data ai finding che toccano il form contatti (amplifier threat model).

**Nota** ⚖️: i finding marcati richiedono parere legale prima di poter essere implementati tecnicamente.

### 8.1 Tabella prioritizzata

| # | Finding | Titolo breve | Sev | Eff | Score | Note |
|---|---------|--------------|-----|-----|-------|------|
| 1 | F-46 ⚖️ | Form contatti + dati sanitari art. 9 | Critical | M | 2.0 | Blocca su avvocato |
| 2 | F-49 | Resend non in lista processor | High | S | 3.0 | Quick win |
| 3 | F-50 | Google Maps iframe non dichiarato | High | S | 3.0 | Quick win (opzione A) |
| 4 | F-01 | Rate limit in-memory bypassabile | High | S | 3.0 | Vercel Firewall |
| 5 | F-31 | Next.js 16.1.6 → 16.2.3 (5 advisory) | High | S | 3.0 | `npm i next@16.2.3` |
| 6 | F-23 | CSP `'unsafe-inline'` | High | M | 1.5 | Nonce CSP |
| 7 | F-17 | Analytics senza consenso | High | M | 1.5 | Consent gate |
| 8 | F-02 | Mittente `onboarding@resend.dev` | High | M | 1.5 | DNS + dashboard |
| 9 | F-52 ⚖️ | DPIA art. 35 | High | M | 1.5 | Legale |
| 10 | F-47 | IP non dichiarato in privacy | Medium | S | 2.0 | Testo policy |
| 11 | F-48 | Analytics "no consent" dichiarato | Medium | S | 2.0 | Testo policy |
| 12 | F-51 | Retention vaghe | Medium | S | 2.0 | Testo policy |
| 13 | F-53 | DPA non conservati | Medium | S | 2.0 | Manuale dashboard |
| 14 | F-24 | CSP manca `base-uri`/`form-action`/`object-src`/`upgrade-insecure-requests` | Medium | S | 2.0 | `next.config.ts` |
| 15 | F-27 | HSTS non esplicito | Medium | S | 2.0 | `next.config.ts` |
| 16 | F-36 | `robots.ts` permissivo | Medium | S | 2.0 | Disallow /studio,/api |
| 17 | F-03 | Subject email no strip ctl chars | Medium | S | 2.0 | Sanitize helper |
| 18 | F-04 | `console.error("Resend error:", error)` PII leak | Medium | S | 2.0 | Strip error object |
| 19 | F-32 | `sanity` 5.18 → 5.20 | Medium | M | 1.0 | Bump + test Studio |
| 20 | F-10 | Replay protection webhook revalidate | Medium | M | 1.0 | Nonce/timestamp check |
| 21 | F-11 | `_type` non whitelistato webhook | Medium | M | 1.0 | Whitelist switch |
| 22 | F-13 | Headers `/studio/*` incompleti | Medium | M | 1.0 | `next.config.ts` |
| 23 | F-14 | Vision tool abilitato | Medium | M | 1.0 | `sanity.config.ts` |
| 24 | F-20 | `dangerouslySetInnerHTML` in head | Medium | M | 1.0 | Parte di F-23 |
| 25 | F-42 | Retention Resend non documentata | Medium | S | 2.0 | Dashboard + doc |
| 26 | F-43 | No backup Sanity dataset | Medium | M | 1.0 | Script/CI |
| 27 | F-44 | No monitoring / alerting | Medium | M | 1.0 | UptimeRobot + Axiom |
| 28 | F-18 | Google Maps iframe (code side) | Medium | S | 2.0 | Coperto da F-50 |
| 29 | F-33 | `styled-components` dead dep | Low | S | 1.0 | `npm uninstall` |
| 30 | F-34 | CVE dev-time (picomatch/vite/flatted) | Low | S | 1.0 | `npm audit fix` |
| 31 | F-35 | `@vercel/analytics` v1 → v2 | Low | S | 1.0 | Bump |
| 32 | F-29 | `.env.example` incompleto | Low | S | 1.0 | Edit file |
| 33 | F-30 | `env.ts` schema validation | Low | S | 1.0 | Nuovo file |
| 34 | F-25 | CSP `data:`/`blob:` | Low | S | 1.0 | Verifica + rimuovi |
| 35 | F-26 | `Permissions-Policy` parziale | Low | S | 1.0 | Espandi lista |
| 36 | F-28 | COOP/CORP non dichiarati | Low | S | 1.0 | `next.config.ts` |
| 37 | F-19 | CSP `fonts.googleapis.com` inutile | Low | S | 1.0 | Rimuovi da CSP |
| 38 | F-22 | PortableText link schema | Low | S | 1.0 | Whitelist regex |
| 39 | F-05 | Rate limit Map mai pulita | Low | S | 1.0 | Cleanup cronjob |
| 40 | F-06 | Timestamp client-side anti-bot | Low | S | 1.0 | Server-side token |
| 41 | F-07 | Pattern phone mancante | Low | S | 1.0 | Regex |
| 42 | F-08 | No CAPTCHA | Low | M | 0.5 | Turnstile/hCaptcha |
| 43 | F-09 | No timeout Resend | Low | S | 1.0 | `AbortSignal.timeout(5000)` |
| 44 | F-12 | `revalidatePath` slug path normalization | Low | S | 1.0 | Sanitize slug |
| 45 | F-16 | Studio discovery via bundle | Low | — | — | Solo doc |
| 46 | F-37 | Sitemap alternates gap | Low | S | 1.0 | SEO, fuori scope |
| 47 | F-38 | Sitemap fetch senza filtro lingua | Low | S | 1.0 | Filter GROQ |
| 48 | F-39 | `/api/revalidate` no logs | Low | S | 1.0 | Structured log |
| 49 | F-40 | Middleware matcher — solo doc | Low | S | 1.0 | Commento |
| 50 | F-41 | Resend link tracking | Low | S | 1.0 | Disable dashboard |
| 51 | F-15 | Dataset Sanity public? (verify) | (cond) | S | — | Check Sanity dashboard |
| 52 | F-21 | `useCdn: true` + no token (dep. F-15) | (cond) | S | — | Dipende da F-15 |

### 8.2 Bucket di esecuzione

**Do now (Critical + High)** — 9 finding, azione entro il prossimo sprint di sicurezza:
- F-46 ⚖️ (bloccante legale)
- F-49, F-50, F-01, F-31, F-02, F-23, F-17, F-52 ⚖️

**Do soon (Medium)** — 18-19 finding, ciclo successivo:
- F-47, F-48, F-51, F-53, F-24, F-27, F-36, F-03, F-04, F-42, F-32, F-10, F-11, F-13, F-14, F-20, F-43, F-44, F-18

**Hardening backlog (Low)** — 23 finding, da affrontare in batch quando c'è capacità:
- Tutti i rimanenti (F-05 ... F-41).

**Verify-first** — 2 finding condizionali:
- F-15 / F-21: verificare in Sanity dashboard se il dataset è pubblico o privato. Se pubblico, entrambi escalano a High e vanno messi in "Do now". Se privato, chiudere entrambi senza azione code-side (già funzionanti) ma aggiungere `SANITY_READ_TOKEN` server-side.

---

### 8.3 Nota per il triage con l'utente

Questa roadmap è l'input per il prossimo piano di fix (`superpowers:writing-plans`). Alcune voci **richiedono decisioni dell'utente prima** di poter essere inserite nel plan di implementazione:

1. **Scelte di config esterna** (non code-side):
   - F-01 → Vercel plan: il Firewall rate limit richiede Pro? Se sì, confermare che l'utente l'ha. Altrimenti Upstash/KV.
   - F-02 → dominio di Ida da verificare in Resend: serve accesso DNS del dominio.
   - F-12, F-13, F-36 → `/studio` dietro Vercel Password Protection o restare aperto?
   - F-15 → dataset Sanity pubblico/privato (decisione business).
2. **Decisioni legali** ⚖️:
   - F-46 → approccio dati sanitari: disclaimer + no-consent, oppure consent form + DPIA?
   - F-48, F-52 → scelta base giuridica analytics + necessità DPIA.
   - Testo finale privacy policy e consensi → redatto da legale.
3. **Trade-off di effort vs scope**:
   - F-23 nonce-based CSP è un refactor non banale: vale il costo, o accettare il trade-off documentato?
   - F-43 backup Sanity: CI automation o script manuale mensile?
   - F-50 Google Maps: rimuovere (opzione A, quick) o click-to-consent (opzione B, più UX)?

Il prossimo passo operativo è una sessione di triage con l'utente su queste scelte, al termine della quale si può invocare `superpowers:writing-plans` per produrre il plan implementativo delle fix approvate.
