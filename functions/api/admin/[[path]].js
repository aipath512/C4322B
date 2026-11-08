// Cloudflare Pages Function: owner-only admin API.
// SECURITY: no data is served unless a genuine Cloudflare Access JWT is verified
// against the configured Access application's public keys, audience and owner email.
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const respond=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:JSON_HEADERS});
const deny=(message,status=403)=>respond({error:message},status);
const FIELDS=['name','city','website','contact','email','status','services','notes','source_url'];
const LIMITS={name:180,city:100,website:500,contact:160,email:254,status:30,services:500,notes:3000,source_url:500};
const CATEGORIES=new Set(['concurenti','parteneri','clienti']);
const STATES=new Set(['nou','analiza','contactat','oportunitate','inactiv']);
function b64url(segment){const padded=segment.replace(/-/g,'+').replace(/_/g,'/');return atob(padded.padEnd(Math.ceil(padded.length/4)*4,'='))}
function bytes(segment){const text=b64url(segment);return Uint8Array.from(text,c=>c.charCodeAt(0))}
function decodeJSON(segment){return JSON.parse(new TextDecoder().decode(bytes(segment)))}
function domain(value){if(!value)return null;const text=String(value).trim().replace(/^https?:\/\//,'').replace(/\/$/,'');if(!/^[a-z0-9][a-z0-9.-]*\.cloudflareaccess\.com$/i.test(text))return null;return text.toLowerCase()}
async function authorize(request,env){
 const team=domain(env.CF_ACCESS_TEAM_DOMAIN),aud=String(env.CF_ACCESS_AUD||''),owner=String(env.ADMIN_OWNER_EMAIL||'').trim().toLowerCase();
 if(!team||!aud||!owner)return {error:'Autentificarea proprietarului nu este încă configurată.',status:503};
 const raw=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!raw)return {error:'Este necesară autentificarea Cloudflare Access.',status:401};
 try{
  const parts=raw.split('.');if(parts.length!==3)throw Error('JWT invalid');
  const header=decodeJSON(parts[0]),payload=decodeJSON(parts[1]);
  if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('Algoritm invalid');
  const now=Math.floor(Date.now()/1000);
  if(!Number.isFinite(payload.exp)||payload.exp<=now||!Number.isFinite(payload.iat)||payload.iat>now+60)throw Error('JWT expirat');
  if(payload.nbf!==undefined&&payload.nbf>now+60)throw Error('JWT nu este încă valid');
  if(payload.iss!=='https://'+team)throw Error('Issuer diferit');
  if(!(Array.isArray(payload.aud)?payload.aud:[payload.aud]).includes(aud))throw Error('Audience diferit');
  if(String(payload.email||'').trim().toLowerCase()!==owner)throw Error('Email neautorizat');
  const certs=await fetch('https://'+team+'/cdn-cgi/access/certs',{cf:{cacheTtl:900,cacheEverything:true}});
  if(!certs.ok)throw Error('Cheile Access indisponibile');
  const jwks=await certs.json();
  const jwk=(jwks.keys||[]).find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));
  if(!jwk)throw Error('Cheie de semnătură negăsită');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const message=new TextEncoder().encode(parts[0]+'.'+parts[1]);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),message))throw Error('Semnătura JWT invalidă');
  return {email:owner};
 }catch(e){return {error:'Sesiune nevalidă, expirată sau utilizator neautorizat.',status:403}}
}
function clean(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Date invalide');
 let out={};for(const k of FIELDS){const value=input[k]??'';if(typeof value!=='string'||value.length>LIMITS[k])throw Error('Câmp invalid: '+k);out[k]=value.trim()}
 if(!out.name)throw Error('Denumirea este obligatorie');
 if(!CATEGORIES.has(input.category))throw Error('Categorie invalidă');
 if(!STATES.has(out.status))throw Error('Status invalid');
 for(const k of ['website','source_url'])if(out[k]&&!/^https:\/\/[a-z0-9][^\s]*$/i.test(out[k]))throw Error('URL HTTPS obligatoriu: '+k);
 if(out.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))throw Error('Email invalid');
 const latitude=input.latitude===''||input.latitude===null||input.latitude===undefined?null:Number(input.latitude);const longitude=input.longitude===''||input.longitude===null||input.longitude===undefined?null:Number(input.longitude);if((latitude===null)!==(longitude===null))throw Error('Latitudine și longitudine obligatorii împreună');if(latitude!==null&&(!Number.isFinite(latitude)||latitude< -90||latitude>90||!Number.isFinite(longitude)||longitude< -180||longitude>180))throw Error('Coordonate invalide');out.latitude=latitude;out.longitude=longitude;out.country=String(input.country||'RO').toUpperCase();if(!/^[A-Z]{2}$/.test(out.country))throw Error('Cod țară invalid');out.category=input.category;return out;
}
function geographic(url,env){
 const radius=Number(url.searchParams.get('radius')||30);
 const country=(url.searchParams.get('country')||'RO').toUpperCase();
 if(![10,30,50,100].includes(radius))throw Error('Rază invalidă');
 if(!/^(RO|BG|HU|MD|ALL)$/.test(country))throw Error('Țară invalidă');
 // The free entitlement is Romania, within a maximum radius of 30 km.
 // Paid upgrades must be explicitly provisioned server-side after payment verification.
 const premiumRadius=Number(env.ADMIN_ENTITLED_RADIUS_KM||30);
 const entitledCountries=String(env.ADMIN_ENTITLED_COUNTRIES||'RO').toUpperCase().split(',').map(x=>x.trim()).filter(Boolean);
 if(![30,50,100].includes(premiumRadius))throw Error('Configurație abonament invalidă');
 if(radius>premiumRadius)return {error:'Extinderea zonei peste '+premiumRadius+' km necesită un pachet contra cost activat.',premiumRequired:true};
 if(country!=='RO'&&!entitledCountries.includes(country))return {error:'Extinderea în alte țări este disponibilă contra cost, după activarea accesului.',premiumRequired:true};
 const lat=Number(env.ADMIN_HQ_LAT),lon=Number(env.ADMIN_HQ_LON);
 if(env.ADMIN_HQ_LAT===undefined||env.ADMIN_HQ_LON===undefined||!Number.isFinite(lat)||!Number.isFinite(lon)||lat< -90||lat>90||lon< -180||lon>180)throw Error('Coordonatele sediului nu sunt configurate');
 return {radius,country,lat,lon};
}
function distanceKm(a,b,c,d){const rad=Math.PI/180,dl=(c-a)*rad,do_=(d-b)*rad;const v=Math.sin(dl/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(do_/2)**2;return 6371.0088*2*Math.asin(Math.min(1,Math.sqrt(v)))}
function inZone(row,geo){if(row.latitude===null||row.longitude===null||!Number.isFinite(Number(row.latitude))||!Number.isFinite(Number(row.longitude)))return false;if(geo.country!=='ALL'&&row.country!==geo.country)return false;return distanceKm(geo.lat,geo.lon,Number(row.latitude),Number(row.longitude))<=geo.radius}
function safeOrigin(request){const origin=request.headers.get('origin');return origin&&origin===new URL(request.url).origin}
async function handler(context){
 const {request,env}=context;
 const user=await authorize(request,env);if(user.error)return deny(user.error,user.status);
 if(!env.ADMIN_DB)return deny('Lipsește baza de date D1 ADMIN_DB. Datele sunt blocate până la configurare.',503);
 const url=new URL(request.url);
 const route=url.pathname.replace(/^\/api\/admin\/?/,'').replace(/\/$/,'');
 if(request.method==='GET'&&route==='session')return respond({ok:true,email:user.email});
 if(request.method==='GET'&&(route==='summary'||route==='records')){
  let geo;try{geo=geographic(url,env);if(geo.premiumRequired)return deny(geo.error,403)}catch(e){return deny(e.message,503)}
  try{
   if(route==='summary'){
    const r=await env.ADMIN_DB.prepare('SELECT category,country,latitude,longitude FROM admin_records').all();
    const data={concurenti:0,parteneri:0,clienti:0,total:0};
    for(const row of r.results||[])if(CATEGORIES.has(row.category)&&inZone(row,geo)){data[row.category]++;data.total++}
    return respond({...data,radius:geo.radius,country:geo.country});
   }
   const category=url.searchParams.get('category');if(!CATEGORIES.has(category))return deny('Categorie invalidă',400);
   const r=await env.ADMIN_DB.prepare('SELECT id,category,name,city,country,latitude,longitude,website,contact,email,status,services,notes,source_url,created_at,updated_at FROM admin_records WHERE category=? ORDER BY updated_at DESC LIMIT 2000').bind(category).all();
   const records=(r.results||[]).filter(row=>inZone(row,geo)).map(row=>({...row,distance_km:Math.round(distanceKm(geo.lat,geo.lon,Number(row.latitude),Number(row.longitude))*10)/10}));
   return respond({records,radius:geo.radius,country:geo.country});
  }catch{return deny('Baza D1 nu este inițializată sau schema geografică lipsește.',503)}
 }
 if(request.method==='POST'&&route==='records'){
  if(!safeOrigin(request))return deny('Origine invalidă',403);
  if(!(request.headers.get('content-type')||'').startsWith('application/json'))return deny('JSON obligatoriu',415);
  const contentLength=Number(request.headers.get('content-length')||0);if(contentLength>12000)return deny('Cererea este prea mare',413);
  let data;try{const raw=await request.text();if(raw.length>12000)return deny('Cererea este prea mare',413);data=clean(JSON.parse(raw))}
  catch(e){return deny('Date invalide: '+e.message,400)}
  const id=crypto.randomUUID();
  try{await env.ADMIN_DB.prepare('INSERT INTO admin_records (id,category,name,city,website,contact,email,status,services,notes,source_url,country,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,data.category,...FIELDS.map(k=>data[k]),data.country,data.latitude,data.longitude).run();return respond({ok:true,id},201)}
  catch{return deny('Înregistrarea nu a putut fi salvată în D1',503)}
 }
 if(request.method==='DELETE'&&route.startsWith('records/')){
  if(!safeOrigin(request))return deny('Origine invalidă',403);
  const id=route.slice('records/'.length);if(!/^[0-9a-f-]{36}$/i.test(id))return deny('ID invalid',400);
  try{await env.ADMIN_DB.prepare('DELETE FROM admin_records WHERE id=?').bind(id).run();return respond({ok:true})}
  catch{return deny('Ștergere nereușită',503)}
 }
 return deny('Rută sau metodă necunoscută',404);
}
export const onRequest=handler;
