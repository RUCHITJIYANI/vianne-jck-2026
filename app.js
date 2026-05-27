const ALL=Object.keys(ITEMS);
let cur=null,ovr=null,acIdx=-1,scanOn=false;
const STORAGE_KEYS={
  deviceId:'vianne_device_id',
  events:'vianne_events_v1',
  orders:'vianne_orders_v1'
};
const MAX_EVENTS=5000;
let cloudDb=null;
let cloudReady=false;
let cloudStatus='local-only';

const METALS={'G14KWG':'14K White Gold','G18KWG':'18K White Gold','G14KYG':'14K Yellow Gold','G18KYG':'18K Yellow Gold','G14KRG':'14K Rose Gold','G18KRG':'18K Rose Gold','SL925':'Sterling Silver','SL925YG VERMEIL':'Silver Vermeil','SL925WSL':'Silver','G10KWG':'10K White Gold','P950':'Platinum 950','SL999':'Fine Silver','G18KYG':'18K Yellow Gold'};

function fmt(n){return n!=null?'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function readStore(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch(e){return fallback;}}
function writeStore(key,val){localStorage.setItem(key,JSON.stringify(val));}
function getCloudCfg(){
  const cfg=(window.VIANNE_CLOUD_CONFIG||{});
  return {
    enabled:!!cfg.enabled,
    appName:cfg.appName||'vianne-jck-cloud',
    pathPrefix:cfg.pathPrefix||'vianne-jck-2026',
    firebaseConfig:cfg.firebaseConfig||null
  };
}
function getDeviceId(){
  let id=localStorage.getItem(STORAGE_KEYS.deviceId);
  if(!id){
    id='DV-'+Math.random().toString(36).slice(2,8).toUpperCase()+'-'+Date.now().toString(36).slice(-4).toUpperCase();
    localStorage.setItem(STORAGE_KEYS.deviceId,id);
  }
  return id;
}
function nowIso(){return new Date().toISOString();}
function makeEventId(){
  return `${getDeviceId()}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}
async function initCloudSync(){
  const cfg=getCloudCfg();
  if(!cfg.enabled){cloudStatus='local-only';return false;}
  if(!window.firebase||!cfg.firebaseConfig){
    cloudStatus='cloud-config-missing';
    return false;
  }
  try{
    let appInstance;
    try{
      appInstance=firebase.app(cfg.appName);
    }catch(e){
      appInstance=firebase.initializeApp(cfg.firebaseConfig,cfg.appName);
    }
    cloudDb=appInstance.database();
    cloudReady=true;
    cloudStatus='cloud-ready';
    return true;
  }catch(e){
    console.error('Cloud init failed:',e);
    cloudStatus='cloud-error';
    return false;
  }
}
function cloudPath(part){
  const cfg=getCloudCfg();
  return `${cfg.pathPrefix}/${part}`;
}
function pushCloudEvent(evt){
  if(!cloudReady||!cloudDb) return;
  const eventId=makeEventId();
  cloudDb.ref(`${cloudPath('events')}/${eventId}`).set(evt).catch((e)=>console.error('Cloud event write failed',e));
}
function pushCloudOrder(code,status,updatedAt){
  if(!cloudReady||!cloudDb) return;
  const payload={code,status,updatedAt,deviceId:getDeviceId()};
  cloudDb.ref(`${cloudPath('orders')}/${code}`).set(payload).catch((e)=>console.error('Cloud order write failed',e));
}
async function fetchCloudEvents(){
  if(!cloudReady||!cloudDb) return [];
  try{
    const snap=await cloudDb.ref(cloudPath('events')).limitToLast(5000).once('value');
    const data=snap.val()||{};
    return Object.values(data).filter(Boolean);
  }catch(e){
    console.error('Cloud events fetch failed',e);
    return [];
  }
}
async function fetchCloudOrders(){
  if(!cloudReady||!cloudDb) return {};
  try{
    const snap=await cloudDb.ref(cloudPath('orders')).once('value');
    return snap.val()||{};
  }catch(e){
    console.error('Cloud orders fetch failed',e);
    return {};
  }
}
function dedupeEvents(events){
  const seen=new Set();
  const out=[];
  events.forEach((e)=>{
    const key=[e.ts,e.deviceId,e.type,e.code].join('|');
    if(seen.has(key)) return;
    seen.add(key);
    out.push(e);
  });
  return out;
}
function logEvent(type,code,meta){
  const evt={ts:nowIso(),deviceId:getDeviceId(),type,code,meta:meta||{}};
  const events=readStore(STORAGE_KEYS.events,[]);
  events.push(evt);
  if(events.length>MAX_EVENTS) events.splice(0,events.length-MAX_EVENTS);
  writeStore(STORAGE_KEYS.events,events);
  pushCloudEvent(evt);
}
function getOrders(){return readStore(STORAGE_KEYS.orders,{});}
function getOrder(code){return getOrders()[code]||null;}
function setOrderStatus(code,status){
  const orders=getOrders();
  if(status==='clear'){
    delete orders[code];
  } else {
    orders[code]={status,updatedAt:nowIso()};
  }
  writeStore(STORAGE_KEYS.orders,orders);
  logEvent('status_change',code,{status});
  pushCloudOrder(code,status==='clear'?'clear':status,nowIso());
  if(cur&&cur.unique_code===code) render();
  const msg=status==='clear'?'Status cleared':status==='need_order'?'Marked: Need to Order':'Marked: Delivered';
  showStatus('✓ '+msg+' — '+code,'ok');
}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));}

function onCode(v){
  const q=v.trim().toUpperCase();
  const list=document.getElementById('acList');
  acIdx=-1;
  if(q.length<2){list.style.display='none';clearResult();return;}
  const m=ALL.filter(c=>{try{return c.includes(q)||(ITEMS[c].style_code||'').toUpperCase().includes(q)||(ITEMS[c].design||'').toUpperCase().includes(q)||(ITEMS[c].collection||'').toUpperCase().includes(q);}catch(e){return false;}}).slice(0,10);
  if(!m.length){list.style.display='none';return;}
  list.innerHTML=m.map(c=>{const it=ITEMS[c];return`<li onclick="pick('${c}')">${c}<small>${it.design} · ${it.collection} · ${it.style_code}</small></li>`;}).join('');
  list.style.display='block';
  if(ITEMS[q])showItem(q);
}
function onKey(e){
  const list=document.getElementById('acList');
  const its=list.querySelectorAll('li');
  if(!its.length)return;
  if(e.key==='ArrowDown'){acIdx=Math.min(acIdx+1,its.length-1);hl(its);e.preventDefault();}
  else if(e.key==='ArrowUp'){acIdx=Math.max(acIdx-1,0);hl(its);e.preventDefault();}
  else if(e.key==='Enter'){if(acIdx>=0)its[acIdx].click();else{const q=document.getElementById('codeInput').value.trim().toUpperCase();if(ITEMS[q])pick(q);else{showStatus('Code not found','err');clearResult();}}}
  else if(e.key==='Escape')list.style.display='none';
}
function hl(its){its.forEach((li,i)=>li.classList.toggle('hi',i===acIdx));}
function pick(c){document.getElementById('codeInput').value=c;document.getElementById('acList').style.display='none';showItem(c);}
function showItem(c){
  const it=ITEMS[c];
  if(!it){showStatus('Code not found','err');clearResult();return;}
  cur=it;ovr=null;
  document.getElementById('priceInput').value='';
  logEvent('search',it.unique_code,{design:it.design,collection:it.collection,style_code:it.style_code});
  try{
    render();
    showStatus('✓ Found: '+it.design+' — '+it.collection,'ok');
  } catch(e){
    showStatus('Error displaying item. Please try again.','err');
    console.error('Render error:',e);
  }
  // Scroll to result on mobile
  if(window.innerWidth < 740){
    setTimeout(()=>{
      const el=document.getElementById('rc');
      if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
    },100);
  }
  document.getElementById('codeInput').className='found';
}
function overridePrice(v){if(!cur)return;ovr=v?parseFloat(v):null;render();}
function clearResult(){cur=null;document.getElementById('rc').classList.remove('show');document.getElementById('emptyState').style.display='';document.getElementById('codeInput').className='';}
function showStatus(msg,t){const el=document.getElementById('statusMsg');el.textContent=msg;el.className='status show '+t;}

function render(){
  const it=cur;
  const dp=ovr!=null?ovr:(it.round_off||it.sale_price_calc);
  const m=it.margin;
  const mpct=m?Math.round((1-m)*100):null;
  const flbl=m?`Today Cost + Tariffs ÷ ${m} (${mpct}% margin)`:'Formula N/A';
  const totalCts=(it.stones||[]).reduce((s,st)=>s+(st.cts||0),0);
  const imgSrc=IMGS[it.unique_code.toUpperCase()]||'';
  const ord=getOrder(it.unique_code);
  const ordText=ord?(ord.status==='need_order'?'Need to Order':'Delivered'):'Not set';

  document.getElementById('emptyState').style.display='none';
  const card=document.getElementById('rc');
  card.classList.add('show');

  const imgHtml = imgSrc
    ? `<img src="${imgSrc}" alt="${it.unique_code}" loading="lazy"/>`
    : `<div class="no-img"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.2" opacity=".5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg><span>No image</span></div>`;

  card.innerHTML=`
<div class="ch">
  <div><h2>${it.unique_code}</h2><div class="sc">Style: ${it.style_code}</div></div>
  <span class="badge">${it.design}</span>
</div>
<div class="track-row">
  <div class="track-status">Order Status: <strong>${ordText}</strong></div>
  <div class="track-actions">
    <button class="mini-btn" onclick="setOrderStatus('${it.unique_code}','need_order')">Need to Order</button>
    <button class="mini-btn" onclick="setOrderStatus('${it.unique_code}','delivered')">Delivered</button>
    <button class="mini-btn ghost" onclick="setOrderStatus('${it.unique_code}','clear')">Clear</button>
  </div>
</div>
<div class="ci">${imgHtml}</div>
<div class="cb">
  <div class="ps">
    <div class="ph">
      <div class="ph-lbl">Final Sale Price</div>
      <div class="ph-row">
        <span class="ph-val">${dp!=null&&!isNaN(dp)?'$'+Number(dp).toLocaleString():'—'}</span>
        <span class="ph-src">${ovr!=null?'custom override':'price list'}</span>
      </div>
      <div class="ph-form">${flbl}</div>
    </div>
    <div class="pt">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      Pricing Breakdown
    </div>
    <div class="pg">
      <div><div class="pk">Today Cost</div><div class="pv">${fmt(it.today_cost)}</div></div>
      <div><div class="pk">Inward Value</div><div class="pv">${fmt(it.inward_value)}</div></div>
      <div><div class="pk">Today Cost + Tariffs</div><div class="pv">${fmt(it.today_cost_tariff)}</div><div class="pf">× 1.10</div></div>
      <div><div class="pk">Inward + Tariffs</div><div class="pv">${fmt(it.inward_tariff)}</div><div class="pf">× 1.10</div></div>
      <div><div class="pk">Calc. Sale Price</div><div class="pv">${fmt(it.sale_price_calc)}</div></div>
      <div><div class="pk">Margin</div><div class="pv">${mpct!=null?mpct+'%':'—'}</div></div>
    </div>
  </div>
  <div class="dg">
    <div><div class="dk">Collection</div><div class="dv">${it.collection||'—'}</div></div>
    <div><div class="dk">Metal</div><div class="dv">${METALS[it.kt_col]||it.kt_col}</div></div>
    <div><div class="dk">Size</div><div class="dv">${it.size&&it.size!=='NONE'?it.size:'—'}</div></div>
    <div><div class="dk">Qty (set)</div><div class="dv">${it.qty}</div></div>
    <div><div class="dk">Gross Wt</div><div class="dv">${it.gross_wt} g</div></div>
    <div><div class="dk">Net Wt</div><div class="dv">${it.net_wt} g</div></div>
    <div><div class="dk">Total Carats</div><div class="dv">${totalCts.toFixed(2)} ct</div></div>
    <div><div class="dk">Total Pcs</div><div class="dv">${(it.stones||[]).reduce((s,st)=>s+(st.pcs||0),0)}</div></div>
  </div>
  <div class="st">💎 Stones</div>
  <div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="stbl">
    <thead><tr><th>Shape</th><th>Color/Clarity</th><th>Pcs</th><th>Cts</th><th>Total Cts</th></tr></thead>
    <tbody>${(it.stones||[]).map(s=>`<tr><td>${s.shape}</td><td>${s.clarity}</td><td>${s.pcs}</td><td>${(s.cts||0).toFixed(2)}</td><td>${s.total_cts!=null?s.total_cts.toFixed(2):'—'}</td></tr>`).join('')}</tbody>
  </table></div>
</div>`;
}

function showInsightsCard(title,bodyHtml){
  document.getElementById('emptyState').style.display='none';
  const card=document.getElementById('rc');
  card.classList.add('show');
  card.innerHTML=`
<div class="ch">
  <div><h2>${esc(title)}</h2><div class="sc">Sales intelligence</div></div>
  <span class="badge">Insights</span>
</div>
<div class="ins-body">
  ${bodyHtml}
</div>`;
}
function openFromHistory(code){
  if(!code) return;
  pick(String(code).toUpperCase());
}

// ── SCANNER VARIABLES ─────────────────────────────────────────────────────
let scanStream = null;
let scanAnimFrame = null;
let lastScanTime = 0;
const SCAN_COOLDOWN = 2000; // ms between scans

function toggleScanner(){
  if(scanOn){stopScanner();return;}
  startScanner();
}

async function startScanner(){
  try {
    const video = document.getElementById('scanVideo');
    const canvas = document.getElementById('scanCanvas');
    const ctx = canvas.getContext('2d');

    // Request camera — prefer rear, high resolution
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width:  { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: { ideal: 'continuous' }
      }
    };

    scanStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = scanStream;
    await video.play();

    document.getElementById('sw').classList.add('on');
    document.getElementById('btnStop').style.display='block';
    document.getElementById('btnScan').textContent='⏹ Scanning…';
    document.getElementById('scanStatus').textContent='Align QR code within the frame';
    scanOn = true;

    // Start QR scan loop
    scanLoop(video, canvas, ctx);

  } catch(err) {
    console.error('Camera error:', err);
    if(err.name === 'NotAllowedError'){
      showStatus('Camera permission denied — please allow camera access in settings.','err');
    } else if(err.name === 'NotFoundError'){
      showStatus('No camera found on this device.','err');
    } else if(err.name === 'OverconstrainedError'){
      // Retry with lower constraints
      try {
        scanStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
        video.srcObject = scanStream;
        await video.play();
        document.getElementById('sw').classList.add('on');
        document.getElementById('btnStop').style.display='block';
        document.getElementById('btnScan').textContent='⏹ Scanning…';
        scanOn = true;
        scanLoop(video, canvas, ctx);
        return;
      } catch(e2){
        showStatus('Camera unavailable. Please type the code manually.','err');
      }
    } else {
      showStatus('Camera error: '+err.message+'. Please type the code manually.','err');
    }
    stopScanner();
  }
}

function scanLoop(video, canvas, ctx){
  if(!scanOn || !video || video.paused || video.ended) return;
  // Safety: jsQR must be available
  if(typeof jsQR === 'undefined'){
    showStatus('Scanner library not loaded. Please check internet connection.','err');
    stopScanner();
    return;
  }

  if(video.readyState === video.HAVE_ENOUGH_DATA){
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width  = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch(e) {
      scanAnimFrame = requestAnimationFrame(() => scanLoop(video, canvas, ctx));
      return;
    }
    const now = Date.now();

    // ── Try jsQR first (best for QR codes on blue tags) ──
    const qrCode = jsQR(imageData.data, w, h, {
      inversionAttempts: 'dontInvert'
    });

    if(qrCode && qrCode.data && now - lastScanTime > SCAN_COOLDOWN){
      const code = qrCode.data.trim().toUpperCase();
      if(code.length >= 4){
        lastScanTime = now;
        onScanSuccess(code, 'QR');
        return;
      }
    }

    // ── Also try inverted (some QR codes are light on dark) ──
    if(!qrCode){
      const qrInv = jsQR(imageData.data, w, h, {
        inversionAttempts: 'onlyInvert'
      });
      if(qrInv && qrInv.data && now - lastScanTime > SCAN_COOLDOWN){
        const code = qrInv.data.trim().toUpperCase();
        if(code.length >= 4){
          lastScanTime = now;
          onScanSuccess(code, 'QR');
          return;
        }
      }
    }
  }

  scanAnimFrame = requestAnimationFrame(() => scanLoop(video, canvas, ctx));
}

function onScanSuccess(code, type){
  // Haptic feedback
  if(navigator.vibrate) navigator.vibrate([50, 30, 50]);

  // Check if it's a known code
  const match = ITEMS[code] || ITEMS[code.replace(/[^A-Z0-9]/g,'')];
  const finalCode = match ? (ITEMS[code] ? code : code.replace(/[^A-Z0-9]/g,'')) : code;

  document.getElementById('codeInput').value = finalCode;
  onCode(finalCode);

  if(match){
    stopScanner();
    showStatus('✓ '+type+' scanned: '+finalCode,'ok');
  } else {
    // Code not in list — reset cooldown so user can try again immediately
    lastScanTime = 0;
    const scanStatusEl = document.getElementById('scanStatus');
    if(scanStatusEl) scanStatusEl.textContent = '⚠ "'+code+'" not in price list — try again';
    setTimeout(()=>{
      if(scanOn && scanStatusEl) scanStatusEl.textContent='Align QR code within the frame';
    }, 2000);
  }
}

function stopScanner(){
  scanOn = false;
  cancelAnimationFrame(scanAnimFrame);

  // Stop camera stream
  if(scanStream){
    scanStream.getTracks().forEach(t => t.stop());
    scanStream = null;
  }

  // Reset video
  const video = document.getElementById('scanVideo');
  if(video){ 
    video.srcObject = null;
    video.load(); // fully reset on iOS
  }

  document.getElementById('sw').classList.remove('on');
  document.getElementById('btnStop').style.display='none';
  document.getElementById('btnScan').innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="5" height="2"/><rect x="16" y="3" width="5" height="2"/><rect x="3" y="19" width="5" height="2"/><rect x="16" y="19" width="5" height="2"/><line x1="3" y1="8" x2="3" y2="16"/><line x1="21" y1="8" x2="21" y2="16"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="10" y1="7" x2="10" y2="17"/><line x1="13" y1="7" x2="13" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/></svg> Scan QR Code / Barcode`;
}
document.addEventListener('click',e=>{if(!e.target.closest('.acw'))document.getElementById('acList').style.display='none';});
document.getElementById('codeInput').focus();

// Global error handler — catches anything missed
window.onerror = function(msg, src, line, col, err){
  console.error('App error:', msg, 'at', src, line+':'+col);
  return false; // don't suppress
};
window.onunhandledrejection = function(e){
  console.error('Unhandled promise rejection:', e.reason);
  // If scanner caused it, clean up
  if(scanOn) stopScanner();
};
// Cleanup scanner on page hide (iOS Safari background)
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden && scanOn) stopScanner();
});
window.addEventListener('pagehide', ()=>{
  stopScanner();
});

