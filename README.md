# C4322B — Website-etalon B2C București

**Prototip funcțional al unui site modern pentru o firmă fictivă CAEN 4322.** Încălzire, climatizare și instalații sanitare pentru apartamente și case.

## Pagini
- `index.html`: homepage premium cu hero, categorii, avantaje și FAQ
- `despre.html`: identitatea demonstrativă a companiei
- `servicii.html`: **46 servicii** grupate în trei familii, cu fișe și filtrare
- `produse.html`: **49 familii de produse**, descriere și criterii de alegere
- `mentenanta.html`: revizii și contract de mentenanță (model)
- `garantii.html`: produs, manoperă și reparații
- `certificari.html`: verificarea cerințelor ISCIR, ANRE și F-gaze (fără certificate revendicate)
- `oferta.html`: formular local de compunere a cererii, copiere text și deschidere email
- `legal.html`: Termeni, Cookies, Confidențialitate, GDPR, AI Act
- `contact.html`: date demonstrative de contact

Include **asistent conversațional automat** pe toate paginile. Funcționează pe reguli locale și caută în catalog; **nu** este conectat la un model generativ AI.

## Date demonstrative
- Nume: C4322B
- Adresă fictivă: Strada Exemplului nr. 24, București
- Email demonstrativ: email@etalon.com
- Nu se inventează persoane, CUI, nr. Registrul Comerțului, certificări sau prețuri.

## Fișiere și deploy
Site static HTML/CSS/JS: `style.css` (design), `catalog.js` (date), `app.js` (rendering, interacțiuni), 10 fișiere HTML. Nu necesită npm sau build. Cloudflare Pages: conectare repository, build command gol, output directory `.` (rădăcina).

## Important înainte de a-l folosi comercial
- Site-ul demonstrativ are `noindex,nofollow` și `robots.txt` cu `Disallow: /`. Actualizează numai după eliminarea datelor fictive.
- Imaginile de atmosferă sunt referințe externe Unsplash, fonturile sunt de la Google Fonts: verifică licențele și solicitările către furnizori.
- Prețuri, contracte, garanții comerciale, urgențe și autorizări: **neconfirmate**, necesită dovezi.
- Formularul **nu trimite și nu stochează pe server**; `mailto:` deschide aplicația email a utilizatorului.
- Textele legale sunt **exemple**, nu atestă conformitatea juridică.
- Pentru un AI conversațional real se va integra un backend securizat, cu control al datelor, costurilor și transparență.
- Catalogul este model de ofertă, nu afirmația că o firmă reală prestează toate operațiunile.

© 2026 C4322B — prototip demonstrativ.
