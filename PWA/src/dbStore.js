// IndexedDB persistence for the scraped SQLite snapshot.
// One database, one object store, one row keyed by 'current'.

const DB_NAME = 'stalkerware-iocs'
const STORE   = 'snapshots'
const KEY     = 'current'
const VERSION = 1

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function reqAsPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function loadSnapshot() {
  try {
    const db = await open()
    const row = await reqAsPromise(tx(db, 'readonly').get(KEY))
    db.close()
    return row || null  // { bytes: Uint8Array, updatedAt: ISO string, stats } | null
  } catch (e) {
    console.warn('IndexedDB unavailable, falling back to bundled DB:', e)
    return null
  }
}

export async function saveSnapshot({ bytes, stats }) {
  const db = await open()
  await reqAsPromise(
    tx(db, 'readwrite').put({ bytes, stats, updatedAt: new Date().toISOString() }, KEY)
  )
  db.close()
}

export async function clearSnapshot() {
  try {
    const db = await open()
    await reqAsPromise(tx(db, 'readwrite').delete(KEY))
    db.close()
  } catch (e) { /* ignore */ }
}
