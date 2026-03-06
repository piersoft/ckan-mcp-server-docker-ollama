# Idee per data-gov-il-mcp

Documento per descrivere possibili miglioramenti, il loro valore per gli utenti e l’onere stimato di implementazione a partire dallo stato attuale del repo.

## Contesto attuale (punto di partenza)
- Server MCP in Node (ESM) con tool CKAN di base: ricerca dataset, info dataset, lista risorse, search records, organizzazioni, tag curati statici.
- Nessun test automatico.
- Alcune incongruenze di versioning e dipendenze (es. versione diversa in stdio/http; `cors` usato ma non presente in `package.json`).
- Tags hard-coded (`src/config/tags.js`) con aggiornamento manuale.

Le stime sotto sono **relative** al codice attuale. Uso una scala:
- **Basso**: 0.5–1 giorno, poche modifiche isolate.
- **Medio**: 2–4 giorni, nuove funzioni + aggiornamenti tool + documentazione.
- **Alto**: >1 settimana, richiede refactor, nuovo modulo o test.

---

## 1) Tag dinamiche (da CKAN)
**Cosa**: sostituire/affiancare le tag curate staticamente con tag reali da `tag_list` + conteggi via facet in `package_search`.

**Utilità**: gli utenti vedono **tag reali e aggiornati** del portale; meno mismatch fra tag suggerite e tag effettivi.

**Onere**: **Medio**. Serve:
- nuovo tool o upgrade di `list_available_tags`,
- chiamate CKAN con faceting,
- caching (per evitare richieste costose).

**Esempio d’uso**
```
list_available_tags(format="overview")
```
**Cosa introduce per gli utenti**: una lista sempre attuale delle tag più usate, con conteggi, utile per esplorazione rapida.

---

## 2) Filtri avanzati in find_datasets
**Cosa**: estendere `find_datasets` con filtri `organization`, `groups`, `license`, intervallo `modified` (date range).

**Utilità**: ricerca più precisa senza dover combinare query manuali.

**Onere**: **Basso–Medio**. Serve:
- estendere schema input,
- costruire `fq` in `package_search`,
- aggiornare messaggi guida.

**Esempio d’uso**
```
find_datasets(query="rifiuti", organization="ministry-of-environment", modified_from="2024-01-01")
```
**Cosa introduce per gli utenti**: risultati meno rumorosi e più rilevanti.

---

## 3) Schema delle risorse (fields + tipi)
**Cosa**: tool `get_resource_schema` che usa `datastore_search` (limit=0) o `datastore_info` per mostrare colonne e tipi.

**Utilità**: gli utenti capiscono **come filtrare** senza provare “a tentativi”.

**Onere**: **Medio**. Serve:
- endpoint aggiuntivo in `utils/api.js`,
- formattazione risposta,
- gestione errore se datastore non attivo.

**Esempio d’uso**
```
get_resource_schema(resource_id="2202bada-4baf-45f5-aa61-8c5bad9646d3")
```
**Cosa introduce per gli utenti**: consapevolezza dei campi disponibili e dei tipi (string/number/date).

---

## 4) Sample/preview dati (righe campione)
**Cosa**: tool `sample_records` con `limit` piccolo + `fields` selezionabili.

**Utilità**: anteprima rapida del dataset senza scaricare tutto.

**Onere**: **Basso**. Molto simile a `search_records` ma con default più “leggeri”.

**Esempio d’uso**
```
sample_records(resource_id="...", limit=5, fields=["City","Name"])
```
**Cosa introduce per gli utenti**: insight immediato sulla struttura dei dati.

---

## 5) Quality score / indicatori qualità
**Cosa**: calcolo di un punteggio qualitativo (es. licenza presente, data aggiornamento recente, risorse con datastore attivo).

**Utilità**: aiuta a scegliere dataset “buoni” senza analisi manuale.

**Onere**: **Medio**. Serve:
- definire metrica semplice e trasparente,
- calcolo su `package_show`.

**Esempio d’uso**
```
get_dataset_quality(dataset="branches")
```
**Cosa introduce per gli utenti**: ranking qualitativo per decidere “vale la pena usarlo?”.

---

## 6) Dataset recenti / aggiornati
**Cosa**: tool `recent_datasets` con filtro sugli ultimi N giorni o range date.

**Utilità**: permette di monitorare aggiornamenti e dataset nuovi.

**Onere**: **Basso**. Usa `package_search` con `metadata_modified` e sort.

**Esempio d’uso**
```
recent_datasets(days=30, limit=20)
```
**Cosa introduce per gli utenti**: feed delle novità recenti.

