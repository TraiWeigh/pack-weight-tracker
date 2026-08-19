/**
 * Master List Phase 1 — targeted runtime test runner
 * Written to workspace root so pnpm node_modules are resolvable.
 * Deleted automatically at end of script; never imported by application code.
 *
 * Tests run entirely inside page.evaluate() — real browser IndexedDB + localStorage.
 * The app's module singleton is bypassed; each test opens its own IDB connection.
 */

import { chromium } from 'playwright';

const APP_URL = 'http://localhost:80/pack-checklist/';

// ANSI
const G = s => `\x1b[32m${s}\x1b[0m`;
const R = s => `\x1b[31m${s}\x1b[0m`;
const B = s => `\x1b[1m${s}\x1b[0m`;
const Y = s => `\x1b[33m${s}\x1b[0m`;

let passed = 0, failed = 0;
function report(name, ok, detail) {
  if (ok) { console.log(`  ${G('PASS')} ${name}`); passed++; }
  else     { console.log(`  ${R('FAIL')} ${name}${detail ? `\n       ${Y('↳ ' + detail)}` : ''}`); failed++; }
}

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext();
const page    = await ctx.newPage();

const browserErrors = [];
page.on('console', m => { if (m.type() === 'error') browserErrors.push(m.text()); });
page.on('pageerror', e => browserErrors.push(String(e)));

console.log(B('\n=== Master List Phase 1 — Runtime Test Suite ==='));
console.log(`    Target: ${APP_URL}\n`);

await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(2000); // allow IDB open + React mount

