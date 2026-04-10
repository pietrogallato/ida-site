# Security Audit — Design del processo di review

**Data**: 2026-04-10
**Target**: Sito `ida-site` (Next.js 16.1.6, deploy Vercel, CMS Sanity, email via Resend)
**Stato**: Design approvato — in attesa di esecuzione della review

Questo documento definisce **come** verrà condotta la security audit del sito. Non contiene ancora i finding: quelli saranno il deliverable prodotto eseguendo la metodologia descritta qui.

---

## 1. Obiettivo

Produrre un inventario completo delle vulnerabilità e dei gap di sicurezza del sito, con evidenza, severità e remediation consigliata, in modo da:

1. Avere una fotografia oggettiva dello stato di sicurezza attuale.
2. Costruire sopra questa fotografia un piano di fix prioritizzato (deliverable finale: report + fix plan).
3. Verificare la coerenza tra ciò che il codice fa e ciò che la privacy policy dichiara, dato che il sito tratta dati potenzialmente sensibili (form contatti di una psicologa).

---

## 2. Scope

### In scope

**Code-level**
- API routes: `app/api/contact/route.ts`, `app/api/revalidate/route.ts`.
- Headers e CSP: `next.config.ts`.
- Validazione e sanitizzazione input nei form (`components/sections/contact-form.tsx` + server).
- Query Sanity (GROQ) in `lib/sanity.ts`.
- Componenti client che trattano dati utente.
- Studio route pubblica (`app/studio/[[...tool]]`, `sanity.config.ts`).
- Error handling, logging, gestione segreti via env.
- Metadata, structured data, OG, sitemap, robots — per verificare possibili leak di info.
- Client bundle: variabili `NEXT_PUBLIC_*`, dipendenze embeddate.

**Dipendenze**
- `npm audit` e analisi CVE.
- Versioni obsolete o pacchetti non mantenuti.
- Lockfile integrity.

**Configurazione runtime esterna al repo (raccomandazioni azionabili)**
- DNS: SPF/DKIM/DMARC per il mittente Resend.
- Vercel: firewall, rate limit edge, protection bypass token per preview, log retention.
- Sanity: gestione accessi al progetto, 2FA, CORS origins configurati da Sanity manage, backup/export dataset.
- Monitoring e alerting su endpoint pubblici.

**GDPR gap analysis**
- Enumerazione dei dati personali raccolti dal codice.
- Enumerazione dei processor realmente toccati (Resend, Sanity, Vercel, Google Fonts, Google Maps embed, ecc.).
- Confronto con la privacy policy dichiarata in `app/[locale]/privacy/`.
- Output: gap list con azione consigliata. Non è consulenza legale; dove serve un avvocato lo segnalo.

### Out of scope

- Pen test attivo su istanze live (nessun exploit eseguito).
- Audit dell'infrastruttura interna di Vercel/Sanity/Resend (ci si fida delle loro compliance pages).
- Revisione non-sicurezza (SEO, performance, accessibilità, contenuto editoriale).
- Redazione finale di testi legali (privacy policy, cookie banner, DPA) — solo gap analysis.

---

## 3. Threat model

Pesato dal più importante al meno importante:

1. **Protezione PII / dati particolari dal form contatti (GDPR-first)** — il form può raccogliere nome, email, telefono e testo libero che può contenere informazioni sullo stato di salute (art. 9 GDPR). È l'asset più rischioso del sito.
2. **Spam e bot di base, igiene generale** — scanner automatici, form spam, script kiddies. Rischio frequente ma impatto limitato.
3. **Attacker mirato** — takeover Sanity Studio, defacement, phishing verso i pazienti usando il dominio di Ida, supply chain. Probabilità bassa ma impatto alto.

**Amplificatore GDPR**: qualunque finding che tocchi dati del form contatti sale di un livello di severità rispetto al baseline, per riflettere il peso maggiore del threat model (1).

---

## 4. Metodologia — Approccio ibrido (attack surface + checklist backstop)

### Passata A — Attack surface driven

Per ogni entry point, threat modeling + deep dive:

1. **`POST /api/contact`**
   - Input validation (presenza, formato, lunghezza, tipi).
   - Content-Type enforcement.
   - Rate limiting: correttezza, bypass, comportamento su Vercel serverless (multiple lambda = memoria non condivisa).
   - Email header injection: name, subject, replyTo, phone.
   - Payload size limit e DoS.
   - Honeypot e timing check: efficacia reale.
   - PII in log / error messages.
   - Resend configuration: mittente verificato, DMARC alignment, contenuto HTML escapato.
   - Error leakage.

2. **`POST /api/revalidate`**
   - Signature verification (`@sanity/webhook`).
   - Env `SANITY_REVALIDATION_SECRET!` non-null assertion → behavior se mancante.
   - Payload parsing e path traversal via `payload.slug.current`.
   - Amplification: quante path revalidate una chiamata.
   - Replay protection.

3. **`/studio/*`**
   - Esposizione pubblica della UI.
   - Auth Sanity: dove avviene, quali azioni sono permesse senza login.
   - CSP separata e più permissiva per questa route.
   - Robots e indicizzazione.
   - CORS origins configurati in Sanity manage.

