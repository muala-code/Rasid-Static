const $ = (id) => document.getElementById(id);

const API_BASE = String(window.RASID_CONFIG?.apiBase || '').replace(/\/+$/, '');
function apiUrl(path) {
  if (!API_BASE) return null;
  return `${API_BASE}${path}`;
}
function requireApi(path) {
  const url = apiUrl(path);
  if (!url) throw new Error('RASID_API_NOT_CONFIGURED');
  return url;
}
function preloadHeaderSymbols() {
  for (const src of ['./header-symbol-light.webp', './header-symbol-dark.webp']) {
    const img = new Image();
    img.src = src;
  }
}


function applyTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark-mode', dark);

  const toggle = $('themeToggle');
  if (toggle) {
    toggle.textContent = dark ? '🌙' : '☀️';
    toggle.setAttribute('aria-label', dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن');
    toggle.title = dark ? 'الوضع الداكن' : 'الوضع الفاتح';
  }

  for (const id of ['headerSymbol', 'offlineSymbol']) {
    const symbol = $(id);
    if (!symbol) continue;
    const src = dark ? symbol.dataset.darkSrc : symbol.dataset.lightSrc;
    if (src && symbol.getAttribute('src') !== src) symbol.setAttribute('src', src);
  }
}

function initTheme() {
  const saved = localStorage.getItem('rasid-theme');

  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    const hour = new Date().getHours();
    applyTheme(hour >= 6 && hour < 18 ? 'light' : 'dark');
  }

  const toggle = $('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem('rasid-theme', next);
      applyTheme(next);
    });
  }
}
const fmt = (v, d=1) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? '--' : Number(v).toFixed(d).replace(/\.0+$|(?<=\.\d*[1-9])0+$/,'');
function text(id,v){const e=$(id);if(e)e.textContent=v;}
function direction(deg){if(!Number.isFinite(Number(deg)))return '--';const dirs=['ش','ش ش ق','ق','ج ق','ج','ج غ','غ','ش غ'];const n=Number(deg);return `${dirs[Math.round(n/45)%8]} ${Math.round(n)}°`;}
function tempClass(v){v=Number(v);if(!Number.isFinite(v))return 'cold';if(v>=40)return'very-hot';if(v>=35)return'hot';if(v>=22)return'moderate';return'cold';}
function updateClock(){const now=new Date();const clock=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);text('liveTime',clock);text('gregorianDate',now.toLocaleDateString('ar-SA',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));try{text('hijriDate',new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(now));}catch{text('hijriDate','');}}
function setStatus(ok){const lamp=$('statusLamp');if(lamp)lamp.className='status-lamp '+(ok?'connected':'disconnected');text('statusText',ok?'متصلة':'غير متصلة');}
function setTemp(v){const e=$('temperature');if(!e)return;e.textContent=v==null?'--°':`${fmt(v)}°`;e.className='temperature '+tempClass(v);}
function stationCoreDataAvailable(d){
  const values=[d?.temperature,d?.humidity,d?.windSpeed,d?.pressure];
  return values.filter(v=>Number.isFinite(Number(v))).length>=2;
}
function formatReadingTime(value){
  if(!value)return null;
  const d=new Date(value); if(Number.isNaN(d.getTime()))return null;
  return d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
}
function readingAge(value){
  if(!value)return'';
  const d=new Date(value); if(Number.isNaN(d.getTime()))return'';
  const minutes=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));
  if(minutes<1)return'منذ أقل من دقيقة';
  if(minutes<60)return`منذ ${minutes} دقيقة`;
  const hours=Math.floor(minutes/60), rem=minutes%60;
  if(hours<24)return rem?`منذ ${hours} س و${rem} د`:`منذ ${hours} ساعة`;
  const days=Math.floor(hours/24), hr=hours%24;
  return hr?`منذ ${days} يوم و${hr} س`:`منذ ${days} يوم`;
}
function showStationData(){
  const data=$('stationData'), offline=$('stationOffline');
  if(data)data.hidden=false;
  if(offline)offline.hidden=true;
}
function showStationUnavailable(info={}){
  const data=$('stationData'), offline=$('stationOffline');
  if(data)data.hidden=true;
  if(offline)offline.hidden=false;
  setStatus(false);
  const when=formatReadingTime(info.observedAt);
  text('lastReading',`آخر قراءة: ${when||'--'}`);
  text('offlineLastReading',when?`آخر قراءة محفوظة: ${when} · ${readingAge(info.observedAt)}`:'آخر قراءة محفوظة: غير متاحة');
  text('offlineMessage',info.message||'يبدو أن راصد لم يستقبل قراءة حديثة من المحطة في الوقت الحالي.');
}
function renderWeather(d){
  setTemp(d.temperature);text('conditionIcon',d.condition?.icon||'🌤️');text('maxTemp',d.dayMax==null?'--°':`${fmt(d.dayMax)}°`);text('minTemp',d.dayMin==null?'--°':`${fmt(d.dayMin)}°`);text('feelsLike',d.feelsLike==null?'--°':`${fmt(d.feelsLike)}°`);text('humidity',d.humidity==null?'--%':`${fmt(d.humidity,0)}%`);text('wind',d.windSpeed==null?'--':`${fmt(d.windSpeed)} كم/س`);text('windDirection',direction(d.windDirection));text('windGust',d.windGust==null?'--':`${fmt(d.windGust)} كم/س`);text('pressure',d.pressure==null?'--':`${fmt(d.pressure)} hPa`);text('dewPoint',d.dewPoint==null?'--':`${fmt(d.dewPoint)}°`);text('solarRadiation',d.solarRadiation==null?'--':`${fmt(d.solarRadiation)} W/m²`);text('uv',d.uv==null?'--':fmt(d.uv));text('rain',d.rain==null?'--':`${fmt(d.rain)} مم`);
  const when=formatReadingTime(d.observedAt)||'--';text('lastReading',`آخر قراءة: ${when}`);setStatus(true);showStationData();
}
async function loadWeather(){
  if(new URLSearchParams(location.search).get('demo')==='offline'){
    showStationUnavailable({observedAt:new Date(Date.now()-47*60000).toISOString(),message:'وضع معاينة: هكذا تظهر الواجهة عندما تتوقف بيانات المحطة.'});
    return;
  }
  try{
    const r=await fetch(requireApi('/api/weather'),{cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){showStationUnavailable({observedAt:d.observedAt,message:'تعذر الوصول إلى بيانات المحطة مؤقتًا. سنعرضها تلقائيًا عند عودة الاتصال.'});return;}
    if(d.stationConnected!==true||!stationCoreDataAvailable(d)){
      showStationUnavailable({observedAt:d.observedAt});return;
    }
    renderWeather(d);
  }catch(e){
    console.error(e);
    showStationUnavailable({message: e?.message==='RASID_API_NOT_CONFIGURED' ? 'خدمة بيانات راصد لم تُربط بعد بالنسخة الثابتة.' : 'تعذر الوصول إلى بيانات المحطة مؤقتًا. سنحاول مجددًا تلقائيًا.'});
  }
}
function fIcon(p){const t=String(p||'').toLowerCase();if(t.includes('رعد')||t.includes('عاص'))return'⛈️';if(t.includes('مطر'))return'🌧️';if(t.includes('غبار')||t.includes('أتربة')||t.includes('عوالق'))return'🌫️';if(t.includes('غائم')||t.includes('سحب'))return'☁️';if(t.includes('مشمس')||t.includes('صحو'))return'☀️';return'🌤️';}
function dayName(n,i){return i===0?'اليوم':i===1?'غدًا':n||`اليوم ${i+1}`;}
async function loadForecast(){const c=$('forecastContent');try{const r=await fetch(requireApi('/api/forecast'),{cache:'no-store'});const d=await r.json();if(!r.ok||!d.enabled){c.innerHTML=`<div class="loading">${d.message||d.error||'لا تتوفر التوقعات حاليًا.'}</div>`;return;}const days=(d.days||[]).filter(x=>x && (x.validTime || Number.isFinite(Number(x.max)) || Number.isFinite(Number(x.min)) || Number.isFinite(Number(x.precipChance)) || String(x.phrase||'').trim())).slice(0,5); c.style.setProperty('--forecast-count', Math.max(1, days.length)); text('forecastCount', `${days.length} ${days.length===1?'يوم':'أيام'}`); c.innerHTML=days.map((x,i)=>`<article class="forecast-day"><div class="forecast-name">${dayName(x.day,i)}</div><div class="forecast-date">${x.validTime?new Date(x.validTime).toLocaleDateString('ar-SA',{day:'numeric',month:'short'}):''}</div><div class="forecast-icon">${fIcon(x.phrase)}</div><div class="forecast-temps"><span class="high">↑ ${fmt(x.max)}°</span> <span class="low">↓ ${fmt(x.min)}°</span></div><div class="forecast-rain">${x.precipChance!=null?`فرصة المطر ${fmt(x.precipChance,0)}%`:''}</div><div class="forecast-phrase">${x.phrase||'—'}</div></article>`).join('');}catch(e){console.error(e);c.innerHTML=`<div class="loading">${e?.message==='RASID_API_NOT_CONFIGURED'?'خدمة البيانات لم تُربط بعد.':'تعذر تحميل التوقعات حاليًا.'}</div>`;}}
let stats=null;
let selectedStatsYear=new Date().getFullYear();
function formatStatDate(value){if(!value)return'--';const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?'--':d.toLocaleDateString('ar-SA',{day:'numeric',month:'long',year:'numeric'});}
function renderStatsSummary(d){
  const s=d.summary||{};
  text('statMaxTemp',s.highestTemp==null?'--':`${fmt(s.highestTemp)}°`);
  text('statMaxTempDate',formatStatDate(s.highestTempDate));
  text('statMinTemp',s.lowestTemp==null?'--':`${fmt(s.lowestTemp)}°`);
  text('statMinTempDate',formatStatDate(s.lowestTempDate));
  text('statWindGust',s.highestWindGust==null?'--':`${fmt(s.highestWindGust)} كم/س`);
  text('statWindGustDate',formatStatDate(s.highestWindGustDate));
  text('statMaxHumidity',s.highestHumidity==null?'--':`${fmt(s.highestHumidity,0)}%`);
  text('statMaxHumidityDate',formatStatDate(s.highestHumidityDate));
  text('statMinHumidity',s.lowestHumidity==null?'--':`${fmt(s.lowestHumidity,0)}%`);
  text('statMinHumidityDate',formatStatDate(s.lowestHumidityDate));
  text('statRain',s.highestRain==null?'--':`${fmt(s.highestRain)} مم`);
  text('statRainDate',formatStatDate(s.highestRainDate));
  text('statRainDays',s.rainyDays==null?'--':`${s.rainyDays} يوم`);
}
function initYearSelect(){
  const el=$('statsYear'); if(!el)return;
  const now=new Date().getFullYear();
  el.innerHTML='';
  for(let y=now;y>=2026;y--){const o=document.createElement('option');o.value=String(y);o.textContent=String(y);el.appendChild(o);}
  el.value=String(selectedStatsYear);
  el.addEventListener('change',()=>{selectedStatsYear=Number(el.value)||now;loadStats(selectedStatsYear);});
}
function renderMonthlyChart(months){
  const host=$('monthlyChart'); if(!host)return;
  const num=v=>(v===null||v===undefined||v===''||!Number.isFinite(Number(v)))?null:Number(v);
  const data=(months||[]).filter(m=>m && (num(m.max)!==null||num(m.min)!==null||num(m.rainTotal)!==null));
  if(!data.length){host.innerHTML='<div class="loading">لا تتوفر بيانات شهرية بعد.</div>';return;}

  const W=Math.max(720,data.length*96),H=258,top=36,bottom=42,base=H-bottom,plot=base-top;
  const temps=data.flatMap(m=>[num(m.max),num(m.min)]).filter(v=>v!==null);
  const tMin=Math.min(0,...temps),tMax=Math.max(50,...temps);
  const rains=data.map(m=>num(m.rainTotal)).filter(v=>v!==null);
  const rMax=Math.max(1,...rains);
  const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  let bars=''; const group=W/data.length,bar=12,gap=5;
  data.forEach((m,i)=>{
    const cx=i*group+group/2, x0=cx-(bar*3+gap*2)/2;
    const vals=[num(m.max),num(m.min),num(m.rainTotal)];
    const hs=[
      vals[0]!==null?Math.max(2,(vals[0]-tMin)/(tMax-tMin)*plot):0,
      vals[1]!==null?Math.max(2,(vals[1]-tMin)/(tMax-tMin)*plot):0,
      vals[2]!==null?Math.max(2,vals[2]/rMax*plot):0
    ];
    const cls=['month-max','month-min','month-rain'];
    vals.forEach((v,j)=>{
      if(v===null)return;
      const x=x0+j*(bar+gap),y=base-hs[j];
      const exact=`${fmt(v)}${j===2?' مم':'°'}`;
      const visible=j===2?`${fmt(v)}مم`:`${fmt(v,0)}°`;
      bars+=`<rect class="${cls[j]}" x="${x}" y="${y}" width="${bar}" height="${hs[j]}" rx="3"><title>${esc(m.name)} · ${j===0?'العظمى':j===1?'الصغرى':'المطر'}: ${exact}</title></rect>`;
      bars+=`<text class="monthly-value ${cls[j]}-value" x="${x+bar/2}" y="${Math.max(12,y-5)}" text-anchor="middle">${visible}</text>`;
    });
    bars+=`<text class="month-label" x="${cx}" y="${H-16}" text-anchor="middle">${esc(m.name)}</text>`;
  });
  host.innerHTML=`<svg class="monthly-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="الحرارة والمطر حسب الشهر"><line class="monthly-baseline" x1="10" y1="${base}" x2="${W-10}" y2="${base}"/>${bars}</svg>`;
}
async function loadStats(year=selectedStatsYear){try{const r=await fetch(requireApi(`/api/stats?year=${year}`),{cache:'no-store'});const d=await r.json();if(!r.ok||!d.enabled)throw Error(d.message||d.error);stats=d;renderStatsSummary(d);renderMonthlyChart(d.months);}catch(e){console.error(e);text('statMaxTemp','--');text('statMinTemp','--');text('statWindGust','--');text('statMaxHumidity','--');text('statMinHumidity','--');text('statRain','--');text('statRainDays','--');const c=$('monthlyChart');if(c)c.innerHTML=`<div class="loading">${e?.message==='RASID_API_NOT_CONFIGURED'?'خدمة البيانات لم تُربط بعد.':'تعذر تحميل الملخص الشهري.'}</div>`;}}
function moonData(date=new Date()){
  const synodic=29.53058867, known=Date.UTC(2000,0,6,18,14,0), days=(date.getTime()-known)/86400000;
  const age=((days%synodic)+synodic)%synodic, phase=age/synodic, illumination=Math.round((1-Math.cos(2*Math.PI*phase))*50);
  let name='محاق',icon='🌑';
  if(age>=1.85&&age<5.54){name='هلال متزايد';icon='🌒';}
  else if(age>=5.54&&age<9.23){name='التربيع الأول';icon='🌓';}
  else if(age>=9.23&&age<12.92){name='أحدب متزايد';icon='🌔';}
  else if(age>=12.92&&age<16.61){name='بدر';icon='🌕';}
  else if(age>=16.61&&age<20.30){name='أحدب متناقص';icon='🌖';}
  else if(age>=20.30&&age<23.99){name='التربيع الأخير';icon='🌗';}
  else if(age>=23.99&&age<27.68){name='هلال متناقص';icon='🌘';}
  return{name,icon,illumination,age:Math.round(age*10)/10};
}
function renderMoon(){const m=moonData();text('moonIcon',m.icon);text('moonPhase',m.name);text('moonIllumination',`الإضاءة ${m.illumination}% · عمر القمر ${m.age} يوم`);}
async function loadPrayer(){
  const c=$('prayerGrid');
  try{
    const r=await fetch(requireApi('/api/prayer'),{cache:'no-store'});
    const d=await r.json();

    if(!r.ok||!d.enabled){
      c.innerHTML=`<div class="loading">${d.message||d.error||'لا تتوفر أوقات الصلاة حاليًا.'}</div>`;
      return;
    }

    text('prayerDate', d.hijriDate ? `${d.date} · ${d.hijriDate}` : (d.date||''));

    const names=[
      ['الفجر','fajr'],
      ['الشروق','sunrise'],
      ['الظهر','dhuhr'],
      ['العصر','asr'],
      ['المغرب','maghrib'],
      ['العشاء','isha']
    ];

    c.innerHTML=names.map(([n,k])=>
      `<div class="prayer-card ${((d.next||d.current)===k)?'next':''}">
        <div class="name">${n}</div>
        <div class="time">${d.times?.[k]||'--:--'}</div>
      </div>`
    ).join('');

    text('moonRise',d.moon?.rise||'--:--');
    text('moonSet',d.moon?.set||'--:--');
  }catch(e){
    console.warn(e);
    c.innerHTML=`<div class="loading">${e?.message==='RASID_API_NOT_CONFIGURED'?'خدمة البيانات لم تُربط بعد.':'تعذر تحميل أوقات الصلاة حاليًا.'}</div>`;
  }
}
preloadHeaderSymbols();initTheme();updateClock();setInterval(updateClock,1000);initYearSelect();renderMoon();
const retryWeather=$('retryWeather');if(retryWeather)retryWeather.addEventListener('click',()=>{if(new URLSearchParams(location.search).get('demo')==='offline'){location.href=location.pathname;}else{loadWeather();}});
loadWeather();loadForecast();loadStats();loadPrayer();setInterval(loadWeather,20000);