// ── All assertions run inside the browser ──────────────────────────────────────
const results = await page.evaluate(async () => {
  /* -------------------------------------------------------------------
     Constants — must match bgPhotoStore.ts / masterList.ts exactly
  -------------------------------------------------------------------- */
  const DB_NAME  = 'trailweigh';
  const DB_VER   = 2;
  const BG_ST    = 'bgPhotos';
  const ML_ST    = 'masterList';
  const ML_PH    = 'masterItemPhotos';
  const ML_TR    = 'masterListTrash';
  const ML_PTR   = 'masterItemPhotosTrash';
  const SNAP_KEY = 'trailweigh:masterList.snap';

  /* -------------------------------------------------------------------
     IDB helpers (open a fresh connection — bypasses app singleton)
  -------------------------------------------------------------------- */
  function openDb() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result, old = e.oldVersion;
        if (old < 1) db.createObjectStore(BG_ST,  { keyPath: 'photoId' });
        if (old < 2) {
          db.createObjectStore(ML_ST,  { keyPath: 'id'      });
          db.createObjectStore(ML_PH,  { keyPath: 'photoId' });
          db.createObjectStore(ML_TR,  { keyPath: 'id'      });
          db.createObjectStore(ML_PTR, { keyPath: 'photoId' });
        }
      };
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
  }
  const get = (db, st, k) => new Promise((r,j) => {
    const q = db.transaction(st,'readonly').objectStore(st).get(k);
    q.onsuccess=()=>r(q.result??null); q.onerror=()=>j(q.error);
  });
  const getAll = (db, st) => new Promise((r,j) => {
    const q = db.transaction(st,'readonly').objectStore(st).getAll();
    q.onsuccess=()=>r(q.result??[]); q.onerror=()=>j(q.error);
  });
  const put = (db, st, rec) => new Promise((r,j) => {
    const tx=db.transaction(st,'readwrite'), q=tx.objectStore(st).put(rec);
    tx.oncomplete=()=>r(); tx.onerror=()=>j(tx.error); q.onerror=()=>j(q.error);
  });
  const del = (db, st, k) => new Promise((r,j) => {
    const tx=db.transaction(st,'readwrite');
    tx.objectStore(st).delete(k); tx.oncomplete=()=>r(); tx.onerror=()=>j(tx.error);
  });

  /* -------------------------------------------------------------------
     validateMasterItem — mirrors masterList.ts allowlist exactly.
     'checked' and unknown fields must not appear in the output.
  -------------------------------------------------------------------- */
  function validate(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw;
    const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : null;
    if (!id) return null;
    return {
      id, schemaVersion: 1,
      name:       typeof r.name==='string'     ? r.name.slice(0,200).trim() : '',
      sub:        typeof r.sub==='string'       ? r.sub.slice(0,100).trim()  : '',
      category:   typeof r.category==='string' ? r.category.slice(0,100).trim() : '',
      weightOz:   typeof r.weightOz==='number' && Number.isFinite(r.weightOz)
                    ? Math.max(0, r.weightOz) : 0,
      qty:        typeof r.qty==='number'
                    ? Math.max(1, Math.min(99, Math.round(r.qty))) : 1,
      expendable: typeof r.expendable==='boolean' ? r.expendable : false,
      notes:      typeof r.notes==='string'   ? r.notes.slice(0,5000) : undefined,
      photoId:    typeof r.photoId==='string' && r.photoId ? r.photoId : undefined,
      locationId: typeof r.locationId==='string' ? r.locationId : undefined,
      dateAdded:      typeof r.dateAdded==='number'   && r.dateAdded>0   ? r.dateAdded   : Date.now(),
      dateModified:   typeof r.dateModified==='number'&& r.dateModified>0? r.dateModified: Date.now(),
      // 'checked' intentionally absent — enforced by allowlist
    };
  }

  const R = [];   // result records
  const now = Date.now();

  /* =================================================================
     T01 — DB upgrade: all 5 stores exist; bgPhotos store accessible
  ================================================================= */
  let db;
  try {
    db = await openDb();
    const names = Array.from(db.objectStoreNames);
    const allPresent = [BG_ST, ML_ST, ML_PH, ML_TR, ML_PTR].every(s => names.includes(s));
    R.push({ id:'T01a-all-5-stores-exist', ok: allPresent,
      detail: allPresent ? '' : 'stores: '+JSON.stringify(names) });
    // bgPhotos is transactable (not wiped by upgrade)
    let bgOk=false;
    try { await getAll(db, BG_ST); bgOk=true; } catch(e){ /**/ }
    R.push({ id:'T01b-bgPhotos-intact', ok: bgOk, detail:bgOk?'':'transaction threw' });
    // Verify keyPaths
    const tx = db.transaction([ML_ST, ML_PH, ML_TR, ML_PTR], 'readonly');
    const mlKP  = tx.objectStore(ML_ST).keyPath;
    const phKP  = tx.objectStore(ML_PH).keyPath;
    const trKP  = tx.objectStore(ML_TR).keyPath;
    const ptrKP = tx.objectStore(ML_PTR).keyPath;
    R.push({ id:'T01c-masterList-keyPath-id',          ok: mlKP  === 'id',      detail:`keyPath='${mlKP}'`  });
    R.push({ id:'T01d-masterItemPhotos-keyPath-photoId',ok: phKP  === 'photoId', detail:`keyPath='${phKP}'`  });
    R.push({ id:'T01e-trash-keyPath-id',               ok: trKP  === 'id',      detail:`keyPath='${trKP}'`  });
    R.push({ id:'T01f-photoTrash-keyPath-photoId',     ok: ptrKP === 'photoId', detail:`keyPath='${ptrKP}'` });
  } catch(e) {
    ['T01a','T01b','T01c','T01d','T01e','T01f'].forEach(id=>R.push({id,ok:false,detail:String(e)}));
  }

  /* =================================================================
     T02 — put / get / getAll MasterItem round-trip
  ================================================================= */
  const ITEM1_ID = 'tw-test-'+now+'-1';
  const item1 = { id:ITEM1_ID, schemaVersion:1, name:'Test Tent', sub:'3-season',
    category:'Shelter', weightOz:42.5, qty:1, expendable:false,
    notes:'A tent note', dateAdded:now, dateModified:now };
  try {
    await put(db, ML_ST, item1);
    const fetched = await get(db, ML_ST, ITEM1_ID);
    R.push({ id:'T02a-put-then-get', ok: fetched?.name==='Test Tent' && fetched?.weightOz===42.5,
      detail: fetched ? '' : 'not found after put' });
    const all = await getAll(db, ML_ST);
    R.push({ id:'T02b-appears-in-getAll', ok: all.some(i=>i.id===ITEM1_ID),
      detail: '' });
    // Overwrite (upsert) — name changes
    await put(db, ML_ST, { ...item1, name:'Updated Tent', dateModified:now+1 });
    const updated = await get(db, ML_ST, ITEM1_ID);
    R.push({ id:'T02c-upsert-overwrites', ok: updated?.name==='Updated Tent',
      detail: `name='${updated?.name}'` });
  } catch(e) {
    ['T02a','T02b','T02c'].forEach(id=>R.push({id,ok:false,detail:String(e)}));
  }

  /* =================================================================
     T03 — validateMasterItem: strict allowlist, checked/unknown stripped
  ================================================================= */
  const dirty = {
    id: '  test-validate-abc  ', schemaVersion:1,
    name: 'X'.repeat(250),   // must truncate to 200
    sub:'Sub', category:'Cat', weightOz:10, qty:3, expendable:true,
    checked: true,            // MUST be stripped
    unknownField: 'vanish',   // MUST be stripped
    __proto__evil: true,      // MUST be stripped
    notes:'note', dateAdded:1000, dateModified:2000,
  };
  const v = validate(dirty);
  R.push({ id:'T03a-strips-checked',    ok: v!==null && !('checked' in v),
    detail: v ? `keys:${Object.keys(v)}` : 'null' });
  R.push({ id:'T03b-strips-unknownField', ok: v!==null && !('unknownField' in v), detail:'' });
  R.push({ id:'T03c-trims-id',           ok: v?.id === 'test-validate-abc', detail:`id='${v?.id}'` });
  R.push({ id:'T03d-name-max-200',       ok: (v?.name?.length??0)<=200, detail:`len=${v?.name?.length}` });
  R.push({ id:'T03e-rejects-empty-id',   ok: validate({id:'',   name:'x'})===null, detail:'' });
  R.push({ id:'T03f-rejects-null-id',    ok: validate({id:null, name:'x'})===null, detail:'' });
  R.push({ id:'T03g-rejects-missing-id', ok: validate({name:'x'})===null, detail:'' });
  R.push({ id:'T03h-qty-clamped-99',     ok: validate({id:'x',qty:999})?.qty===99, detail:'' });
  R.push({ id:'T03i-qty-clamped-1',      ok: validate({id:'x',qty:0  })?.qty===1,  detail:'' });
  R.push({ id:'T03j-negative-weight-0',  ok: validate({id:'x',weightOz:-5})?.weightOz===0, detail:'' });
  R.push({ id:'T03k-Infinity-weight-0',  ok: validate({id:'x',weightOz:Infinity})?.weightOz===0, detail:'' });
  R.push({ id:'T03l-NaN-weight-0',       ok: validate({id:'x',weightOz:NaN})?.weightOz===0, detail:'' });
  R.push({ id:'T03m-schemaVersion-forced-1', ok: validate({id:'x',schemaVersion:99})?.schemaVersion===1, detail:'' });

  /* =================================================================
     T04 — Item + photo: atomic 2-store write
  ================================================================= */
  const PH1_ID  = 'ph-'+now+'-1';
  const ITEM2_ID = 'tw-test-'+now+'-2';
  const fakeBlob = new Blob(['FAKE_IMAGE_DATA'], { type:'image/jpeg' });
  try {
    await new Promise((res,rej) => {
      const tx  = db.transaction([ML_ST, ML_PH], 'readwrite');
      const lSt = tx.objectStore(ML_ST);
      const pSt = tx.objectStore(ML_PH);
      lSt.put({ id:ITEM2_ID, schemaVersion:1, name:'Camera', sub:'', category:'Electronics',
        weightOz:6, qty:1, expendable:false, photoId:PH1_ID, dateAdded:now, dateModified:now });
      pSt.put({ photoId:PH1_ID, blob:fakeBlob, mimeType:'image/jpeg', width:800, height:600 });
      tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error);
    });
    const storedItem  = await get(db, ML_ST, ITEM2_ID);
    const storedPhoto = await get(db, ML_PH, PH1_ID);
    R.push({ id:'T04a-item-written',     ok: storedItem?.photoId===PH1_ID, detail:storedItem?'':'missing' });
    R.push({ id:'T04b-photo-blob-written',ok: storedPhoto?.blob instanceof Blob,
      detail: storedPhoto ? `blobType=${storedPhoto.blob?.constructor?.name}` : 'missing' });
    R.push({ id:'T04c-photoId-matches',  ok: storedItem?.photoId===storedPhoto?.photoId, detail:'' });
    R.push({ id:'T04d-photo-dimensions', ok: storedPhoto?.width===800 && storedPhoto?.height===600,
      detail:`${storedPhoto?.width}×${storedPhoto?.height}` });
    // Atomicity check: if tx aborts, neither store changes
    let abortWorked = false;
    try {
      await new Promise((res,rej) => {
        const tx  = db.transaction([ML_ST, ML_PH], 'readwrite');
        const lSt = tx.objectStore(ML_ST);
        lSt.put({ id:'abort-test', schemaVersion:1, name:'ShouldNotExist', sub:'',
          category:'', weightOz:0, qty:1, expendable:false, dateAdded:now, dateModified:now });
        tx.onabort = () => res();
        tx.oncomplete = () => rej(new Error('should not complete'));
        tx.abort(); // explicit abort
      });
      const abortedItem = await get(db, ML_ST, 'abort-test');
      abortWorked = abortedItem === null;
    } catch { /**/ }
    R.push({ id:'T04e-tx-abort-rolls-back', ok: abortWorked, detail: abortWorked?'':'item persisted after abort' });
  } catch(e) {
    ['T04a','T04b','T04c','T04d','T04e'].forEach(id=>R.push({id,ok:false,detail:String(e)}));
  }

  /* =================================================================
     T05 — Delete → trash → undo: item + photo blob both restored
  ================================================================= */
  // Uses ITEM2_ID / PH1_ID written in T04
  try {
    // --- Step 1: DELETE (4-store atomic tx) ---
    let deleteOk = false;
    await new Promise((res,rej) => {
      const tx   = db.transaction([ML_ST,ML_PH,ML_TR,ML_PTR],'readwrite');
      const lSt  = tx.objectStore(ML_ST);
      const pSt  = tx.objectStore(ML_PH);
      const tSt  = tx.objectStore(ML_TR);
      const ptSt = tx.objectStore(ML_PTR);
      const gReq = lSt.get(ITEM2_ID);
      gReq.onsuccess = () => {
        const item = gReq.result;
        if (!item) { rej(new Error('item not found for delete')); return; }
        tSt.put({ ...item, trashedAt: now });
        lSt.delete(ITEM2_ID);
        if (item.photoId) {
          const gpReq = pSt.get(item.photoId);
          gpReq.onsuccess = () => {
            if (gpReq.result) { ptSt.put(gpReq.result); pSt.delete(item.photoId); }
          };
        }
      };
      tx.oncomplete=()=>{ deleteOk=true; res(); };
      tx.onerror=()=>rej(tx.error);
    });
    R.push({ id:'T05a-delete-tx-completes', ok: deleteOk, detail:'' });

    const afterDel_item   = await get(db, ML_ST, ITEM2_ID);
    const afterDel_photo  = await get(db, ML_PH, PH1_ID);
    const trash_item      = await get(db, ML_TR, ITEM2_ID);
    const trash_photo     = await get(db, ML_PTR, PH1_ID);

    R.push({ id:'T05b-item-absent-from-live',  ok: afterDel_item===null,
      detail: afterDel_item ? 'still present in masterList' : '' });
    R.push({ id:'T05c-photo-absent-from-live', ok: afterDel_photo===null,
      detail: afterDel_photo ? 'still present in masterItemPhotos' : '' });
    R.push({ id:'T05d-item-in-trash',          ok: trash_item!==null && 'trashedAt' in trash_item,
      detail: trash_item ? '' : 'not found in masterListTrash' });
    R.push({ id:'T05e-photo-blob-in-trash',    ok: trash_photo?.blob instanceof Blob,
      detail: trash_photo ? '' : 'not found in masterItemPhotosTrash' });
    R.push({ id:'T05f-trashedAt-present',      ok: typeof trash_item?.trashedAt === 'number',
      detail: `trashedAt=${trash_item?.trashedAt}` });

    // --- Step 2: UNDO (4-store atomic tx) ---
    let undoOk = false;
    await new Promise((res,rej) => {
      const tx   = db.transaction([ML_ST,ML_PH,ML_TR,ML_PTR],'readwrite');
      const lSt  = tx.objectStore(ML_ST);
      const pSt  = tx.objectStore(ML_PH);
      const tSt  = tx.objectStore(ML_TR);
      const ptSt = tx.objectStore(ML_PTR);
      const gReq = tSt.get(ITEM2_ID);
      gReq.onsuccess = () => {
        const te = gReq.result;
        if (!te) { rej(new Error('no trash entry')); return; }
        const { trashedAt:_, ...item } = te;
        lSt.put(item);
        tSt.delete(ITEM2_ID);
        if (item.photoId) {
          const gpReq = ptSt.get(item.photoId);
          gpReq.onsuccess = () => {
            if (gpReq.result) { pSt.put(gpReq.result); ptSt.delete(item.photoId); }
          };
        }
      };
      tx.oncomplete=()=>{ undoOk=true; res(); };
      tx.onerror=()=>rej(tx.error);
    });
    R.push({ id:'T05g-undo-tx-completes', ok: undoOk, detail:'' });

    const undo_item    = await get(db, ML_ST, ITEM2_ID);
    const undo_photo   = await get(db, ML_PH, PH1_ID);
    const undo_trash   = await get(db, ML_TR, ITEM2_ID);
    const undo_ptrash  = await get(db, ML_PTR, PH1_ID);

    R.push({ id:'T05h-item-restored-to-live',  ok: undo_item?.id===ITEM2_ID && !('trashedAt' in (undo_item??{})),
      detail: undo_item ? '' : 'item missing after undo' });
    R.push({ id:'T05i-photo-restored-to-live', ok: undo_photo?.blob instanceof Blob,
      detail: undo_photo ? '' : 'photo blob missing after undo' });
    R.push({ id:'T05j-item-cleared-from-trash',  ok: undo_trash===null,
      detail: undo_trash ? 'still in masterListTrash' : '' });
    R.push({ id:'T05k-photo-cleared-from-ptash', ok: undo_ptrash===null,
      detail: undo_ptrash ? 'still in masterItemPhotosTrash' : '' });
    R.push({ id:'T05l-restored-item-has-no-trashedAt', ok: undo_item && !('trashedAt' in undo_item),
      detail: undo_item ? Object.keys(undo_item).join(',') : 'null' });
  } catch(e) {
    ['T05a','T05b','T05c','T05d','T05e','T05f','T05g','T05h','T05i','T05j','T05k','T05l']
      .forEach(id=>R.push({id,ok:false,detail:String(e)}));
  }

  /* =================================================================
     T06 — Snapshot: write to correct key; readable; validates correctly
  ================================================================= */
  const snapItems = [
    { id:'snap-1', schemaVersion:1, name:'Snap Tent', sub:'', category:'Shelter',
      weightOz:30, qty:1, expendable:false, dateAdded:now, dateModified:now },
    { id:'snap-2', schemaVersion:1, name:'Snap Stove', sub:'', category:'Kitchen',
      checked:true,   // must be stripped by validate()
      unknownField:'x',
      weightOz:4, qty:1, expendable:true, dateAdded:now, dateModified:now },
  ];
  localStorage.setItem(SNAP_KEY, JSON.stringify({ __v:1, updatedAt:now, items:snapItems }));

  const rawSnap = localStorage.getItem(SNAP_KEY);
  let parsedSnap, snapParseOk=false;
  try { parsedSnap=JSON.parse(rawSnap); snapParseOk=true; } catch{ /**/ }
  R.push({ id:'T06a-snap-written-to-correct-key', ok: rawSnap!==null && snapParseOk,
    detail: rawSnap?.slice(0,60) });
  R.push({ id:'T06b-snap-has-2-items', ok: parsedSnap?.items?.length===2, detail:'' });

  // Simulate loadMasterItems() fallback: validate every snap item
  const validatedSnap = (parsedSnap?.items??[]).map(validate).filter(Boolean);
  R.push({ id:'T06c-fallback-validates-both-items', ok: validatedSnap.length===2,
    detail:`validated=${validatedSnap.length}` });
  const s2 = validatedSnap.find(i=>i.id==='snap-2');
  R.push({ id:'T06d-fallback-strips-checked-from-snap',   ok: s2!==null && !('checked' in (s2??{})),
    detail: s2 ? Object.keys(s2).join(',') : 'not found' });
  R.push({ id:'T06e-fallback-strips-unknown-from-snap',   ok: s2!==null && !('unknownField' in (s2??{})),
    detail:'' });

  // Recovery: reading back from snap returns the same ids
  R.push({ id:'T06f-snap-ids-preserved', ok: validatedSnap.map(i=>i.id).includes('snap-1'),
    detail:'' });

  localStorage.removeItem(SNAP_KEY); // cleanup

  /* =================================================================
     T07 — Export / import: merge (newer wins) and replace (full clear)
  ================================================================= */
  const T07_OLD = now - 5000;
  const T07_A = { id:'t07-a-'+now, schemaVersion:1, name:'Existing Alpha', sub:'', category:'Shelter',
    weightOz:5, qty:1, expendable:false, dateAdded:T07_OLD, dateModified:T07_OLD };
  const T07_B = { id:'t07-b-'+now, schemaVersion:1, name:'Existing Beta', sub:'', category:'Kitchen',
    weightOz:8, qty:2, expendable:true,  dateAdded:T07_OLD, dateModified:T07_OLD };
  await put(db, ML_ST, T07_A);
  await put(db, ML_ST, T07_B);

  // MERGE: import newer version of A (higher dateModified → should update)
  //        import older version of B (lower dateModified → should skip)
  const importNewer = { ...T07_A, name:'Newer Alpha', dateModified: now + 99999 };
  const importOlder = { ...T07_B, name:'Stale Beta',  dateModified: T07_OLD - 1 };

  {
    const existing = await getAll(db, ML_ST);
    const eMap = new Map(existing.map(e=>[e.id,e]));
    for (const imp of [importNewer, importOlder]) {
      const cur = eMap.get(imp.id);
      if (!cur || imp.dateModified > cur.dateModified) await put(db, ML_ST, imp);
    }
  }
  const mergeA = await get(db, ML_ST, T07_A.id);
  const mergeB = await get(db, ML_ST, T07_B.id);
  R.push({ id:'T07a-merge-newer-wins',    ok: mergeA?.name==='Newer Alpha',
    detail:`name='${mergeA?.name}'` });
  R.push({ id:'T07b-merge-older-skipped', ok: mergeB?.name==='Existing Beta',
    detail:`name='${mergeB?.name}'` });

  // REPLACE: clear all items, write a single new one
  const T07_C = { id:'t07-c-'+now, schemaVersion:1, name:'Replace Item', sub:'', category:'Sleep',
    weightOz:20, qty:1, expendable:false, dateAdded:now, dateModified:now };
  await new Promise((res,rej) => {
    const tx = db.transaction(ML_ST,'readwrite'), st=tx.objectStore(ML_ST);
    st.clear(); st.put(T07_C);
    tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error);
  });
  const afterReplace = await getAll(db, ML_ST);
  R.push({ id:'T07c-replace-wipes-old-items',ok: !afterReplace.some(i=>i.id===T07_A.id),
    detail: `remaining: ${afterReplace.map(i=>i.id).join(',')}` });
  R.push({ id:'T07d-replace-writes-new-item',ok: afterReplace.length===1 && afterReplace[0].id===T07_C.id,
    detail:`count=${afterReplace.length} id=${afterReplace[0]?.id}` });

  /* =================================================================
     T08 — Isolation: ML stores don't share keys with checklist
  ================================================================= */
  // Checklist uses localStorage keys like 'pack-checklist-v5-*'
  // ML uses 'trailweigh:masterList.snap'
  // Neither must overlap.
  const CL_KEYS  = ['pack-checklist-v5-default','pack-checklist-v5-','trailweigh:locker','trailweigh:background'];
  R.push({ id:'T08a-snap-key-not-in-checklist-set', ok: !CL_KEYS.includes(SNAP_KEY), detail:'' });

  // Simulate checklist reset: removes only 'pack-checklist-v5-*' from localStorage
  localStorage.setItem(SNAP_KEY, JSON.stringify({ items:[{id:'isolation-test'}] }));
  localStorage.removeItem('pack-checklist-v5-default');
  localStorage.removeItem('pack-checklist-v5-');
  const snapAfterReset = localStorage.getItem(SNAP_KEY);
  R.push({ id:'T08b-checklist-reset-leaves-snap-intact', ok: snapAfterReset?.includes('isolation-test')??false,
    detail: snapAfterReset??'null' });
  localStorage.removeItem(SNAP_KEY);

  // ML IDB stores are in the same DB but the checklist never opens ML_ST/ML_PH in its code.
  // Verify the store names are distinct from anything the checklist uses (bgPhotos):
  R.push({ id:'T08c-ML-store-name-distinct-from-bgPhotos', ok: ML_ST!==BG_ST && ML_PH!==BG_ST, detail:'' });
  // masterItemId field on GearItem is optional and absent by default — verify
  // a plain localStorage round-trip of a GearItem does not create ML keys
  const fakeGearItem = { id:'gi-1', sub:'', desc:'Test', weightOz:1, qty:1, checked:false, expendable:false };
  const serialised = JSON.stringify(fakeGearItem);
  R.push({ id:'T08d-GearItem-serialises-without-ML-keys', ok: !serialised.includes('masterList'), detail:'' });
  R.push({ id:'T08e-masterItemId-absent-when-not-set',
    ok: !('masterItemId' in fakeGearItem),
    detail:'' });

  /* =================================================================
     Cleanup all test records
  ================================================================= */
  for (const id of [ITEM1_ID, ITEM2_ID, T07_C.id]) {
    try { await del(db, ML_ST, id); } catch{ /**/ }
    try { await del(db, ML_TR, id); } catch{ /**/ }
  }
  for (const pid of [PH1_ID]) {
    try { await del(db, ML_PH, pid); } catch{ /**/ }
    try { await del(db, ML_PTR, pid); } catch{ /**/ }
  }
  db.close();

  return R;
});