4. **Client bundle pubblico**
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`: valutazione esposizione (sono public by design, ma documentare).
   - Metadata, OG image, structured data: leak di info non volute.
   - Analytics, Google Maps frame: third-party data flows.

5. **Query Sanity (GROQ)**
   - Parametrizzazione vs interpolazione.
   - Overfetching di campi sensibili.
   - Uso `useCdn` e implicazioni.
   - Accesso a dataset da client vs server.

6. **Form client-side e rendering contenuti CMS**
   - Sanitizzazione output PortableText.
   - XSS via contenuto CMS.
   - `rel` e `target` su link esterni (reverse tabnabbing).

### Passata B — Checklist trasversale (backstop)

Categorie che non appartengono a un singolo entry point:

- Security headers completi: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP/COEP, X-Frame-Options/frame-ancestors, base-uri, form-action.
- Gestione segreti: env vars, non-null assertions, fallback sicuri, nessun segreto in client bundle.
- Supply chain: `npm audit`, lockfile integrity, versioni obsolete, pacchetti non mantenuti, dipendenze transitive rischiose.
- Logging & error handling: cosa finisce in `console.error`, Vercel log retention, stack trace in prod, PII nei log.
- Robots/sitemap: path sensibili esposti, Studio indicizzato, preview URL leak.
- Routing i18n: open redirect, locale injection, canonical.
- Resend delivery: mittente verificato, DMARC alignment, tracking privacy, retention email delivered.
- Backup & recovery: Sanity dataset export, disaster recovery.
- Monitoring: visibilità abuse su endpoint `/api/contact`.

### Passata C — GDPR gap analysis

1. **Enumerare i dati personali raccolti dal codice**: nome, email, telefono, testo messaggio, IP (dal rate limit), user agent, cookie/local storage, Vercel analytics data, Speed Insights data, log server.
2. **Enumerare i processor toccati**: Resend, Sanity, Vercel (hosting + analytics + speed insights), Google Fonts, Google Maps embed, eventuali altri.
3. **Leggere `app/[locale]/privacy/`** e produrre una tabella di gap: ogni dato e ogni processor → dichiarato in policy (sì/no/parziale) → azione consigliata.
4. **Segnalare dove serve un avvocato** (es. base giuridica, DPIA, trattamento art. 9, DPA firmati).

---

## 5. Scala di severità

Scala a 4 livelli con criteri espliciti:

- **Critical** — Sfruttamento immediato con impatto alto: data breach PII, RCE, takeover account/CMS, exfiltrazione massiva, violazione GDPR con obbligo di notifica. Va fixato subito.
- **High** — Exploit plausibile con impatto significativo: email header injection reale, CSP bypass sfruttabile, rate limit bypassabile a costo zero con PII che finisce in spam, segreti leak in bundle client. Fix in questo ciclo.
- **Medium** — Difesa in profondità mancante, exploit condizionato, o impatto limitato: headers mancanti, log con metadata sensibili, CVE medie senza vettore raggiungibile, privacy policy incompleta su punti minori. Fix consigliata se low-effort.
- **Low / Hardening** — Best practice, nessun exploit plausibile ma riduce rischio futuro: hardening CSP, monitoring, backup, documentazione. Nice-to-have.

**Regola GDPR**: finding che toccano i dati del form contatti salgono di un livello rispetto al baseline.

---

## 6. Struttura del report (deliverable dell'esecuzione)

Il report sarà prodotto come artefatto durante l'esecuzione di questa review, come file separato (non questo documento). Struttura:

```
# Security Audit Report — Ida Sato Site
## 1. Executive summary
  - Totale finding per severità
  - Top 3 rischi
  - Raccomandazione generale
## 2. Scope & threat model (recap sintetico)
## 3. Findings — Passata A (attack surface)
  3.1 /api/contact
  3.2 /api/revalidate
  3.3 /studio
  3.4 Client bundle
  3.5 Sanity queries
  3.6 Form e rendering CMS
## 4. Findings — Passata B (checklist trasversale)
## 5. Findings — Passata C (GDPR gap)
## 6. Dependency audit
## 7. External configuration recommendations
## 8. Remediation roadmap (finding ordinati per severity × 1/effort)
```

### Formato di ogni finding

```
### F-NN — Titolo sintetico
- Severity: Critical | High | Medium | Low
- Category: Input validation / Headers / GDPR / Supply chain / ...
- Evidence: path/file.ts:42-58 (+ snippet se utile)
- Impact: scenario concreto di cosa può succedere
- Exploitation: facilità, prerequisiti, chi può farlo
- Remediation: fix consigliata, con codice se è una modifica locale
- Effort: S / M / L
```

---

## 7. Deliverable e transizione a fix

**Step 1 — Esecuzione review**: seguendo la metodologia sopra, produco il report come file separato `docs/superpowers/specs/2026-04-10-security-audit-report.md`. Commit.

**Step 2 — Triage interattivo**: presento all'utente la *Remediation roadmap* (sezione 8 del report). Decidiamo insieme quali finding entrano nel piano di fix e in che ordine. Alcune fix richiederanno input umano (es. scegliere un servizio di rate limit distribuito, approvare testo della privacy policy, decidere se proteggere `/studio` con Vercel Password Protection).

**Step 3 — Implementation plan**: invoco `superpowers:writing-plans` per produrre il piano di implementazione delle fix approvate.

**Step 4 — Implementazione**: esecuzione del piano con `verification-before-completion` ad ogni step.

---

## 8. Assunzioni e limiti

- La review è statica: leggo codice, config e documentazione. Nessun exploit eseguito.
- Le raccomandazioni esterne (DNS, Vercel Firewall, Sanity access) non sono verificate — vengono formulate come "verifica/configura X".
- La GDPR gap analysis è tecnica, non legale. Il giudizio finale spetta a un DPO / avvocato.
- I finding riflettono lo stato del codice al commit corrente (`main` al 2026-04-10).
