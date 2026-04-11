# Registro dei trattamenti — GDPR art. 30

**Titolare del trattamento**: Ida Sato (psicologa)
**Contatto DPO / referente privacy**: _(da definire)_
**Ultima revisione**: 2026-04-11

Questa cartella contiene la documentazione GDPR che non vive nel codice: Data
Processing Agreements con i processor, registro dei trattamenti (questo file),
eventuali DPIA e corrispondenza rilevante con le autorità.

---

## 1. Attività di trattamento

### 1.1 Modulo di contatto (`/contatti`)

| Voce | Valore |
|---|---|
| **Finalità** | Rispondere alle richieste di informazioni/consulto ricevute tramite il form pubblico |
| **Base giuridica** | Art. 6(1)(b) GDPR — misure precontrattuali su richiesta dell'interessato + art. 6(1)(f) per prevenzione abusi (rate limit IP in memoria) |
| **Categorie di interessati** | Visitatori del sito che compilano il modulo |
| **Categorie di dati** | Nome, email, telefono (facoltativo), testo del messaggio |
| **⚠️ Dati art. 9 GDPR** | Non richiesti espressamente, ma il contesto (psicologa) può indurre gli utenti a condividere informazioni sulla salute. **Gap aperto — F-46 audit.** Da discutere con DPO/legale: aggiungere consenso esplicito art. 9(2)(a) o disclaimer "non inserire dati sanitari". |
| **Processor coinvolti** | Vercel (hosting API route), Resend (invio email) |
| **Retention** | Email nella casella del titolare: per il tempo necessario al rapporto professionale, poi cancellazione. Log Resend: ~15 giorni (osservato 2026-04-11). Rate-limit IP: ≤15 minuti in memoria volatile, mai persistito. |
| **Trasferimento extra-UE** | Sì — Resend e Vercel sono US. Coperto da Standard Contractual Clauses (SCC) + EU-U.S. Data Privacy Framework (DPF). |

### 1.2 Contenuti editoriali del blog

| Voce | Valore |
|---|---|
| **Finalità** | Pubblicazione articoli e risorse del blog |
| **Base giuridica** | Art. 6(1)(f) — legittimo interesse del titolare a comunicare l'attività professionale |
| **Categorie di interessati** | — (contenuto editoriale pubblico, no dati personali di terzi) |
| **Processor coinvolti** | Sanity (CMS + CDN cdn.sanity.io) |
| **Note** | Il dataset Sanity è `public` (ACL "Public"). Rivisto in audit F-15: contiene solo contenuti destinati alla pubblicazione (post, risorse scaricabili, testimonianze già anonimizzate dal titolare). Accettato come rischio documentato. |

### 1.3 Analisi aggregata del traffico

| Voce | Valore |
|---|---|
| **Finalità** | Misurare visite, pagine viste, performance tecnica (Web Vitals) |
| **Base giuridica** | Art. 6(1)(f) — legittimo interesse al miglioramento del servizio, con balancing test documentato nella privacy policy. Diritto di opposizione ex art. 21 implementato via pulsante "Gestisci tracking" (footer + cookie banner) che scrive un opt-out in localStorage. |
| **Categorie di interessati** | Visitatori del sito |
| **Categorie di dati** | IP (processato da Vercel in forma aggregata, non persistito associato a identità), user-agent, percorso, referrer, metriche Web Vitals |
| **Processor coinvolti** | Vercel Inc. (Vercel Analytics + Speed Insights, cookieless) |
| **Retention** | ~90 giorni lato Vercel (policy di piattaforma) |

### 1.4 Mappa di Google (facoltativa, pagina Contatti)

| Voce | Valore |
|---|---|
| **Finalità** | Mostrare ubicazione dello studio |
| **Base giuridica** | Art. 6(1)(a) — consenso esplicito dell'utente (click-to-load, F-18 audit) |
| **Processor coinvolti** | Google LLC (USA) |
| **Trasferimento extra-UE** | Sì, coperto da EU-U.S. DPF (Google è certificata) |
| **Note** | L'iframe non viene mai caricato finché l'utente non preme il pulsante "Carica mappa". Nessuna richiesta a Google avviene prima del consenso. |

---

## 2. Registro processor (DPA — art. 28 GDPR)