function ensureEnhancementStyles(){
  if(document.getElementById('enhancementStyles')) return;
  const st=document.createElement('style');
  st.id='enhancementStyles';
  st.textContent=`
  .top-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}
  .top-tools button{border:1px solid #365e57;background:#123831;color:#dfeee8;padding:7px 10px;border-radius:8px;font-size:12px;cursor:pointer}
  .top-tools button:hover{background:#17463d}
  .track-row{margin:10px 0 8px;padding:10px;border:1px solid rgba(201,168,76,.28);border-radius:10px;background:rgba(10,27,23,.38)}
  .track-status{font-size:13px;color:#cfe3db;margin-bottom:8px}
  .track-actions{display:flex;gap:8px;flex-wrap:wrap}
  .mini-btn{background:#c9a84c;color:#102620;border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer}
  .mini-btn.ghost{background:#293e39;color:#d6e6e0;border:1px solid #4b6961}
  .ins-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
  .ins-btn{border:1px solid #42675f;background:#153d35;color:#d9ebe4;border-radius:8px;padding:6px 10px;cursor:pointer}
  .ins-note{font-size:12px;opacity:.75;margin:6px 0 10px}
  .ins-body{padding-top:6px}
  .ins-btn.on{background:#2a5b50;border-color:#7ea99c}
  .flt-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 10px}
  .flt-custom{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 10px}
  .flt-custom input[type=date]{padding:6px 8px;border-radius:8px;border:1px solid #4e7068;background:#102f29;color:#dfeee8}
  .hist-link{cursor:pointer}
  .hist-link:hover{background:rgba(201,168,76,.12)}
  .chart-wrap{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}
  .chart-card{border:1px solid rgba(119,160,149,.25);border-radius:10px;padding:10px;background:rgba(10,27,23,.22)}
  .chart-title{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#c8dbd5;margin-bottom:8px}
  .chart-box{height:220px;position:relative}
  @media(max-width:740px){.chart-wrap{grid-template-columns:1fr}.chart-box{height:210px}}
  .vx-list{margin:10px 0 0;padding:0;list-style:none}
  .vx-list li{padding:8px 10px;border-bottom:1px solid rgba(119,160,149,.2);font-size:13px}
  .vx-empty{opacity:.72;font-size:13px;padding:8px 0}
  `;
  document.head.appendChild(st);
}
function sameDay(ts,yyyyMmDd){return ts.slice(0,10)===yyyyMmDd;}
function todayKey(){return new Date().toISOString().slice(0,10);}
const FILTER_STATE={mode:'today',from:'',to:''};
function daysAgoKey(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);}
function normalizeDateInput(v){return String(v||'').slice(0,10);}
function inSelectedRange(ts){
  const day=String(ts||'').slice(0,10);
  const mode=FILTER_STATE.mode;
  if(mode==='today') return day===todayKey();
  if(mode==='last7') return day>=daysAgoKey(6) && day<=todayKey();
  const from=normalizeDateInput(FILTER_STATE.from)||daysAgoKey(6);
  const to=normalizeDateInput(FILTER_STATE.to)||todayKey();
  return day>=from && day<=to;
}
function currentRangeText(){
  if(FILTER_STATE.mode==='today') return `Today (${todayKey()})`;
  if(FILTER_STATE.mode==='last7') return `Last 7 Days (${daysAgoKey(6)} to ${todayKey()})`;
  const from=normalizeDateInput(FILTER_STATE.from)||daysAgoKey(6);
  const to=normalizeDateInput(FILTER_STATE.to)||todayKey();
  return `Custom (${from} to ${to})`;
}
function setFilterMode(mode){
  FILTER_STATE.mode=mode;
  if(mode==='today'||mode==='last7'){FILTER_STATE.from='';FILTER_STATE.to='';}
  if(mode==='custom'){
    if(!FILTER_STATE.from) FILTER_STATE.from=daysAgoKey(6);
    if(!FILTER_STATE.to) FILTER_STATE.to=todayKey();
  }
}
function setCustomRange(){
  const fromEl=document.getElementById('fltFrom');
  const toEl=document.getElementById('fltTo');
  if(fromEl) FILTER_STATE.from=normalizeDateInput(fromEl.value);
  if(toEl) FILTER_STATE.to=normalizeDateInput(toEl.value);
}
function buildRangeControls(reloadFnName){
  const isCustom=FILTER_STATE.mode==='custom';
  const from=normalizeDateInput(FILTER_STATE.from)||daysAgoKey(6);
  const to=normalizeDateInput(FILTER_STATE.to)||todayKey();
  return `
  <div class="flt-row">
    <button class="ins-btn ${FILTER_STATE.mode==='today'?'on':''}" onclick="setFilterMode('today');${reloadFnName}()">Today</button>
    <button class="ins-btn ${FILTER_STATE.mode==='last7'?'on':''}" onclick="setFilterMode('last7');${reloadFnName}()">Last 7 Days</button>
    <button class="ins-btn ${FILTER_STATE.mode==='custom'?'on':''}" onclick="setFilterMode('custom');${reloadFnName}()">Custom</button>
  </div>
  <div class="flt-custom" style="display:${isCustom?'flex':'none'}">
    <input id="fltFrom" type="date" value="${from}"/>
    <span>to</span>
    <input id="fltTo" type="date" value="${to}"/>
    <button class="ins-btn" onclick="setCustomRange();${reloadFnName}()">Apply</button>
  </div>`;
}
function buildHistoryHtml(events,title){
  if(!events.length)return '<div class="vx-empty">No lookups found.</div>';
  return `<ul class="vx-list">${events.map(e=>`<li class="hist-link" onclick="openFromHistory('${esc(String(e.code).replace(/'/g,"\\'"))}')"><strong>${esc(e.code)}</strong> — ${esc(e.meta.design||'')} <br><small>${new Date(e.ts).toLocaleString()}</small></li>`).join('')}</ul>`;
}
async function showHistory(){
  const localEvents=readStore(STORAGE_KEYS.events,[]).filter(e=>e.type==='search');
  const cloudEvents=await fetchCloudEvents();
  const all=(cloudEvents.length?cloudEvents:localEvents).filter(e=>e.type==='search').filter(e=>inSelectedRange(e.ts)).slice(-200).reverse();
  const mode=cloudEvents.length?'All Devices':'This Device';
  showInsightsCard(
    `${mode} Lookup History`,
    `<div class="ins-head"><div class="ins-note">Range: ${currentRangeText()}</div><button class="ins-btn" onclick="clearResult()">Back</button></div>${buildRangeControls('showHistory')}${buildHistoryHtml(all)}`
  );
}
function buildAnalyticsHtml(events,orders,mode){
  const counts={};
  events.forEach(e=>{counts[e.code]=(counts[e.code]||0)+1;});
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20);
  const ordSummary={need_order:0,delivered:0};
  Object.values(orders).forEach(o=>{if(o.status==='need_order')ordSummary.need_order++; if(o.status==='delivered')ordSummary.delivered++;});
  const topHtml=top.length?`<ul class="vx-list">${top.map(([code,c])=>`<li><strong>${esc(code)}</strong> — searched ${c} times</li>`).join('')}</ul>`:'<div class="vx-empty">No search analytics yet.</div>';
  return `<div>
    <div><strong>Scope:</strong> ${esc(mode)}</div>
    <div class="chart-wrap">
      <div class="chart-card">
        <div class="chart-title">Product Type Mix</div>
        <div class="chart-box"><canvas id="typePie"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Design Family Mix</div>
        <div class="chart-box"><canvas id="familyPie"></canvas></div>
      </div>
    </div>
    <div style="margin-top:8px"><strong>Top Searched Products</strong></div>
    ${topHtml}
    <div style="margin-top:12px"><strong>Order Status Summary</strong></div>
    <ul class="vx-list"><li>Need to Order: ${ordSummary.need_order}</li><li>Delivered: ${ordSummary.delivered}</li></ul>
  </div>`;
}
function guessProductType(item){
  const t=`${item?.design||''} ${item?.collection||''} ${item?.style_code||''}`.toLowerCase();
  if(/ring|rng|band/.test(t)) return 'Rings';
  if(/bracelet|brc|bangle|cuff/.test(t)) return 'Bracelets';
  if(/earring|ear|stud|hoop|drop/.test(t)) return 'Earrings';
  if(/chain|necklace|pendant|choker/.test(t)) return 'Chains/Necklaces';
  return 'Other';
}
function guessDesignFamily(item){
  const t=`${item?.design||''} ${item?.collection||''}`.toLowerCase();
  if(/linq|link/.test(t)) return 'Linq/Link';
  if(/bezel/.test(t)) return 'Bezel';
  if(/classic/.test(t)) return 'Classic';
  if(/vintage|heritage/.test(t)) return 'Vintage';
  return 'Other';
}
function buildPieCounts(events){
  const byType={};
  const byFamily={};
  events.forEach((e)=>{
    const item=ITEMS[e.code]||{design:e.meta?.design||'',collection:e.meta?.collection||'',style_code:e.meta?.style_code||''};
    const t=guessProductType(item);
    const f=guessDesignFamily(item);
    byType[t]=(byType[t]||0)+1;
    byFamily[f]=(byFamily[f]||0)+1;
  });
  return {byType,byFamily};
}
async function ensureChartJs(){
  if(window.Chart) return;
  await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js');
}
let analyticsTypeChart=null;
let analyticsFamilyChart=null;
async function renderAnalyticsCharts(events){
  const typeCanvas=document.getElementById('typePie');
  const familyCanvas=document.getElementById('familyPie');
  if(!typeCanvas||!familyCanvas) return;
  if(!events.length) return;
  await ensureChartJs();
  const {byType,byFamily}=buildPieCounts(events);
  const palette=['#C9A87C','#2A7A63','#7DAA9E','#E2C98A','#8AA9A0','#4D6B62','#A07840'];
  if(analyticsTypeChart) analyticsTypeChart.destroy();
  if(analyticsFamilyChart) analyticsFamilyChart.destroy();
  analyticsTypeChart=new Chart(typeCanvas,{
    type:'pie',
    data:{labels:Object.keys(byType),datasets:[{data:Object.values(byType),backgroundColor:palette}]},
    options:{plugins:{legend:{labels:{color:'#dbe9e4'}}}}
  });
  analyticsFamilyChart=new Chart(familyCanvas,{
    type:'pie',
    data:{labels:Object.keys(byFamily),datasets:[{data:Object.values(byFamily),backgroundColor:palette}]},
    options:{plugins:{legend:{labels:{color:'#dbe9e4'}}}}
  });
}
async function showAnalytics(){
  const localEvents=readStore(STORAGE_KEYS.events,[]).filter(e=>e.type==='search');
  const cloudEvents=await fetchCloudEvents();
  const cloudOrders=await fetchCloudOrders();
  const useCloud=cloudEvents.length>0||Object.keys(cloudOrders).length>0;
  const events=(useCloud?dedupeEvents(cloudEvents):localEvents).filter(e=>e.type==='search').filter(e=>inSelectedRange(e.ts));
  const orders=useCloud?cloudOrders:getOrders();
  showInsightsCard(
    useCloud?'All Devices Analytics':'Device Analytics',
    `<div class="ins-head"><div class="ins-note">Range: ${currentRangeText()}</div><div><button class="ins-btn" onclick="downloadDailyExcel()">Download Excel</button> <button class="ins-btn" onclick="clearResult()">Back</button></div></div>${buildRangeControls('showAnalytics')}${buildAnalyticsHtml(events,orders,useCloud?'All Devices':'This Device')}`
  );
  renderAnalyticsCharts(events).catch((e)=>console.error('Analytics chart render failed',e));
}
function injectTopTools(){
  ensureEnhancementStyles();
  if(document.getElementById('topTools')) return;
  const codeInput=document.getElementById('codeInput');
  if(!codeInput||!codeInput.parentElement||!codeInput.parentElement.parentElement) return;
  const host=codeInput.parentElement.parentElement;
  const bar=document.createElement('div');
  bar.id='topTools';
  bar.className='top-tools';
  bar.innerHTML=`
    <button onclick="showHistory()">History</button>
    <button onclick="showAnalytics()">Analytics</button>
    <button onclick="downloadDailyExcel()">Download All Devices Excel</button>
  `;
  host.appendChild(bar);
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
}
async function ensureXlsx(){
  if(window.XLSX) return;
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
}
function fallbackCsvDownload(rows,fileName){
  const escCsv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv=rows.map(r=>r.map(escCsv).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=fileName.replace('.xlsx','.csv');
  a.click();
  URL.revokeObjectURL(a.href);
}
async function downloadDailyExcel(){
  const date=todayKey();
  const localEvents=readStore(STORAGE_KEYS.events,[]);
  const cloudEvents=await fetchCloudEvents();
  const cloudOrders=await fetchCloudOrders();
  const useCloud=cloudEvents.length>0||Object.keys(cloudOrders).length>0;
  const events=(useCloud?dedupeEvents(cloudEvents):localEvents).filter(e=>inSelectedRange(e.ts));
  const orders=useCloud?cloudOrders:getOrders();
  const lookupRows=events.filter(e=>e.type==='search').map(e=>[
    e.ts,e.deviceId||getDeviceId(),e.code,e.meta?.design||'',e.meta?.collection||'',e.meta?.style_code||''
  ]);
  const statusRows=Object.entries(orders).map(([code,o])=>[code,o.status,o.updatedAt,o.deviceId||getDeviceId()]);
  const summaryMap={};
  lookupRows.forEach(r=>{summaryMap[r[2]]=(summaryMap[r[2]]||0)+1;});
  const summaryRows=Object.entries(summaryMap).sort((a,b)=>b[1]-a[1]).map(([code,count])=>[code,count]);
  if(!lookupRows.length&&!statusRows.length){
    showStatus('No data yet for today on this device.','err');
    return;
  }
  const rangeSlug=FILTER_STATE.mode==='custom'
    ? `${(normalizeDateInput(FILTER_STATE.from)||daysAgoKey(6)).replace(/-/g,'')}-${(normalizeDateInput(FILTER_STATE.to)||todayKey()).replace(/-/g,'')}`
    : FILTER_STATE.mode==='last7' ? 'last7days' : date;
  const fileName=`vianne-report-${rangeSlug}-${useCloud?'all-devices':'single-device'}.xlsx`;
  try{
    await ensureXlsx();
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['timestamp','device_id','code','design','collection','style_code'],...lookupRows]),'Lookups');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['code','status','updated_at','device_id'],...statusRows]),'OrderStatus');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['code','search_count'],...summaryRows]),'TopSearches');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['cloud_mode',useCloud?'enabled':'disabled'],['cloud_status',cloudStatus],['generated_at',nowIso()],['range',currentRangeText()]]),'Meta');
    XLSX.writeFile(wb,fileName);
    showStatus(`✓ Daily Excel downloaded (${useCloud?'all devices':'this device'})`,'ok');
  } catch(e){
    const rows=[['type','timestamp','device_id','code','design','collection','style_code','status','updated_at']];
    lookupRows.forEach(r=>rows.push(['lookup',r[0],r[1],r[2],r[3],r[4],r[5],'','']));
    statusRows.forEach(r=>rows.push(['status','','',r[0],'','','',r[1],r[2]]));
    fallbackCsvDownload(rows,fileName);
    showStatus('Excel library blocked; downloaded CSV instead.','err');
  }
}
injectTopTools();
initCloudSync().then((ok)=>{
  if(ok){
    showStatus('Cloud sync active: all devices analytics enabled','ok');
  }
});