---

## 7) Facet search (org/tag/group)
**Cosa**: tool che restituisce faccette (top organizzazioni, top tag, top group) per una query.

**Utilità**: facilita il raffinamento iterativo della ricerca.

**Onere**: **Medio**. Richiede `package_search` con `facet.field`.

**Esempio d’uso**
```
search_facets(query="trasporti")
```
**Cosa introduce per gli utenti**: suggerimenti concreti su come restringere la ricerca.

---

## 8) Lista dataset per organizzazione
**Cosa**: tool dedicato `list_datasets_by_org` (wrapper su `package_search` con `organization:slug`).

**Utilità**: utile per analisi di trasparenza e copertura dei dati per ente.

**Onere**: **Basso**.

**Esempio d’uso**
```
list_datasets_by_org(organization="ministry-of-health", limit=50)
```
**Cosa introduce per gli utenti**: overview immediata dei dataset per un ente.

---

## 9) Caching/TTL per chiamate pesanti
**Cosa**: cache in memoria per risposte costose (tag list, organization list, facets).

**Utilità**: migliora performance e riduce carico sul CKAN.

**Onere**: **Medio**. Serve un modulo cache semplice con TTL.

**Esempio d’uso**
```
list_organizations()
```
**Cosa introduce per gli utenti**: risposte più rapide e consistenti.

---

## 10) Retry/backoff e rate-limit
**Cosa**: gestione `429/5xx` con retry esponenziale + piccolo rate-limit per client.

**Utilità**: affidabilità e resilienza in caso di picchi o API instabile.

**Onere**: **Medio–Alto** (se include rate-limit per sessione HTTP).

**Esempio d’uso**
```
search_records(resource_id="...", q="תל אביב")
```
**Cosa introduce per gli utenti**: meno errori transienti.

---

## 11) Download helper / export
**Cosa**: tool `get_download_url` che seleziona il miglior formato disponibile (CSV/JSON/GeoJSON) e restituisce URL diretto.

**Utilità**: facilita il download senza dover ispezionare le risorse.

**Onere**: **Basso–Medio**. Richiede parsing risorse da `package_show`.

**Esempio d’uso**
```
get_download_url(dataset="branches", preferred_format="CSV")
```
**Cosa introduce per gli utenti**: accesso immediato ai file per analisi esterna.

---

## 12) Output bilingue / i18n
**Cosa**: opzione `language` (it/en/he) per uniformare le risposte testuali del server.

**Utilità**: migliore UX per utenti non ebraicofoni.

**Onere**: **Alto**. Richiede refactor dei formatter e testi statici.

**Esempio d’uso**
```
find_datasets(query="budget", language="en")
```
**Cosa introduce per gli utenti**: interazione più inclusiva, adatta a team internazionali.

---

## Note finali
- Le idee 1–8 sono “core” e relativamente allineate all’architettura esistente.
- Le idee 9–10 aumentano affidabilità e performance, utili se il server è usato da più utenti/agent.
- La 12 è la più costosa ma migliora moltissimo l’accessibilità.

## Roadmap (quick wins vs impatto)
**Quick wins (alto impatto, basso/medio costo):**
- (4) Sample/preview dati: migliora subito la UX con minimo sforzo.
- (6) Dataset recenti/aggiornati: utile per monitoraggio, semplice da implementare.
- (8) Lista dataset per organizzazione: alto valore per analisi di trasparenza.
- (2) Filtri avanzati in find_datasets: riduce rumore nelle ricerche.

**Impatto medio‑alto (costo medio):**
- (1) Tag dinamiche: grande valore ma richiede faceting/caching.
- (7) Facet search: aiuta a rifinire ricerche complesse.
- (3) Schema delle risorse: utile per query corrette e riduzione errori.
- (5) Quality score: aiuta a scegliere dataset affidabili.

**Affidabilità e scala (costo medio‑alto):**
- (9) Caching/TTL: performance e stabilità in uso intensivo.
- (10) Retry/backoff + rate‑limit: resilienza verso API instabili.

**Accessibilità (alto costo, impatto alto ma non immediato):**
- (12) Output bilingue / i18n: grande valore per pubblico internazionale, refactor diffuso.

## Sequenza suggerita
1) (4) Sample/preview → (6) Recent → (8) By org → (2) Filtri avanzati  
2) (1) Tag dinamiche → (7) Facet search → (3) Schema risorse  
3) (9) Caching → (10) Retry/limit  
4) (12) i18n

Se vuoi, posso prioritizzare in una roadmap (quick wins vs impatto) o trasformare queste idee in una proposta OpenSpec.