| Processor | Ruolo | Dati trattati | Base legale trasferimento | DPA archiviato | Note |
|---|---|---|---|---|---|
| **Vercel Inc.** (USA) | Hosting, CDN, Analytics, log HTTP | Content, log tecnici, metriche aggregate | SCC + EU-U.S. DPF (Vercel certified) | [`dpa-vercel-20260411.pdf`](./dpa-vercel-20260411.pdf) | ⚠️ **Gap noto**: il DPA Vercel §1 limita l'applicabilità ai piani "Enterprise and Pro". L'account in uso è Hobby. Le misure di sicurezza descritte in Schedule 2 (AES-256, TLS 1.2+, SOC 2 Type 2, AWS/Azure/GCP) si applicano all'intera piattaforma, e Vercel Privacy Notice è vincolante anche sui piani gratuiti. Da rivalutare se il sito passa a Pro o se si aggiunge un flusso transazionale. Eventuale escalation: scrivere a `privacy@vercel.com` per avere conferma scritta. |
| **Resend Inc.** (USA) | Invio email transazionali (form di contatto) | Nome, email, testo del messaggio | SCC (EU SCCs Module Two, Controller→Processor) + EU-U.S. DPF | [`dpa-resend-20260411.pdf`](./dpa-resend-20260411.pdf) | DPA self-serve pubblicamente accettato entrando nel servizio. Include SCC. Retention email ~15 giorni (verificato via console 2026-04-11, include html/body). |
| **Sanity.io** (Sanity AS — Norvegia, infra globale) | CMS + CDN contenuti blog | Contenuti editoriali (nessun dato personale di terzi), log tecnici CDN | SCC / adeguatezza UE-Norvegia (Sanity AS è norvegese, Norvegia è SEE → adeguata by default) | **⏳ Pending** — scaricare da https://www.sanity.io/legal/dpa o accettare via dashboard `sanity.io/manage → project → Settings → Legal`. | Sanity AS ha sede in Norvegia (SEE), ma l'infrastruttura CDN e alcuni subprocessor possono essere extra-UE → verificare nel DPA. |
| **Google LLC** (USA) | Visualizzazione facoltativa Google Maps embed | IP/referrer solo se l'utente acconsente al caricamento dell'iframe | EU-U.S. DPF (Google certified) + Google Maps Terms | Non applicabile come processor art. 28 — Google è *independent controller* per i dati raccolti dalle Google Maps API. Riferimento: https://policies.google.com/privacy | Il caricamento avviene solo previo consenso esplicito (art. 6(1)(a)) tramite click-to-load (audit F-18). |

### Sub-processor

Ciascun processor mantiene la propria lista di sub-processor:

- Vercel: https://security.vercel.com
- Resend: https://resend.com/legal/subprocessors
- Sanity: https://www.sanity.io/legal/subprocessors

---

## 3. Diritti degli interessati (art. 15-22 GDPR)

Procedura per gestire una richiesta dell'interessato:

1. **Ricezione**: email al titolare (indirizzo pubblicato in privacy policy).
2. **Verifica identità**: se la richiesta arriva da un indirizzo email diverso da quello del record, chiedere conferma.
3. **Esecuzione entro 30 giorni** (art. 12 GDPR), prorogabili di 2 mesi per richieste complesse:
   - **Accesso / portabilità**: estrarre l'email dalla casella + eventuale thread Resend (entro la retention di 15 giorni) e consegnarli in formato leggibile.
   - **Rettifica**: aggiornare eventuali dati nel rapporto email.
   - **Cancellazione**: cancellare l'email dalla casella del titolare. Per Resend: la retention automatica di 15 giorni fa decadere il log; se servisse prima, aprire ticket a support@resend.com chiedendo rimozione anticipata.
   - **Opposizione analytics**: già gestita automaticamente dall'opt-out via localStorage; non richiede intervento del titolare.
4. **Documentazione**: annotare in un file privato (fuori repo) le richieste ricevute e la data di evasione.

---

## 4. Violazione di dati (art. 33-34 GDPR)

In caso di sospetta violazione:

1. **Entro 72h** notifica al Garante via portale GPDP se c'è rischio per gli interessati.
2. Comunicazione agli interessati senza ritardo se il rischio è elevato.
3. I processor (Vercel §8.c del DPA, Resend §8.6) devono notificare al titolare "without undue delay" qualsiasi Security Incident che coinvolga dati del cliente.

**Canale principale**: monitorare la casella di posta del titolare per notifiche automatiche dai processor.

---

## 5. Gap aperti / azioni pendenti

- [ ] **F-42 / F-53** — Scaricare DPA Sanity (questa settimana).
- [ ] **F-46** — Decidere con DPO/legale come gestire l'eventuale condivisione di dati art. 9 GDPR (salute) tramite il form di contatto: consenso esplicito vs disclaimer.
- [ ] **F-48 (parte legale)** — Formalizzare il balancing test per Vercel Analytics (legittimo interesse) con un legale.
- [ ] **F-52** — Valutare con DPO se serve DPIA data la natura sanitaria del titolare.
- [ ] **DPA Vercel Hobby** — Se il sito passa a Pro o cresce di scope, rivedere l'applicabilità del DPA (vedi nota nella tabella §2).
- [ ] **Designare DPO** se richiesto dall'attività clinica (una psicologa individuale di norma non ha l'obbligo formale ex art. 37 GDPR, ma è opportuno avere un consulente privacy di riferimento).

---

## 6. Storico versioni

| Data | Modifica |
|---|---|
| 2026-04-11 | Prima stesura del registro. DPA Vercel e Resend archiviati. DPA Sanity ancora da scaricare. Riferimento audit: `docs/superpowers/specs/2026-04-10-security-audit-report.md`. |
