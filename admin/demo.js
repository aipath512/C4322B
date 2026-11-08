(()=>{'use strict';
const $=s=>document.querySelector(s);
const labels={concurenti:['Concurenți','Analiză de concurență — înregistrări demonstrative.'],parteneri:['Parteneri','Parteneri potențiali — înregistrări demonstrative.'],clienti:['Clienți potențiali','Prospectare — înregistrări demonstrative.'],sinteza:['Sinteză','Indicatori din înregistrările demonstrative curente.']};
let current='concurenti',entries=[];
const el=(tag,text,cls)=>{const x=document.createElement(tag);x.textContent=text||'';if(cls)x.className=cls;return x};
function scope(){return {radius:Number($('#radius').value),country:$('#country').value}}
function filtered(category){const f=scope();return entries.filter(x=>x.category===category&&(f.country==='ALL'||x.country===f.country)&&Number.isFinite(x.distance_km)&&x.distance_km<=f.radius)}
function render(){
 const host=$('#records');host.replaceChildren();const term=$('#search').value.trim().toLocaleLowerCase('ro');
 const rows=filtered(current).filter(x=>[x.name,x.city,x.services,x.notes].join(' ').toLocaleLowerCase('ro').includes(term));
 if(!rows.length){host.append(el('p','Nicio înregistrare demonstrativă în zona și țara selectate. Folosiți „Adaugă înregistrare”.'));return}
 for(const x of rows){
  const item=el('article','','item'),info=el('div');info.append(el('h3',x.name));
  info.append(el('p',[x.city,x.country,x.services].filter(Boolean).join(' · ')));
  info.append(el('p',x.distance_km.toLocaleString('ro-RO')+' km · '+x.status+' · date demonstrative','mini muted'));
  if(x.notes)info.append(el('p',x.notes));
  if(x.source_url){const a=el('a','Sursă ↗');a.href=x.source_url;a.rel='noopener noreferrer';a.target='_blank';info.append(a)}
  const remove=el('button','Șterge','btn outline');remove.type='button';remove.addEventListener('click',()=>{entries=entries.filter(e=>e.id!==x.id);render()});
  item.append(info,remove);host.append(item)
 }
}
function summary(){
 const host=$('#metrics');host.replaceChildren();
 for(const [key,name] of [['concurenti','Concurenți'],['parteneri','Parteneri'],['clienti','Clienți potențiali']]){
  const card=el('div','','metric');card.append(el('small',name),el('strong',String(filtered(key).length)));host.append(card)
 }
 const total=el('div','','metric');total.append(el('small','Total'),el('strong',String(['concurenti','parteneri','clienti'].reduce((s,k)=>s+filtered(k).length,0))));host.append(total)
}
function select(t){
 current=t;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
 $('#recordsPanel').classList.toggle('hide',t==='sinteza');$('#summaryPanel').classList.toggle('hide',t!=='sinteza');
 if(t==='sinteza')summary();else{$('#moduleTitle').textContent=labels[t][0];$('#moduleHelp').textContent=labels[t][1];$('#search').value='';render()}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.tab)));
for(const id of ['country','radius'])$('#'+id).addEventListener('change',()=>current==='sinteza'?summary():render());
$('#search').addEventListener('input',render);
$('#refresh').addEventListener('click',render);
$('#resetDemo').addEventListener('click',()=>{entries=[];current==='sinteza'?summary():render()});
$('#add').addEventListener('click',()=>{$('#entryForm').reset();$('#saveMessage').textContent='';$('#editor').showModal()});
$('#close').addEventListener('click',()=>$('#editor').close());
$('#entryForm').addEventListener('submit',e=>{
 e.preventDefault();const x=Object.fromEntries(new FormData(e.currentTarget));
 const km=Number(x.distance_km);if(!Number.isFinite(km)||km<0||km>20000){$('#saveMessage').textContent='Distanța demonstrativă trebuie să fie între 0 și 20.000 km.';return}
 x.id=String(Date.now())+String(Math.random());x.category=current;x.distance_km=km;
 entries.push(x);$('#editor').close();render()
});
render();
})();