# Data WA (CKAN) — Solr Query Language (Summary)

Source: “Search using Solr query language” (Data WA Help Centre)
- https://toolkit.data.wa.gov.au/hc/en-gb/articles/4413492209935-Search-using-Solr-query-language
- Updated: 13 January 2022 (per source page)

This is a **condensed summary** of the Data WA guidance on using Solr query language in CKAN’s advanced search. It is not a verbatim copy.

## How to enable Solr query language (Data WA UI)
- Go to **Data** → tick **Advanced search** → tick **Use query language to search**.

## Basics
- **Free text**: a single word searches across fields.
- **Multiple words**: whitespace splits into tokens; results with all tokens tend to rank higher.
- **Phrase search**: use double quotes for exact sequences, e.g. `"active schools"`.
- **Fielded search**: `title:marine` or multiple fields `title:marine notes:republished`.
- **Implicit AND** between fields in CKAN.

## Stemming
- Solr can reduce inflected terms to a stem (e.g., “fishing” → “fish”), improving recall without special syntax.

## Discovering field names
- Use CKAN API `package_show` on a dataset ID or name to inspect available fields in the JSON result.

## Case sensitivity and exact matches
- Many common text fields are **case-insensitive** (`title`, `notes`, `author`, `maintainer`, etc.).
- Some fields are **string-typed** and are **case-sensitive**; they require exact matches.

## Escaping special characters
- Special characters include: `+ - && || ! ( ) { } [ ] ^ " ~ * ? : /`.
- Escape with backslash, e.g. `\(1\+1\)\:2`.

## Boolean operators
- `AND` / `&&` (default operator in CKAN)
- `OR` / `||`
- `NOT` / `!`
- `+` required, `-` prohibited

Examples (paraphrased):
- `title:marine AND notes:"spatial cadastral database"`
- `title:parks OR title:water`
- `+title:water -title:islands`
- `(title:water OR title:parks) AND NOT title:islands AND num_resources:7`

## Term modifiers
### Wildcards
- `*` matches multiple characters within a **single term**, e.g. `title:net*`.
- Left truncation (e.g. `title:*net`) is not supported in CKAN.
- Wildcards in the middle of a term are supported but can be slow and less precise.

### Fuzzy search
- Use `~` on a term for fuzzy matching, e.g. `title:rest~` or `title:rest~1`.
- Lower distances are stricter; higher allow more edits.

### Proximity search
- Use `"phrase"~N` to find terms within N word positions.
- Example: `title:"contaminated restricted"~2`.

## Field-specific queries
### Existence / non-existence
- Existence: `field:*` or `field:[* TO *]`
- Non-existence: `NOT field:*` or `-field:*`
- For float/double fields with `NaN`, `field:*` includes NaN, while `field:[* TO *]` excludes NaN.

### Range queries
- Inclusive: `[lower TO upper]`
- Exclusive: `{lower TO upper}`
- Mixed bounds are allowed.
- Works for numeric, date, and string-like fields (lexicographic for strings).

## Dates and date math
- Format: `YYYY-MM-DDThh:mm:ssZ` (UTC, ISO-8601-like)
- Date math examples: `NOW-1DAY`, `NOW/HOUR`, `NOW+6MONTHS+3DAYS/DAY`
- Example query: `metadata_created:[NOW-2MONTHS TO *]`

## Term priorities
### Boosting with `^`
- Boost individual clauses, e.g. `title:water^2 OR title:parks`.

### Constant score with `^=`
- Use `^=` to set a fixed score for a clause, e.g. `title:water^=1 || title:parks^=0.9`.

---

If you need the **full** reference, use the original source page linked above.
