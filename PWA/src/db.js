import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { ref } from 'vue'
import { loadSnapshot, saveSnapshot } from './dbStore.js'

let sqlPromise = null
let dbPromise = null

// Reactive bookkeeping that views can watch to re-query after a refresh.
export const dbVersion = ref(0)
export const dbMeta = ref({ source: 'unknown', updatedAt: null, stats: null })
export const refreshState = ref({ running: false, message: '', error: null })

function getSql() {
  if (!sqlPromise) sqlPromise = initSqlJs({ locateFile: () => wasmUrl })
  return sqlPromise
}

async function openFromBytes(bytes) {
  const SQL = await getSql()
  return new SQL.Database(bytes)
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const snap = await loadSnapshot()
      if (snap?.bytes) {
        dbMeta.value = { source: 'scraped', updatedAt: snap.updatedAt, stats: snap.stats || null }
        return openFromBytes(snap.bytes)
      }
      const res = await fetch(import.meta.env.BASE_URL + 'stalkerware_iocs.db')
      const bytes = new Uint8Array(await res.arrayBuffer())
      dbMeta.value = { source: 'bundled', updatedAt: null, stats: null }
      return openFromBytes(bytes)
    })()
  }
  return dbPromise
}

export async function query(sql, params = []) {
  const db = await getDb()
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

// Auto-refresh policy: re-scrape if the snapshot is missing or older than this.
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

// Trigger a background refresh on app load if data is stale. Safe to call
// multiple times — refreshDatabase() no-ops while a run is in flight.
export async function maybeAutoRefresh() {
  if (!navigator.onLine) return
  await getDb()  // ensure dbMeta is populated
  const meta = dbMeta.value
  const age = meta.updatedAt ? Date.now() - new Date(meta.updatedAt).getTime() : Infinity
  if (meta.source === 'bundled' || age > STALE_AFTER_MS) {
    refreshDatabase().catch(() => { /* surfaced via refreshState.error */ })
  }
}

// Re-scrape upstream sources, persist to IndexedDB, swap in-memory DB.
export async function refreshDatabase() {
  if (refreshState.value.running) return
  refreshState.value = { running: true, message: 'Starting…', error: null }
  try {
    const [{ buildDatabase }, sqlJs] = await Promise.all([
      import('./scraper.js'),
      getSql(),
    ])
    const { bytes, stats } = await buildDatabase({
      sqlJs,
      onProgress: (msg) => { refreshState.value = { ...refreshState.value, message: msg } },
    })
    await saveSnapshot({ bytes, stats })

    // Swap the live DB. Close the old one if it's already resolved.
    const old = dbPromise ? await dbPromise.catch(() => null) : null
    dbPromise = Promise.resolve(await openFromBytes(bytes))
    if (old) try { old.close() } catch {}

    dbMeta.value = { source: 'scraped', updatedAt: new Date().toISOString(), stats }
    dbVersion.value++
    refreshState.value = { running: false, message: 'Updated.', error: null }
    return stats
  } catch (e) {
    refreshState.value = { running: false, message: '', error: e.message || String(e) }
    throw e
  }
}

// Schema reference (from schema.sql):
//   stalkerware_apps(app_id, app_name, platform, release_date)
//   iocs(ioc_id, ioc_type, ioc_value, severity_level, date_identified)
//   permissions(permission_id, permission_name, risk_level)
//   app_ioc(app_ioc_id, relationship_type, source_reference, app_id, ioc_id)
//   app_permissions(app_permission_id, required_or_optional, abuse_purpose, app_id, permission_id)

const PERM_PLAIN = {
  RECORD_AUDIO: 'Lets the app turn on the microphone and record what is said in the room — even when you’re not on a call.',
  READ_SMS: 'Lets the app read every SMS message you send and receive, including codes from your bank.',
  ACCESS_FINE_LOCATION: 'Lets the app see exactly where the phone is, accurate to within a few meters, in real time.',
  READ_CONTACTS: 'Lets the app see everyone in your address book — names, numbers, emails.',
  READ_CALL_LOG: 'Lets the app see who you called or who called you, when, and for how long.',
  CAMERA: 'Lets the app turn on the camera and capture photos or video without putting anything on screen.',
  READ_EXTERNAL_STORAGE: 'Lets the app read your photos, videos, and downloaded files.',
  WRITE_EXTERNAL_STORAGE: 'Lets the app create or modify files on the phone’s storage.',
  ACCESS_BACKGROUND_LOCATION: 'Lets the app track where the phone is even when the app isn’t open.',
  SYSTEM_ALERT_WINDOW: 'Lets the app put invisible windows over what you’re doing — useful for capturing taps or hiding its UI.',
  RECEIVE_BOOT_COMPLETED: 'Lets the app launch itself the moment the phone turns on, without anyone tapping anything.',
  READ_PHONE_STATE: 'Lets the app see your phone number and unique device ID.',
  SEND_SMS: 'Lets the app send text messages from your phone, potentially to premium numbers.',
  ACCESS_WIFI_STATE: 'Lets the app see what Wi-Fi network the phone is on.',
  ACCESS_NETWORK_STATE: 'Lets the app see what kind of network connection the phone has.',
  WAKE_LOCK: 'Lets the app keep the phone awake even when the screen is off.',
  BLUETOOTH: 'Lets the app see and connect to nearby Bluetooth devices.',
  MODIFY_AUDIO_SETTINGS: 'Lets the app change volume, mute, or routing — useful for hiding call recording.',
  GET_ACCOUNTS: 'Lets the app see what accounts (Google, etc.) are signed in on the phone.',
  INTERNET: 'Lets the app talk to servers over the internet.',
  BIND_ACCESSIBILITY_SERVICE: 'A powerful permission meant for accessibility tools. When abused, it can read everything on the screen and tap things on your behalf — including in other apps.',
  PACKAGE_USAGE_STATS: 'Lets the app see which apps you open and for how long.',
}

function plainFor(key) {
  return PERM_PLAIN[key] || 'Used by the app to gain access to data or capabilities on the device.'
}

export const RESOURCES = [
  { name: 'Coalition Against Stalkerware', tag: 'International', url: 'https://stopstalkerware.org',
    desc: 'Coordinated work between researchers, victim-support orgs, and security vendors. Resources for survivors and advocates in many languages.' },
  { name: 'National Domestic Violence Hotline', tag: 'United States', url: 'https://www.thehotline.org',
    desc: '24/7 confidential support. Call 1-800-799-7233 or text START to 88788.' },
  { name: 'Refuge Tech Safety', tag: 'United Kingdom', url: 'https://refugetechsafety.org',
    desc: 'Free guides for survivors of tech-enabled abuse. Step-by-step tutorials.' },
  { name: 'WESNET Safety Net', tag: 'Australia', url: 'https://techsafety.org.au',
    desc: 'Tech safety resources for women experiencing abuse, plus advocate training.' },
  { name: 'Operation Safe Escape', tag: 'United States', url: 'https://safeescape.org',
    desc: 'Help planning to leave a controlling relationship safely — incl. digital safety guidance.' },
  { name: 'NNEDV Tech Safety', tag: 'United States', url: 'https://www.techsafety.org',
    desc: 'Toolkits, app safety reviews, and safety planning for survivors and advocates.' },
]

const APP_TAGLINES = {
  FlexiSPY: 'Full-spectrum monitoring with call interception.',
  mSpy: 'Most-marketed consumer-grade stalkerware.',
  Hoverwatch: 'Hidden Android keylogger and call recorder.',
  Spyera: 'Live call listening + ambient recording.',
  Cocospy: 'White-labelled spyware family with shared infrastructure.',
  XNSPY: 'Workplace-marketed surveillance suite.',
  uMobix: 'Consumer-grade phone monitor.',
  iKeyMonitor: 'Keystroke and screen capture tool.',
  TheTruthSpy: 'Repeatedly-breached Android spyware.',
  Cerberus: 'Anti-theft app abused for surveillance.',
  HighsterMobile: 'One-time-purchase spyware, no subscription.',
  SpyBubble: 'Long-running consumer monitor.',
  MobileTracker: 'Location and message tracker.',
  Copy9: 'SMS and call logger.',
  TrackMyFone: 'Family-marketed tracking app.',
  Fonemonitor: 'Lower-cost monitoring product.',
  GuestSpy: 'Free-tier spyware with paid upgrades.',
  EasySpy: 'Budget-tier spyware.',
  PhoneSheriff: 'Defunct sibling product to Mobile Spy.',
  Spyic: 'Cocospy-family clone.',
}

function shapeApp(row) {
  return {
    id: String(row.app_id),
    name: row.app_name,
    vendor: row.app_name,
    severity: row.severity || 'Medium',
    tagline: APP_TAGLINES[row.app_name] || 'Documented surveillance app.',
    description: APP_TAGLINES[row.app_name] || 'This app has documented surveillance behavior. See its indicators and requested permissions for detail.',
    first_seen: row.release_date ? String(row.release_date).slice(0, 4) : '—',
    platforms: row.platform ? [row.platform] : ['Android'],
  }
}

function shapeIoc(row) {
  return {
    id: String(row.ioc_id),
    app: row.app_id != null ? String(row.app_id) : null,
    type: row.ioc_type,
    value: row.ioc_value,
    severity: row.severity_level,
    date: row.date_identified,
    source: row.source_reference || 'unknown',
  }
}

export async function getAllApps() {
  const rows = await query(`
    SELECT a.app_id, a.app_name, a.platform, a.release_date,
           CASE
             WHEN MAX(CASE i.severity_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END) = 3 THEN 'High'
             WHEN MAX(CASE i.severity_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END) = 2 THEN 'Medium'
             WHEN MAX(CASE i.severity_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END) = 1 THEN 'Low'
             ELSE 'Medium'
           END AS severity
    FROM stalkerware_apps a
    LEFT JOIN app_ioc ai ON ai.app_id = a.app_id
    LEFT JOIN iocs i ON i.ioc_id = ai.ioc_id
    GROUP BY a.app_id
    ORDER BY a.app_name
  `)
  return rows.map(shapeApp)
}

export async function getApp(id) {
  const rows = await query(`
    SELECT a.app_id, a.app_name, a.platform, a.release_date,
           CASE
             WHEN MAX(CASE i.severity_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END) = 3 THEN 'High'
             WHEN MAX(CASE i.severity_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END) = 2 THEN 'Medium'
             WHEN MAX(CASE i.severity_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END) = 1 THEN 'Low'
             ELSE 'Medium'
           END AS severity
    FROM stalkerware_apps a
    LEFT JOIN app_ioc ai ON ai.app_id = a.app_id
    LEFT JOIN iocs i ON i.ioc_id = ai.ioc_id
    WHERE a.app_id = ?
    GROUP BY a.app_id
  `, [id])
  return rows[0] ? shapeApp(rows[0]) : null
}

export async function getIocCountForApp(id) {
  const rows = await query('SELECT COUNT(*) AS n FROM app_ioc WHERE app_id = ?', [id])
  return rows[0]?.n || 0
}

export async function getIocsForApp(id) {
  const rows = await query(`
    SELECT i.ioc_id, i.ioc_type, i.ioc_value, i.severity_level, i.date_identified,
           ai.source_reference, ai.app_id
    FROM iocs i
    JOIN app_ioc ai ON ai.ioc_id = i.ioc_id
    WHERE ai.app_id = ?
    ORDER BY i.date_identified DESC
  `, [id])
  return rows.map(shapeIoc)
}

export async function getPermsForApp(id) {
  const rows = await query(`
    SELECT p.permission_id, p.permission_name, p.risk_level,
           ap.required_or_optional, ap.abuse_purpose
    FROM permissions p
    JOIN app_permissions ap ON ap.permission_id = p.permission_id
    WHERE ap.app_id = ?
    ORDER BY CASE p.risk_level WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
             p.permission_name
  `, [id])
  return rows.map(r => ({
    key: r.permission_name,
    label: r.abuse_purpose || r.permission_name,
    plain: plainFor(r.permission_name),
    risk: r.risk_level,
    required: r.required_or_optional,
  }))
}

export async function getAllPermissions() {
  const rows = await query(`
    SELECT permission_id, permission_name, risk_level
    FROM permissions
    ORDER BY CASE risk_level WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
             permission_name
  `)
  return rows.map(r => ({
    key: r.permission_name,
    label: r.permission_name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    plain: plainFor(r.permission_name),
    risk: r.risk_level,
  }))
}

export async function findIocs(q) {
  const v = (q || '').trim()
  if (!v) return []
  const rows = await query(`
    SELECT i.ioc_id, i.ioc_type, i.ioc_value, i.severity_level, i.date_identified,
           ai.source_reference, ai.app_id, a.app_name
    FROM iocs i
    JOIN app_ioc ai ON ai.ioc_id = i.ioc_id
    JOIN stalkerware_apps a ON a.app_id = ai.app_id
    WHERE LOWER(i.ioc_value) LIKE ?
    ORDER BY i.date_identified DESC
  `, ['%' + v.toLowerCase() + '%'])
  return rows.map(r => ({ ...shapeIoc(r), appName: r.app_name }))
}

export async function getRecentIocs(limit = 200) {
  const rows = await query(`
    SELECT i.ioc_id, i.ioc_type, i.ioc_value, i.severity_level, i.date_identified,
           ai.source_reference, ai.app_id, a.app_name
    FROM iocs i
    JOIN app_ioc ai ON ai.ioc_id = i.ioc_id
    JOIN stalkerware_apps a ON a.app_id = ai.app_id
    ORDER BY i.date_identified DESC
    LIMIT ?
  `, [limit])
  return rows.map(r => ({ ...shapeIoc(r), appName: r.app_name }))
}
