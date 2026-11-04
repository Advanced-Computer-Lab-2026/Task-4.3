// Independent Chrome DevTools audit. No npm/browser dependencies are added.
// Run: node scripts/independent-audit.mjs http://127.0.0.1:4175 [--probe|--captures-only]
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const url = process.argv[2] || 'http://127.0.0.1:4175/';
const probe = process.argv.includes('--probe');
const capturesOnly = process.argv.includes('--captures-only');
const out = resolve('docs/audit');
await mkdir(out, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'roomgrid-independent-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=9359', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws, sequence = 0;
const pending = new Map(), errors = [], checks = [];
const requests = new Set(), failedRequests = [];
let browserVersion;
const key = 'acl-roomgrid-18rooms-v1';
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`Timeout: ${method}`)); }, 12000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function js(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function check(name, expression) {
  const actual = typeof expression === 'string' ? await js(expression) : expression;
  const pass = actual === true;
  checks.push({ name, pass, actual });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(actual)}`);
}
async function click(selector) {
  // Real pointer events, including scrolling clipped controls into their container.
  await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'end'})`);
  const point = await js(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();for(const x of [r.x+r.width/2,Math.min(r.right,innerWidth)-4]){const y=r.y+r.height/2;if(e.contains(document.elementFromPoint(x,y)))return {x,y};}throw Error('Pointer target is covered: '+${JSON.stringify(selector)})})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  await delay(100);
}
async function keyboard(key, code = key, modifiers = 0) {
  const virtual = { Enter:13, Tab:9, Escape:27, ArrowLeft:37, ArrowRight:39, Home:36, End:35 }[key];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode:virtual, nativeVirtualKeyCode:virtual, ...(key==='Enter'?{text:'\r'}:{}) });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers, windowsVirtualKeyCode:virtual, nativeVirtualKeyCode:virtual });
  await delay(60);
}
async function set(id, value) {
  await js(`(()=>{const el=document.getElementById(${JSON.stringify(id)});const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await delay(30);
}
async function form(room, start, end, purpose = '') {
  for (const [id, value] of [['room-number', room], ['start-date', start], ['end-date', end], ['purpose', purpose]]) await set(id, value);
}
async function ready() {
  for (let n=0;n<60;n++) { if (await js('!!document.querySelector("#reserve-button")')) return; await delay(100); }
  throw Error('App did not render: '+JSON.stringify(await js('({url:location.href,title:document.title,body:document.body.innerText})')));
}
async function reload() { await send('Page.reload'); await delay(150); await ready(); }
async function reset() { await click('.reset-demo'); }
async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await delay(150);
}
async function shot(name) {
  if (name === 'mobile-stay-search.png') {
    await js(`scrollTo(0,document.querySelector('.finder').getBoundingClientRect().top+scrollY-document.querySelector('.topbar').getBoundingClientRect().height-8)`);
    await delay(100);
  }
  const data = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(out, name), Buffer.from(data.data, 'base64'));
}
const stored = `JSON.parse(localStorage.getItem('${key}'))`;
const unchanged = `${stored}.length===40`;
const missing = 'Complete the room and both dates.';
const order = 'End date must follow start date.';
const overlap = 'This room is already booked for some of those dates.';
const errorIs = text => `document.querySelector('#form-error')?.textContent===${JSON.stringify(text)}`;
try {
  for (let n=0;n<60;n++) { try { if ((await fetch('http://127.0.0.1:9359/json/version')).ok) break; } catch {} await delay(100); }
  const targets = await fetch('http://127.0.0.1:9359/json/list').then(r=>r.json());
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result); }
    if (message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method==='Runtime.consoleAPICalled' && ['error','warning'].includes(message.params.type)) errors.push(message.params);
    if (message.method==='Network.requestWillBeSent') requests.add(message.params.request.url);
    if (message.method==='Network.loadingFailed' && !message.params.canceled) failedRequests.push(message.params.errorText);
  });
  browserVersion = await send('Browser.getVersion');
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await viewport(1440,900);
  await send('Page.navigate',{url}); await ready();
  await Promise.race([js('document.fonts.ready.then(()=>true)'),delay(3000)]);
  await js(`window.__seed=${stored}`);
  const seed = await js(stored);
  const baseline = execFileSync('git',['show','63583cd:src/App.jsx'],{encoding:'utf8'});
  const rows = JSON.parse(baseline.match(/const sampleRows=(\[[\s\S]*?\]);/)[1].replaceAll("'",'"').replace(/,\s*\]/g,']'));
  const original = rows.map(([roomNumber,startDate,endDate,purpose,owner],i)=>({id:`demo-${i+1}`,roomNumber,startDate,endDate,purpose,owner}));
  await check('Exact starter seed retained (40 records, all fields)',JSON.stringify(seed)===JSON.stringify(original));
  await check('Identity, meaningful UI, no error overlay',`document.title==='Dorm Room Booking | ACL UI/UX' && !!document.querySelector('#availability-heading') && !document.querySelector('vite-error-overlay')`);
  await check('18 rooms; 8 owned records',`document.querySelectorAll('.roomname').length===18 && ${stored}.filter(b=>b.owner==='you').length===8`);

  if (capturesOnly) {
    await viewport(390,844);
    await set('stay-start','2026-11-11'); await set('stay-end','2026-11-13');
    await shot('mobile-stay-search.png');
    await check('Mobile capture shows all four choices within real 390px viewport',`innerWidth===390 && document.documentElement.scrollWidth===390 && document.querySelectorAll('.room-choice').length===4 && [...document.querySelectorAll('.room-choice')].every(e=>e.getBoundingClientRect().bottom<=844)`);
    await reset();
    await click('[data-room="A1-203"][data-date="2026-11-11"]');
    await check('Open day fills exact one-day request',`document.querySelector('#room-number').value==='A1-203' && document.querySelector('#start-date').value==='2026-11-11' && document.querySelector('#end-date').value==='2026-11-12'`);
    await click('#my-bookings-tab'); await click('.edit-button'); await click('#availability-tab');
    await set('stay-start','2026-11-18'); await set('stay-end','2026-11-21');
    await click('[aria-label="Next week"]');
    await js(`(()=>{const s=document.querySelector('#calendar-room');s.value='A1-203';s.dispatchEvent(new Event('change',{bubbles:true}))})()`); await delay(80);
    await check('Room filter and week navigation alter actual grid',`document.querySelectorAll('.roomname').length===1 && document.querySelector('.roomname strong').textContent==='A1-203' && document.querySelector('.weeknav p').textContent==='16 Nov – 22 Nov'`);
    await click('[data-room="A1-203"][data-date="2026-11-17"]');
    await reset();
    await check('Reset clears actively changed week/filter/search/detail/edit state',`document.querySelector('.weeknav p').textContent==='9 Nov – 15 Nov' && document.querySelector('#calendar-room').value==='All rooms' && document.querySelectorAll('.roomname').length===18 && document.querySelector('#stay-start').value==='' && document.querySelector('#stay-end').value==='' && !document.querySelector('#reservation-detail') && document.querySelector('#booking-heading').textContent==='Make a reservation' && document.querySelector('#room-number').value==='' && ${unchanged}`);
  } else {
  // Reproduce suspect cases independently before applying corrections.
  await viewport(390,844); await click('#my-bookings-tab'); await click('.edit-button');
  const geometry = await js(`({width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,headerBottom:document.querySelector('.topbar').getBoundingClientRect().bottom,heading:document.querySelector('#booking-heading').getBoundingClientRect().toJSON(),focus:document.activeElement.id})`);
  await check('Mobile viewport is 390; edit heading below sticky header',geometry.width===390 && geometry.overflow===0 && geometry.heading.top>=geometry.headerBottom && geometry.focus==='booking-heading');
  console.log('MOBILE_GEOMETRY',JSON.stringify(geometry));
  await shot(probe?'probe-mobile-edit.png':'mobile-edit.png');
  await reset(); await viewport(1440,900);
  await js("document.querySelector('#availability-tab').focus()"); await keyboard('ArrowRight');
  await check('Tablist supports ArrowRight navigation',`document.activeElement.id==='my-bookings-tab' && document.querySelector('#my-bookings-tab').getAttribute('aria-selected')==='true'`);
  await reset(); await form(' a1-203 ','2026-12-01','2026-12-02'); await click('#reserve-button');
  await check('Existing directory room is saved in canonical case',`${stored}.at(-1).roomNumber==='A1-203'`);
  await reset(); await form('D1-101','10000-01-01','9999-01-01'); await click('#reserve-button');
  await check('Extended-year dates do not bypass YYYY-MM-DD contract',`${unchanged} && !!document.querySelector('#form-error')`);
  await form('D1-101','10000-01-01','10000-01-02'); await click('#reserve-button');
  await check('Chronologically ordered extended years rejected before save',`${unchanged} && !!document.querySelector('#form-error')`);
  await reset();
  if (probe) {
    await js(`localStorage.setItem('${key}','[null]')`); await send('Page.reload'); await delay(450);
    await check('Malformed stored array does not crash app',`!!document.querySelector('#reserve-button')`);
    await shot('probe-malformed-storage.png');
  } else {
    // Full validation matrix: each failing attempt must leave storage byte-for-byte intact.
    for (const [name,room,start,end,message,focus] of [
      ['All required fields missing','','','',missing,'room-number'],
      ['Room missing','','2026-12-01','2026-12-02',missing,'room-number'],
      ['Start missing','D1-101','','2026-12-02',missing,'start-date'],
      ['End missing','D1-101','2026-12-01','',missing,'end-date'],
      ['Start equals end','D1-101','2026-12-01','2026-12-01',order,'end-date'],
      ['End before start','D1-101','2026-12-02','2026-12-01',order,'end-date'],
      ['One-day overlap','A1-203','2026-11-10','2026-11-12',overlap,'start-date'],
      ['Fully inside existing','C1-102','2026-11-11','2026-11-12',overlap,'start-date'],
      ['Fully contains existing','A1-203','2026-11-08','2026-11-12',overlap,'start-date'],
      ['Case/whitespace overlap',' a1-203 ','2026-11-09','2026-11-10',overlap,'start-date'],
    ]) {
      await form(room,start,end); const before=await js(`localStorage.getItem('${key}')`);
      await click('#check-availability'); const checkMessage=await js(`document.querySelector('#form-error')?.textContent`);
      await click('#reserve-button');
      await check(name,`${errorIs(message)} && document.activeElement.id==='${focus}' && localStorage.getItem('${key}')===${JSON.stringify(before)}`);
      await check(`${name}: Check and Confirm agree`,checkMessage===message);
      await check(`${name}: invalid control describes error`,`document.getElementById('${focus}').getAttribute('aria-invalid')==='true' && document.getElementById('${focus}').getAttribute('aria-describedby').split(' ').includes('form-error')`);
    }
    await shot('desktop-overlap-error.png');
    await form('A1-203','2026-11-11','2026-11-13');
    await check('Corrections clear stale errors',`!document.querySelector('#form-error') && !document.querySelector('[aria-invalid="true"]')`);
    await click('#reserve-button');
    await check('Adjacent booking accepted at both boundaries; purpose optional',`${stored}.length===41 && ${stored}.at(-1).purpose==='' && document.querySelector('#form-notice').textContent.includes('Room reserved.')`);
    await click('#reserve-button');
    await check('Repeated submit does not duplicate booking',`${stored}.length===41 && ${errorIs(missing)}`);
    await form('D1-101','2026-11-11','2026-11-13'); await click('#reserve-button');
    await check('Another occupied room still rejects identical dates',`${stored}.length===41 && ${errorIs(overlap)}`);
    await form('C2-202','2026-11-11','2026-11-13'); await click('#reserve-button');
    await check('Different-room identical dates do not falsely conflict',`${stored}.length===42 && ${stored}.at(-1).roomNumber==='C2-202'`);
    await reload();
    await check('Refresh after save retains new bookings',`${stored}.length===42 && ${stored}.some(b=>b.roomNumber==='A1-203' && b.startDate==='2026-11-11' && b.owner==='you')`);
    await click('#my-bookings-tab');
    await check('My bookings contains only owned records, including new records',`document.querySelectorAll('.reservation').length===10 && [...document.querySelectorAll('.reservation .room-id')].map(e=>e.textContent).sort().join(',')===${stored}.filter(b=>b.owner==='you').map(b=>b.roomNumber).sort().join(',')`);
    await js(`document.querySelectorAll('.edit-button')[9].click()`); await delay(80);
    await set('purpose','New reservation edited'); await click('#reserve-button');
    await check('Newly created booking can be edited',`${stored}.length===42 && ${stored}.some(b=>b.purpose==='New reservation edited')`);
    await reset();
    await check('Reset restores exact original records',JSON.stringify(await js(stored))===JSON.stringify(original));
    // Whole stay availability independently expanded into occupied days, avoiding reuse of app comparison.
    for (const [start,end] of [['2026-11-11','2026-11-13'],['2026-11-18','2026-11-21'],['2026-11-08','2026-11-22'],['2026-12-01','2026-12-04']]) {
      await set('stay-start',start); await set('stay-end',end);
      const expected=await js(`(()=>{const day=new Date('${start}T00:00:00Z'),end=new Date('${end}T00:00:00Z'),dates=[];for(;day<end;day.setUTCDate(day.getUTCDate()+1)) dates.push(day.toISOString().slice(0,10));return [...document.querySelectorAll('.roomname strong')].map(e=>e.textContent).filter(room=>!${stored}.some(b=>b.roomNumber===room && dates.some(d=>d>=b.startDate && d<b.endDate)))})()`);
      const actual=await js(`[...document.querySelectorAll('.room-choice strong')].map(e=>e.textContent)`);
      await check(`Whole stay ${start} to ${end}`,JSON.stringify(expected)===JSON.stringify(actual));
      if(start==='2026-11-11') { await shot('desktop-stay-search.png'); await click('.room-choice'); await check('Select copies exact search dates',`document.querySelector('#room-number').value==='A1-203' && document.querySelector('#start-date').value==='2026-11-11' && document.querySelector('#end-date').value==='2026-11-13'`); }
    }
    await click('.range-note button'); await check('Outside-week jump preserves full-stay result',`document.querySelector('.weeknav p').textContent==='30 Nov – 6 Dec' && document.querySelectorAll('.room-choice').length===18`);
    await reset();
    await click('[data-room="A1-203"][data-date="2026-11-09"]');
    await check('Booked day gives read-only details; no conflicting draft',`document.querySelector('#room-number').value==='' && document.querySelector('#reservation-detail').textContent.includes('Peer tutoring') && !document.querySelector('#edit-inspected') && document.activeElement.id==='reservation-detail-heading'`);
    await keyboard('Escape');
    await check('Closing details restores source cell focus',`!document.querySelector('#reservation-detail') && document.activeElement.dataset.room==='A1-203'`);
    await click('[data-room="B2-104"][data-date="2026-11-09"]'); await click('#edit-inspected');
    await check('Owned booked day edits exact original reservation',`document.querySelector('#room-number').value==='B2-104' && document.querySelector('#start-date').value==='2026-11-09' && document.querySelector('#end-date').value==='2026-11-11' && document.querySelector('#purpose').value==='Weekly study group' && document.activeElement.id==='booking-heading'`);
    await click('#reserve-button');
    await check('Unchanged edit excludes self; same ID and count',`${unchanged} && ${stored}.filter(b=>b.id==='demo-19').length===1 && document.querySelector('#form-notice').textContent.includes('Booking updated.')`);
    await click('[data-room="B2-104"][data-date="2026-11-09"]'); await click('#edit-inspected');
    await set('stay-start','2026-11-09'); await set('stay-end','2026-11-11');
    await check('Availability excludes edited reservation but includes other conflicts',`[...document.querySelectorAll('.room-choice strong')].some(e=>e.textContent==='B2-104') && ![...document.querySelectorAll('.room-choice strong')].some(e=>e.textContent==='A1-203')`);
    await click('.cancel-edit');
    await click('#my-bookings-tab');
    await js(`[...document.querySelectorAll('.reservation')].find(e=>e.querySelector('.room-id').textContent==='B2-104').querySelector('button').click()`); await delay(80);
    await set('end-date','2026-11-14'); await click('#reserve-button');
    await check('Edit into another range rejected without mutation',`${errorIs(overlap)} && ${stored}.find(b=>b.id==='demo-19').endDate==='2026-11-11'`);
    await set('end-date','2026-11-13'); await click('#reserve-button');
    await check('Edit exclusive last day adjacent to next booking accepted',`${stored}.find(b=>b.id==='demo-19').endDate==='2026-11-13' && ${unchanged}`);
    await js(`[...document.querySelectorAll('.reservation')].find(e=>e.querySelector('.room-id').textContent==='B2-104').querySelector('button').click()`); await delay(80);
    await set('start-date','2026-11-08'); await click('#reserve-button');
    await check('Edit first day accepted',`${stored}.find(b=>b.id==='demo-19').startDate==='2026-11-08'`);
    await click('.edit-button'); await set('purpose','UNSAVED'); await reload();
    await check('Refresh during edit drops only unsaved draft',`document.querySelector('#booking-heading').textContent==='Make a reservation' && !${stored}.some(b=>b.purpose==='UNSAVED') && ${stored}.find(b=>b.id==='demo-19').startDate==='2026-11-08'`);
    await click('#my-bookings-tab'); await click('.edit-button'); await set('purpose','CANCELLED'); await click('.cancel-edit');
    await check('Cancel clears draft and returns focus',`document.activeElement.id==='my-bookings-heading' && document.querySelector('#room-number').value==='' && !${stored}.some(b=>b.purpose==='CANCELLED')`);
    await click('.edit-button'); await reset();
    await check('Reset clears edit/search/detail/filter state',`document.querySelector('#booking-heading').textContent==='Make a reservation' && document.querySelector('#room-number').value==='' && document.querySelector('#stay-start').value==='' && document.querySelector('#calendar-room').value==='All rooms' && !document.querySelector('#reservation-detail')`);
    await check('Reset after modifications is byte-equivalent to starter',JSON.stringify(await js(stored))===JSON.stringify(original));
    await reload(); await check('Reset survives refresh',JSON.stringify(await js(stored))===JSON.stringify(original));
    await viewport(390,844); await js('scrollTo(0,0)'); await shot('mobile-availability.png');
    console.log('MOBILE_LAYOUT',JSON.stringify(await js(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('.main-nav button')].map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})),overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth && getComputedStyle(e).position!=='absolute').slice(0,12).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))})`)));
    await check('Mobile real viewport, no page overflow; navigation targets >=44px',`innerWidth===390 && innerHeight===844 && document.documentElement.scrollWidth===390 && [...document.querySelectorAll('.main-nav button')].every(e=>e.getBoundingClientRect().height>=44)`);
    await set('stay-start','2026-11-11'); await set('stay-end','2026-11-13'); await shot('mobile-stay-search.png');
    await click('.room-choice'); await check('Mobile select makes form heading visible',`document.querySelector('#booking-heading').getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom`);
    await click('#my-bookings-tab'); await js('scrollTo(0,0)'); await shot('mobile-my-bookings.png');
    await click('.edit-button'); await shot('mobile-edit.png');
    await click('.cancel-edit'); await check('Mobile cancel heading is not hidden by header',`document.querySelector('#my-bookings-heading').getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom`);
    await reset(); await viewport(1440,900); await click('#my-bookings-tab'); await js('scrollTo(0,0)'); await shot('desktop-my-bookings.png');
    await click('.edit-button'); await shot('desktop-edit.png'); await click('.cancel-edit');
    await form('C2-202','2026-11-11','2026-11-13','Independent successful action'); await click('#reserve-button'); await shot('desktop-success.png');
    // Keyboard activation and semantic relationships.
    await js("document.querySelector('#availability-tab').focus()"); await keyboard('End');
    await check('Tablist End selects My bookings',`document.activeElement.id==='my-bookings-tab' && document.querySelector('#my-bookings-tab').getAttribute('aria-selected')==='true'`);
    await keyboard('Home'); await check('Tablist Home selects Availability',`document.activeElement.id==='availability-tab' && document.querySelector('#availability-tab').getAttribute('aria-selected')==='true'`);
    await keyboard('ArrowLeft'); await check('Tablist wraps with ArrowLeft',`document.activeElement.id==='my-bookings-tab'`);
    await js("document.querySelector('.edit-button').focus()"); await keyboard('Enter');
    console.log('KEYBOARD_EDIT',JSON.stringify(await js(`({focus:document.activeElement.id,tag:document.activeElement.outerHTML,heading:document.querySelector('#booking-heading').textContent,cancel:!!document.querySelector('.cancel-edit')})`)));
    await check('Keyboard Edit opens editor',`document.activeElement.id==='booking-heading' && document.querySelector('.cancel-edit')!==null`);
    await check('All description references resolve',`[...document.querySelectorAll('[aria-describedby]')].every(e=>e.getAttribute('aria-describedby').split(' ').every(id=>document.getElementById(id)))`);
    // Real Tab traversal through each view at desktop and mobile sizes.
    for (const [width,height] of [[1440,900],[390,844]]) {
      await viewport(width,height); await reset();
      for (const view of ['#availability-tab','#my-bookings-tab']) {
        await click(view); await js(`document.querySelector(${JSON.stringify(view)}).focus()`);
        const visited=new Set(), bad=[];
        for(let i=0;i<190;i++) {
          await keyboard('Tab');
          const state=await js(`(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),header=document.querySelector('.topbar').getBoundingClientRect();return {id:e.id,tag:e.tagName,key:e.id||e.getAttribute('data-room')+' '+e.getAttribute('data-date')||e.className,visible:r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth,covered:!e.closest('.topbar')&&!e.matches('.skip')&&r.bottom<=header.bottom,outline:getComputedStyle(e).outlineStyle}})()`);
          if(state.tag==='BODY') break;
          visited.add(state.key);
          if(!state.visible || state.covered || state.outline==='none') bad.push(state);
          if(state.id===view.slice(1)) break;
        }
        await check(`Keyboard Tab walk ${width}px ${view}`,visited.size>5 && visited.has('reserve-button') && bad.length===0);
        if(bad.length) console.log('TAB_WALK_ISSUES',JSON.stringify(bad.slice(0,8)));
      }
    }
    await reset(); await viewport(1440,900);
    const contrast = await js(`(()=>{
      const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
      const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const bad=[];let checked=0;
      for(const e of document.querySelectorAll('body *')){
        if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||!e.getBoundingClientRect().width)continue;
        const s=getComputedStyle(e),fg=rgb(s.color);let node=e,bg;
        while(node){bg=rgb(getComputedStyle(node).backgroundColor);if(bg.length===3||bg[3]===1)break;node=node.parentElement;}
        if(!node)bg=[255,255,255];
        const ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
        const large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700);
        checked++;if(ratio<(large?3:4.5))bad.push({text:e.textContent.slice(0,45),ratio,color:s.color,background:bg});
      }return {checked,bad};})()`);
    await writeFile(join(out,'contrast.json'),JSON.stringify(contrast,null,2));
    await check('Rendered text contrast meets AA thresholds in initial desktop view',contrast.checked>100 && contrast.bad.length===0);
    for (const timezoneId of ['America/Los_Angeles','Pacific/Kiritimati','Africa/Cairo']) { await send('Emulation.setTimezoneOverride',{timezoneId}); await reset(); await click('[data-room="B2-104"][data-date="2026-11-09"]'); await check(`Date-only display stable in ${timezoneId}`,`document.querySelector('#reservation-detail').textContent.includes('In use 9 Nov 2026 – 10 Nov 2026. Free from 11 Nov 2026.')`); }
    await reset();
    // Storage failures: do not overwrite or silently discard malformed existing data.
    await js(`localStorage.setItem('${key}','[null]')`); await reload();
    await check('Malformed storage is preserved with recovery feedback',`localStorage.getItem('${key}')==='[null]' && !!document.querySelector('[role="alert"]') && !!document.querySelector('#reserve-button')`);
    await reset();
    await js(`localStorage.setItem('${key}','{bad json')`); await reload();
    await check('Invalid JSON is preserved with recovery feedback',`localStorage.getItem('${key}')==='{bad json' && !!document.querySelector('[role="alert"]')`);
    await reset();
    await js(`window.__originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}`);
    await form('A1-203','2026-12-01','2026-12-02'); await click('#reserve-button');
    await check('Storage write failure is explicit; failed save keeps original data and draft',`${unchanged} && !!document.querySelector('[role="alert"]') && document.querySelector('#start-date').value==='2026-12-01' && !document.querySelector('#form-notice')`);
    await js('Storage.prototype.setItem=window.__originalSet'); await reset();
  }
  }
  await check('No application runtime errors or console warnings', errors.length===0);
} catch(error) { checks.push({name:'Harness completion',pass:false,actual:String(error)});console.error(error);try{await shot('harness-failure.png')}catch{} }
finally {
  await writeFile(join(out,capturesOnly?'capture-results.json':probe?'probe-results.json':'results.json'),JSON.stringify({date:'2026-11-04',url,browser:'Chrome via CDP; Browser plugin and Playwright unavailable',browserVersion,viewports:['1440x900','390x844'],checks,errors,requests:[...requests],failedRequests},null,2));
  try { await send('Browser.close'); } catch {}
  ws?.close();
  await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),delay(2500)]);
  if(chrome.exitCode===null) chrome.kill();
  try {
    if(resolve(dirname(profile))!==resolve(tmpdir())||!basename(profile).startsWith('roomgrid-independent-'))throw Error('Unexpected profile path');
    await rm(profile,{recursive:true,force:true,maxRetries:15,retryDelay:150});
  } catch(error) { console.warn('Temporary Chrome profile cleanup:',error.message); }
}
console.log(`RESULT ${checks.filter(c=>c.pass).length}/${checks.length}`);
process.exitCode=checks.every(c=>c.pass)?0:1;