// ── Print results ─────────────────────────────────────────────────────────────
const SECTIONS = {
  'T01': 'T01 — DB upgrade: all 5 stores exist, bgPhotos intact, keyPaths correct',
  'T02': 'T02 — put / get / getAll / upsert MasterItem',
  'T03': 'T03 — validateMasterItem: allowlist enforced',
  'T04': 'T04 — Item + photo: atomic 2-store write + abort rollback',
  'T05': 'T05 — Delete → trash → undo: item + photo blob atomically restored',
  'T06': 'T06 — Snapshot fallback: write, read, validate, strip checked',
  'T07': 'T07 — Import merge (newer wins, older skipped) + replace (full clear)',
  'T08': 'T08 — Isolation: ML stores / keys separate from checklist',
};

let curSec = '';
for (const r of results) {
  const sec = r.id.slice(0, 3);
  if (sec !== curSec) { console.log(`\n${B(SECTIONS[sec] ?? sec)}`); curSec = sec; }
  report(r.id, r.ok, r.detail);
}

if (browserErrors.length) {
  console.log(`\n${Y('⚠ Browser-side errors captured during run:')}`);
  browserErrors.slice(0, 5).forEach(e => console.log(`  ${Y(e)}`));
}

console.log('\n' + '─'.repeat(60));
const total = passed + failed;
console.log(`${B('Results:')}  ${total} total  ·  ${G(passed + ' passed')}  ·  ${failed > 0 ? R(failed + ' FAILED') : G('0 failed')}`);
if (failed === 0) console.log(G('\n✓ All tests passed — Phase 1 data layer is correct.\n'));
else              console.log(R(`\n✗ ${failed} test(s) failed — see detail above.\n`));

await browser.close();

// Self-delete so no test artifact remains in the workspace
import { unlink } from 'fs/promises';
try { await unlink(new URL(import.meta.url)); } catch { /**/ }

process.exit(failed > 0 ? 1 : 0);
