## Problemi

Airtable po refuzon lidhjen sepse `redirect_uri` që po dërgon aplikacioni nuk gjendet në listën e redirect URLs të integrimit tuaj OAuth në Airtable.

Nga network log:
```
redirect_uri = https://9b28a6f7-9a00-4e5b-a490-e963f79e0bac.lovableproject.com/oauth/callback
```

Nga screenshot-i i Airtable, ju keni të regjistruara vetëm:
- `https://integhub.lovable.app/oauth/callback` (published)
- `https://id-preview--9b28a6f7-9a00-4e5b-a490-e963f79e0bac.lovable.app/oauth/callback` (static preview)

Domeni `lovableproject.com` (live preview / sandbox) **mungon** — prandaj Airtable e refuzon.

## Zgjidhja (asnjë ndryshim kodi)

Në panelin tuaj të Airtable OAuth integration, te seksioni **OAuth redirect URLs**, klikoni **+ Add redirect URL** dhe shtoni:

```
https://9b28a6f7-9a00-4e5b-a490-e963f79e0bac.lovableproject.com/oauth/callback
```

Pastaj ruani dhe provoni OAuth-in përsëri nga preview-i.

## Tabela përmbledhëse e redirect URIs

| Mjedis | URL e nevojshme në Airtable | Statusi juaj |
|---|---|---|
| Published (prod) | `https://integhub.lovable.app/oauth/callback` | ✅ shtuar |
| Static preview | `https://id-preview--9b28a6f7-9a00-4e5b-a490-e963f79e0bac.lovable.app/oauth/callback` | ✅ shtuar |
| Live preview (sandbox) | `https://9b28a6f7-9a00-4e5b-a490-e963f79e0bac.lovableproject.com/oauth/callback` | ❌ **mungon — shtoje** |

## Alternativë

Nëse doni ta testoni menjëherë pa prekur Airtable, hapni aplikacionin e publikuar te `https://integhub.lovable.app` dhe nisni OAuth-in prej andej — ai redirect URI është tashmë i lejuar.

## Shënim teknik

Kodi i `oauth-handler` është korrekt: ai përdor `redirect_uri` që frontend-i i dërgon (`${window.location.origin}/oauth/callback`). Kjo është sjellja e duhur që mbështet shumë mjedise. Asnjë ndryshim kodi nuk nevojitet — vetëm konfigurim te Airtable.
