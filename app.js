const ALL=Object.keys(ITEMS);
let cur=null,ovr=null,acIdx=-1,scanOn=false;

const METALS={'G14KWG':'14K White Gold','G18KWG':'18K White Gold','G14KYG':'14K Yellow Gold','G18KYG':'18K Yellow Gold','G14KRG':'14K Rose Gold','G18KRG':'18K Rose Gold','SL925':'Sterling Silver','SL925YG VERMEIL':'Silver Vermeil','SL925WSL':'Silver','G10KWG':'10K White Gold','P950':'Platinum 950','SL999':'Fine Silver','G18KYG':'18K Yellow Gold'};

function fmt(n){return n!=null?'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}

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
