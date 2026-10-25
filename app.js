const $=s=>document.querySelector(s),KEY='as_pronote_v1';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}S=S||{students:[],dates:[]};S.act=S.act||{};
const ACTS=["Activités libres", "Multi-activités", "Athlétisme", "Acrosport", "Aérobic", "Arts du cirque", "Aquathlon", "Aviron", "Badminton", "Baseball", "Basket-ball", "Basket 3x3", "Beach-volley", "Biathlon", "BMX", "Boxe française (Savate)", "Canoë-kayak", "Course d'orientation", "Cyclisme sur route", "Danse chorégraphiée", "Danse hip-hop", "Double dutch", "Duathlon", "Équitation", "Escalade", "Fitness / Step", "Football", "Futsal", "Gymnastique artistique", "Gymnastique rythmique", "Handball", "Handball à 4", "Handisport", "Hockey sur gazon", "Judo", "Karaté", "Kitesurf", "Laser run", "Musculation", "Natation", "Padel", "Pétanque", "Planche à voile", "Raid multisports", "Rugby à VII", "Run & Bike", "Sauvetage aquatique", "Skateboard / Surfskate", "Ski alpin", "Sport partagé", "Squash", "Surf", "Tennis", "Tennis de table", "Triathlon", "Ultimate frisbee", "Volley-ball", "Voile légère", "VTT"];
const save=()=>{localStorage.setItem(KEY,JSON.stringify(S));refresh()};
const msg=(id,t)=>{const e=$(id);e.textContent=t;e.classList.toggle('err',/introuvable|absent|inaccessible|Choisissez|non reconnu|déjà noté|vide|Importez|Aucun/i.test(t))};
if('serviceWorker'in navigator){const had=navigator.serviceWorker.controller;navigator.serviceWorker.register('sw.js');navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!window._r){window._r=1;location.reload()}})}
qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
document.querySelectorAll('section').forEach(s=>s.hidden=s.id!==b.dataset.t);if(b.dataset.t!=='t3')stopScan()});
/* ---------- CSV ---------- */
function parseCSV(t){const d=[';',',','\t'].map(c=>[c,t.split(/\r?\n/)[0].split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
const rows=[];let r=[],c='',q=false;
for(let i=0;i<t.length;i++){const h=t[i];
if(q){if(h=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=h}
else if(h=='"')q=true;else if(h==d){r.push(c);c=''}
else if(h=='\n'||h=='\r'){if(h=='\r'&&t[i+1]=='\n')i++;r.push(c);rows.push(r);r=[];c=''}else c+=h}
if(c||r.length){r.push(c);rows.push(r)}return rows.filter(r=>r.some(x=>x.trim()))}
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};
const mkId=(u,n)=>'p'+hash(norm(u)+'|'+(n||'').trim());
const yes=v=>/^(oui|1|x|true)$/i.test((v||'').trim());
const newStu=d=>({inscrit:false,lic:'',acts:[],compet:false,handi:false,autor:false,pres:{},...d});
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;
const b=await f.arrayBuffer();let t=new TextDecoder('utf-8').decode(b);if(t.includes('\uFFFD'))t=new TextDecoder('windows-1252').decode(b);
const rows=parseCSV(t.replace(/^\uFEFF/,''));if(rows.length<2){msg('#m1','Fichier vide ou illisible.');return}
const head=rows.shift().map(h=>h.trim()),hi=n=>head.findIndex(h=>norm(h)===norm(n));
let add=0,upd=0,kept=0;const cls=new Set();
if(hi('Élèves')>=0){
const ix={user:hi('Élèves'),nais:hi('Né(e) le'),sexe:hi('Sexe'),mail:hi('Adresse E-mail'),acc:hi('Accompagnement'),classe:hi('Classe de rattachement'),reg:hi('Régime')},fb={user:0,nais:2,sexe:3,mail:4,acc:7,classe:8,reg:15};
for(const k in ix)if(ix[k]<0)ix[k]=fb[k];
for(const r of rows){const g=k=>(r[ix[k]]||'').trim(),user=g('user');if(!user)continue;
const d={user,nais:g('nais'),sexe:g('sexe'),mail:g('mail'),acc:g('acc'),classe:g('classe'),reg:g('reg')},id=mkId(user,d.nais),s=S.students.find(x=>x.id===id);
if(s){const man=s.classe!==(s.clsP??s.classe);if(man)kept++;Object.assign(s,d,{clsP:d.classe,classe:man?s.classe:d.classe});upd++}else{S.students.push(newStu({id,...d,clsP:d.classe}));add++}cls.add(d.classe)}
}else if(hi('NOM Prénom')>=0){
const H={id:'ID',user:'NOM Prénom',nais:'Date de naissance',sexe:'Sexe',mail:'Adresse e-mail',acc:'Accompagnement',classe:'Classe',clsP:'Classe Pronote',reg:'Régime',ins:'Inscrit AS et licencié UNSS',lic:'N° licence UNSS',acts:'Activités',comp:'Compétitions UNSS',handi:'Sport partagé / Handisport',autor:'Autorisation parentale'},ix={};
for(const k in H)ix[k]=hi(H[k]);
const pc=[];head.forEach((h,i)=>{const m=h.match(/^Présence (\d{4}-\d{2}-\d{2})(?: \| (.+))?$/);if(m)pc.push([i,m[1],m[2]])});
pc.forEach(([,d,a])=>{if(!S.dates.includes(d))S.dates.push(d);if(a&&!S.act[d])S.act[d]=a});
for(const r of rows){const g=k=>ix[k]<0?'':(r[ix[k]]||'').trim(),user=g('user');if(!user)continue;
const d={user,nais:g('nais'),sexe:g('sexe'),mail:g('mail'),acc:g('acc'),classe:g('classe'),clsP:g('clsP')||g('classe'),reg:g('reg'),inscrit:yes(g('ins')),lic:g('lic'),acts:g('acts').split(' ; ').filter(a=>a),compet:yes(g('comp')),handi:yes(g('handi')),autor:yes(g('autor'))},
id=g('id')||mkId(user,d.nais);let s=S.students.find(x=>x.id===id);
if(s){Object.assign(s,d);upd++}else{s=newStu({id,...d});S.students.push(s);add++}
pc.forEach(([i,dt])=>{if((r[i]||'').trim()==='1')s.pres[dt]=1})}
}else{msg('#m1','Format non reconnu : importez un export de classe Pronote (.csv) ou une sauvegarde de cette application.');return}
S.dates.sort();save();msg('#m1',`${add} élève(s) ajouté(s), ${upd} mis à jour`+(cls.size?' (classe : '+[...cls].join(', ')+')':'')+(kept?' · '+kept+' classe'+(kept>1?'s':'')+' modifiée'+(kept>1?'s':'')+' à la main conservée'+(kept>1?'s':''):'')+'.');$('#m1').scrollIntoView({block:'nearest',behavior:'smooth'});e.target.value=''};
document.querySelectorAll('.exp').forEach(b=>b.onclick=()=>{const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"',ou=v=>v?'OUI':'NON';
const L=[['ID','NOM Prénom','Date de naissance','Sexe','Adresse e-mail','Accompagnement','Classe','Classe Pronote','Régime','Inscrit AS et licencié UNSS','N° licence UNSS','Activités','Compétitions UNSS','Sport partagé / Handisport','Autorisation parentale',...S.dates.map(d=>'Présence '+d+(S.act[d]?' | '+S.act[d]:'')),'Total présences']];
S.students.forEach(s=>L.push([s.id,s.user,s.nais,s.sexe,s.mail,s.acc,s.classe,s.clsP??s.classe,s.reg,ou(s.inscrit),s.lic,s.acts.join(' ; '),ou(s.compet),ou(s.handi),ou(s.autor),...S.dates.map(d=>s.pres[d]?1:0),Object.keys(s.pres).length]));
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+L.map(r=>r.map(q).join(';')).join('\r\n')],{type:'text/csv'}));
a.download='sauvegarde_AS_Pronote_'+new Date().toLocaleDateString('sv')+'.csv';a.click()});
$('#wipe').onclick=()=>{if(confirm('Effacer définitivement toutes les données de ce navigateur ?')){S={students:[],dates:[],act:{}};save();msg('#m1','Données effacées.')}};
/* ---------- Cartes ---------- */
const tc=s=>s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase());
const splitName=u=>{const w=u.trim().split(/\s+/),up=x=>x===x.toUpperCase()&&x!==x.toLowerCase();
let nom=w.filter(up),pre=w.filter(x=>!up(x));
if(nom.length===w.length&&w.length>1){pre=[w.pop()];nom=w}else if(!nom.length){nom=[w[0]];pre=w.slice(1)}
return{nom:nom.join(' '),pre:tc(pre.join(' '))}};
const payload=s=>{const n=splitName(s.user);return['AS',s.id,n.nom,n.pre,s.classe].join('|')};
const mkQR=t=>{const q=qrcode(0,'M');q.addData(t);q.make();return q};
const LG={};['unss'].forEach(k=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);LG[k]={d:c.toDataURL('image/png'),r:im.naturalWidth/im.naturalHeight}}catch(e){}};im.src='logo_'+k+'.png'});
const sc=s=>{s=(s||'').toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)};
const cardHTML=s=>{const n=splitName(s.user);return`<div class="card"><div class="ch"><b>Association Sportive</b><span class="lu"><img src="logo_unss.png" alt="UNSS" onerror="this.style.display='none'"></span></div><div class="cb"><div><div class="n">${esc(n.nom)}</div><div>${esc(n.pre)}</div><div class="cl">${esc(s.classe)}</div>${s.reg?`<div class="lic">${esc(sc(s.reg))}</div>`:''}${s.lic?`<div class="lic">Licence UNSS : ${esc(s.lic)}</div>`:''}</div>${mkQR(payload(s)).createSvgTag({cellSize:2,margin:0,scalable:true})}</div></div>`};
const MEM=()=>S.students.filter(s=>s.inscrit),memSorted=()=>MEM().sort((a,b)=>a.classe.localeCompare(b.classe,'fr')||a.user.localeCompare(b.user,'fr'));
$('#gen').onclick=()=>{const M=memSorted();if(!M.length)return msg('#m2','Aucun élève inscrit à l’AS : ouvrez la fiche d’un élève (onglet Import / Export) et cochez « Inscrit ».');
$('#cards').innerHTML=M.map(cardHTML).join('');$('#pdf').disabled=false;msg('#m2',M.length+' carte(s) générée(s).')};
function makePDF(list,name){const{jsPDF}=window.jspdf,doc=new jsPDF({unit:'mm',format:'a4'}),W=85.6,H=54,gx=(210-2*W)/3,gy=(297-5*H)/6;
list.forEach((s,k)=>{if(k&&k%10==0)doc.addPage();const p=k%10,x=gx+(p%2)*(W+gx),y=gy+Math.floor(p/2)*(H+gy),n=splitName(s.user);
doc.setDrawColor(0,130,119);doc.setLineWidth(.4);doc.rect(x,y,W,H);doc.setFillColor(0,130,119);doc.rect(x,y,W,12,'F');
doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text('Association Sportive',x+4,y+7.6);
if(LG.unss){doc.setFillColor(255,255,255);doc.roundedRect(x+W-13,y+1,11,10,1.5,1.5,'F');doc.addImage(LG.unss.d,'PNG',x+W-12.5,y+1.3,9.4*LG.unss.r,9.4,'lunss')}
doc.setTextColor(20);const fit=(t,fs,yy,b)=>{doc.setFont('helvetica',b?'bold':'normal');doc.setFontSize(fs);while(doc.getTextWidth(t)>44&&fs>6){fs--;doc.setFontSize(fs)}while(doc.getTextWidth(t)>44&&t.length>4)t=t.slice(0,-2)+'…';doc.text(t,x+4,yy)};
fit(n.nom,13,y+22,1);fit(n.pre,11,y+28.5);doc.setTextColor(0,130,119);fit(s.classe,13,y+36,1);doc.setTextColor(60);if(s.reg)fit(sc(s.reg),7.5,y+41.5);if(s.lic){doc.setTextColor(40);fit('Licence UNSS : '+s.lic,8.5,y+46.5)}
const q=mkQR(payload(s)),c=q.getModuleCount(),sz=30,m=sz/c,qx=x+W-sz-4,qy=y+16;doc.setFillColor(0);
for(let i=0;i<c;i++)for(let j=0;j<c;j++)if(q.isDark(i,j))doc.rect(qx+j*m,qy+i*m,m+.02,m+.02,'F');
doc.setTextColor(110);doc.setFont('helvetica','normal');doc.setFontSize(6);doc.text('À présenter à chaque séance',x+4,y+H-2.5)});
doc.save(name)}
$('#pdf').onclick=()=>makePDF(memSorted(),'cartes_AS.pdf');
const find=t=>{const k=norm(t),M=MEM();return M.filter(s=>norm(s.user)===k).concat(M.filter(s=>norm(s.user).includes(k)))[0]};
$('#one').onclick=()=>{const s=find($('#nm').value);if(!$('#nm').value.trim()||!s)return msg('#m2','Élève introuvable.');
makePDF([s],'carte_'+norm(s.user).replace(/ /g,'_')+'.pdf');msg('#m2','Carte de '+s.user+' téléchargée.')};
/* ---------- Appel ---------- */
$('#date').value=new Date().toLocaleDateString('sv');
let stream=null,last='',lastT=0,ac;
const beep=()=>{try{ac=ac||new AudioContext();const o=ac.createOscillator();o.connect(ac.destination);o.frequency.value=880;o.start();o.stop(ac.currentTime+.12)}catch(e){}navigator.vibrate&&navigator.vibrate(80)};
function mark(s,d){if(!d){msg('#m3','Choisissez une date.');return false}
if(s.pres[d]){msg('#m3',s.user+' : déjà noté présent.');return false}
s.pres[d]=1;if(!S.dates.includes(d)){S.dates.push(d);S.dates.sort()}save();msg('#m3','✔ '+s.user+' ('+s.classe+')');beep();return true}
$('#scan').onclick=async()=>{if(!$('#date').value)return msg('#m3','Choisissez d’abord la date.');
try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){return msg('#m3','Caméra inaccessible : autorisez-la dans le navigateur.')}
const v=$('#v');v.srcObject=stream;await v.play();$('#cam').hidden=false;$('#stop').hidden=false;$('#scan').hidden=true;loop()};
function stopScan(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('#cam').hidden=true;$('#stop').hidden=true;$('#scan').hidden=false}
$('#stop').onclick=stopScan;
function loop(){if(!stream)return;const v=$('#v');
if(v.readyState===4&&v.videoWidth){const k=Math.min(1,640/v.videoWidth),c=loop.c||(loop.c=document.createElement('canvas'));c.width=v.videoWidth*k;c.height=v.videoHeight*k;
const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(v,0,0,c.width,c.height);const im=x.getImageData(0,0,c.width,c.height),code=jsQR(im.data,c.width,c.height,{inversionAttempts:'dontInvert'});
if(code){const t=new TextDecoder().decode(Uint8Array.from(code.binaryData));
if(!(t===last&&Date.now()-lastT<3000)){last=t;lastT=Date.now();const p=t.split('|');
if(p[0]!=='AS')msg('#m3','QR code non reconnu.');
else{const w=S.students.find(s=>s.id&&s.id===p[1])||S.students.find(s=>norm(splitName(s.user).nom+' '+splitName(s.user).pre)===norm(p[2]+' '+p[3]));
w?mark(w,$('#date').value):msg('#m3','Élève absent de la liste : '+p[2]+' '+p[3])}}}}
requestAnimationFrame(loop)}
$('#add').onclick=()=>{const s=find($('#man').value);s?mark(s,$('#date').value):msg('#m3','Élève introuvable.');$('#man').value=''};
$('#date').onchange=refresh;['#fd','#fa','#fj','#fs'].forEach(i=>$(i).onchange=renderView);
$('#act').onchange=()=>{const d=$('#date').value;if(!d){msg('#m3','Choisissez d’abord la date.');$('#act').value='';return}if($('#act').value)S.act[d]=$('#act').value;else delete S.act[d];save()};
/* ---------- Stats ---------- */
const grp=x=>{const c=(x||'').trim()[0]?.toUpperCase();return c==='F'?'Filles':'MGH'.includes(c||'-')?'Garçons':'Non précisé'};
const tbl=(h,rows)=>`<table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
const bar=p=>`<div class="bar" style="width:${Math.min(100,p)}%"></div>`;
function stats(){const N=MEM().length,D=S.dates;if(!D.length||!N)return'<p>Aucune séance enregistrée.</p>';
const cnt=d=>MEM().filter(s=>s.pres[d]).length,pc=(a,b)=>b?Math.round(100*a/b):0;
let h='<h3>Par date</h3>'+tbl(['Date','Présents','Taux',''],D.map(d=>{const c=cnt(d);return[d.split('-').reverse().join('/'),c+' / '+N,pc(c,N)+' %',bar(pc(c,N))]}));
const J=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'],jd=J.map(()=>[]);
D.forEach(d=>jd[(new Date(d+'T12:00').getDay()+6)%7].push(d));
h+='<h3>Par jour de la semaine</h3>'+tbl(['Jour','Séances','Présences','Moyenne',''],J.map((j,i)=>{if(!jd[i].length)return null;const t=jd[i].reduce((a,d)=>a+cnt(d),0),m=t/jd[i].length;return[j,jd[i].length,t,m.toFixed(1),bar(pc(m,N))]}).filter(Boolean));
const AC={};D.forEach(d=>{const a=S.act[d]||'Non précisée';(AC[a]=AC[a]||[]).push(d)});
h+='<h3>Par activité</h3>'+tbl(['Activité','Séances','Présences','Moyenne',''],Object.entries(AC).sort((a,b)=>a[0].localeCompare(b[0],'fr')).map(([a,ds])=>{const t=ds.reduce((x,d)=>x+cnt(d),0),m=t/ds.length;return[esc(a),ds.length,t,m.toFixed(1),bar(pc(m,N))]}));
const G={};MEM().forEach(s=>{const g=grp(s.sexe);G[g]=G[g]||{n:0,p:0};G[g].n++;G[g].p+=D.filter(d=>s.pres[d]).length});
h+='<h3>Par sexe</h3>'+tbl(['Groupe','Élèves','Présences','Assiduité',''],Object.entries(G).map(([g,v])=>[g,v.n,v.p,pc(v.p,v.n*D.length)+' %',bar(pc(v.p,v.n*D.length))]));return h.replace(/<h3>/g,'<div class="sp"><h3>').replace(/<\/table>/g,'</table></div>')}
function renderList(){fill($('#gt'),[...new Set(S.students.flatMap(s=>s.acts))].sort((a,b)=>ACTS.indexOf(a)-ACTS.indexOf(b)).map(a=>[a,a]),'Toutes les activités');
const q=norm($('#q').value),gm=$('#gm').value,ga=$('#ga').value,gc=$('#gc').value,gt=$('#gt').value,y=(v,f)=>!f||(f==='1')===!!v;
const L=[...S.students].sort((a,b)=>a.user.localeCompare(b.user,'fr')).filter(s=>(!q||norm(s.user+' '+s.classe).includes(q))&&y(s.inscrit,gm)&&y(s.autor,ga)&&y(s.compet,gc)&&(!gt||s.acts.includes(gt)));
$('#nl').textContent='('+S.students.length+(L.length<S.students.length?' · '+L.length+' affiché'+(L.length>1?'s':''):'')+')';
$('#tl').innerHTML='<tr><th>NOM Prénom</th><th>Classe</th><th>Naissance</th><th></th></tr>'+(L.length?L.map(s=>`<tr><td>${esc(s.user)}${s.inscrit?'<span class="tag">AS</span>':''}<div class="men">${s.autor?'<span class="tg">Autorisation parentale</span>':''}${s.compet?'<span class="tg">Compétitions</span>':''}${s.acts.length?'<span class="ac">'+esc(s.acts.join(', '))+'</span>':''}</div></td><td>${esc(s.classe)}</td><td>${esc(s.nais)}</td><td><button class="alt sm" data-id="${esc(s.id)}">Fiche</button></td></tr>`).join(''):'<tr><td colspan="4">'+(S.students.length?'Aucun élève pour ces critères.':'Aucun élève importé pour l’instant.')+'</td></tr>');
$('#tl').querySelectorAll('button').forEach(b=>b.onclick=()=>openFiche(b.dataset.id))}
let cur=null;
const sumActs=()=>{const n=document.querySelectorAll('#fac input:checked').length;$('#fsum').textContent=n?n+' activité'+(n>1?'s':'')+' sélectionnée'+(n>1?'s':''):'Choisir les activités'};
function openFiche(id){cur=S.students.find(s=>s.id===id);if(!cur)return;const s=cur,n=splitName(s.user);
$('#fh').textContent=n.nom+' '+n.pre;$('#fi').textContent='Né(e) le '+s.nais;$('#fsexe').value=s.sexe||'—';$('#fcls').value=s.classe;$('#fclsn').textContent=s.clsP&&s.clsP!==s.classe?'Classe Pronote : '+s.clsP+' (modifiée à la main)':'';$('#freg').value=s.reg||'—';
$('#fins').checked=s.inscrit;$('#flic').value=s.lic;$('#fcomp').checked=s.compet;$('#fhandi').checked=s.handi;$('#fautor').checked=s.autor;
$('#fac').innerHTML=ACTS.map(a=>`<label><input type="checkbox" value="${esc(a)}"${s.acts.includes(a)?' checked':''}> ${esc(a)}</label>`).join('');
$('#facd').open=false;sumActs();$('#fiche').showModal()}
$('#fac').onchange=sumActs;$('#q').oninput=renderList;['#gm','#ga','#gc','#gt'].forEach(i=>$(i).onchange=renderList);
$('#fcancel').onclick=()=>$('#fiche').close();
$('#fsave').onclick=e=>{e.preventDefault();if(!cur)return;Object.assign(cur,{classe:$('#fcls').value.trim()||cur.classe,inscrit:$('#fins').checked,lic:$('#flic').value.trim(),compet:$('#fcomp').checked,handi:$('#fhandi').checked,autor:$('#fautor').checked,acts:[...document.querySelectorAll('#fac input:checked')].map(x=>x.value)});
$('#fiche').close();save();msg('#m1','Fiche de '+cur.user+' enregistrée.')};
const JOURS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
function fill(sel,items,all){const cur=sel.value;sel.innerHTML='<option value="">'+all+'</option>'+items.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('');if(items.some(x=>x[0]===cur))sel.value=cur}
function renderView(){const D=[...S.dates].sort().reverse(),dow=d=>new Date(d+'T12:00').getDay();
fill($('#act'),ACTS.map(a=>[a,a]),'Choisir l’activité de la séance');$('#act').value=S.act[$('#date').value]||'';
fill($('#fd'),D.map(d=>[d,d.split('-').reverse().join('/')+' ('+JOURS[dow(d)]+')'+(S.act[d]?' – '+S.act[d]:'')]),'Toutes les dates');
fill($('#fa'),[...new Set(D.map(d=>S.act[d]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')).map(a=>[a,a]),'Toutes les activités');
const fd=$('#fd').value,fa=$('#fa').value,fj=$('#fj').value,fs=$('#fs').value,
ses=D.filter(d=>(!fd||d===fd)&&(!fa||S.act[d]===fa)&&(fj===''||dow(d)==fj)),
P=MEM().filter(s=>!fs||grp(s.sexe)===fs).map(s=>[s,ses.filter(d=>s.pres[d]).length]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]||a[0].user.localeCompare(b[0].user,'fr'));
$('#vn').textContent='('+P.length+' élève'+(P.length>1?'s':'')+' · '+ses.length+' séance'+(ses.length>1?'s':'')+')';
$('#vh').textContent=ses.length>1&&P.length?'Le chiffre à droite indique le nombre de séances suivies.':'';
$('#vl').innerHTML=P.length?P.map(([s,n])=>`<li><span>${esc(s.user)} <small>${esc(s.classe)}</small></span>${ses.length>1?'<b>'+n+'</b>':''}</li>`).join(''):'<li>'+(S.dates.length?'Aucun élève pour ces critères.':'Aucune séance enregistrée.')+'</li>'}
function refresh(){renderList();renderView();$('#count').textContent=MEM().length+' inscrit'+(MEM().length>1?'s':'')+' AS';
$('#dl').innerHTML=MEM().map(s=>`<option value="${esc(s.user)}">`).join('');
const d=$('#date').value,P=S.students.filter(s=>s.pres[d]);$('#np').textContent='('+P.length+')';
$('#pl').innerHTML=P.map(s=>`<li><span>${esc(s.user)} <small>${esc(s.classe)}</small></span><button data-i="${S.students.indexOf(s)}" title="Retirer">✕</button></li>`).join('')||'<li>Aucun élève scanné.</li>';
$('#pl').querySelectorAll('button').forEach(b=>b.onclick=()=>{delete S.students[b.dataset.i].pres[d];save()});
$('#st').innerHTML=stats()}
refresh();

/* ---------- Installation PWA ---------- */
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function instUI(){if(standalone)return;$('#inst').hidden=false;$('#instb').hidden=!window.dip;
$('#instp').textContent=window.dip?'Installez Gestion AS pour l’ouvrir comme une application, même sans connexion.':ios?'Sur iPhone ou iPad, dans Safari : touchez le bouton Partager, puis « Sur l’écran d’accueil ».':'Ouvrez le menu du navigateur (⋮ ou ⋯) et choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option n’existe pas, votre navigateur ne permet pas l’installation (par exemple Firefox sur ordinateur).'}
addEventListener('dipready',instUI);
$('#instb').onclick=async()=>{const e=window.dip;if(!e)return;e.prompt();await e.userChoice;window.dip=null;instUI()};
addEventListener('appinstalled',()=>{window.dip=null;$('#inst').hidden=true});
instUI();
