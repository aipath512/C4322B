# ADMIN privat — TSC INSTAL (C4322B)

## Stare
Interfața `/admin/` conține patru module: **Concurenți**, **Parteneri**, **Clienți potențiali** și **Sinteză**. Interfața este implementată; **autentificarea și baza de date sunt FAIL-CLOSED** (niciun acces la date) până la configurarea proprietarului și a infrastructurii Cloudflare. Nu există înregistrări comerciale preîncărcate și nu sunt inventate contacte, firme, prețuri, studii sau oportunități.

### Ce poate face
- Concurenți: denumire, localitate, servicii, ofertă/observații, sursă documentată, status.
- Parteneri: producători, furnizori, distribuitori, colaboratori potențiali.
- Clienți potențiali: fișă, etapă comercială, link de proveniență. Prelucrarea datelor personale necesită temei legal și informare conform GDPR.
- Sinteză: numărul de înregistrări în fiecare categorie, total calculat din D1; nu pretinde că produce analiză AI.
- Înregistrare și ștergere protejate prin sesiune Access verificată server-side. Nu se stochează nimic în HTML/JS public.

## Configurare necesară (operator Cloudflare)

1. Deploy **Cloudflare Pages Functions** din repository-ul C4322B (directory-ul de output este `.`, fără comandă de build). Verifică că `functions/api/admin/[[path]].js` este deployat ca Function, nu ca fișier static.
2. În Cloudflare Zero Trust → Access → Applications, creează aplicație **Self-hosted** pentru domeniul efectiv și calea `/admin/*`. Adaugă și aplicația/ajustarea de politică pentru `/api/admin/*`, aceeași identitate și același Application Audience (AUD) dacă sunt în aceeași aplicație; opțiunea recomandată este o singură aplicație care acoperă ambele prefixe prin regulile produsului Cloudflare. Politica Include: **Emails** = exclusiv emailul verificat al proprietarului. Nu configura reguli de tip Everyone sau orice domeniu.
3. Configurează autentificare cu **One-time PIN pe email** în Zero Trust; proprietarul trebuie să dovedească controlul căsuței. Adresa trimisă de client nu reprezintă dovadă de autentificare.
4. Setează pentru Pages Functions variabilele de mediu (fără a pune valori în GitHub):
   - `ADMIN_OWNER_EMAIL` — adresa verificată exclusivă a proprietarului;
   - `CF_ACCESS_TEAM_DOMAIN` — ex. `echipa.cloudflareaccess.com`, cu numele real;
   - `CF_ACCESS_AUD` — Application Audience (AUD) afișat de Cloudflare Access, pentru aplicația care emite JWT-ul la `/api/admin/*`.
5. Creează baza de date **Cloudflare D1** și leag-o în Pages cu binding exact `ADMIN_DB`. Execută migrarea `migrations/0001_admin.sql` pe această bază (de exemplu prin `wrangler d1 execute`), întâi într-un mediu de test.
6. Publică și testează: 
   - utilizator fără login → `GET /api/admin/session` = 401/403 (sau 503 dacă infrastructura este neconfigurată), fără date;
   - email diferit de proprietar → 403/Access deny;
   - email proprietar verificat → 200 /sesiune și dashboard;
   - funcțiile de creare/citire/ștergere merg doar cu Access JWT valid, origine identică și D1 configurat;
   - testare pe mobil și desktop.

### Note de securitate
- **Nu considera pagina `/admin/` protejată până la aplicarea politicii Cloudflare Access pe rută.** Frontendul este un shell public, fără informații comerciale private, dar API refuză accesul în lipsa unei semnături Access valide, a parametrilor server-side și a owner emailului.
- API-ul validează semnătura RSA-SHA256 folosind JWKS emis de echipa Access, `iss`, `aud`, expirația și emailul exact. Nu se bazează pe o valoare introdusă în formular sau pe `localStorage`.
- Întreținerea entităților este CRUD minimal; nu există cercetare web automată, e-mailing automat, enrichment, AI summarization sau import extern în această versiune.
- Protejați accesul la D1, evitați datele personale fără temei legal, limitați retenția și configurați audit/backup înainte de utilizarea comercială.
