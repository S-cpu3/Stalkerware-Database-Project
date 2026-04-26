// Browser-side scraper. Mirrors PWA/scraper.py but builds the SQLite DB
// directly in the browser via sql.js. No server, no Python.
//
// Sources, IoC type map, severity map, and relationship map are kept in
// sync with scraper.py — keep both files updated together.

import yaml from 'js-yaml'
import schemaSql from '../schema.sql?raw'

const SOURCES = {
  'ioc.yaml': [
    'https://raw.githubusercontent.com/AssoEchap/stalkerware-indicators/master/ioc.yaml',
    'https://cdn.jsdelivr.net/gh/AssoEchap/stalkerware-indicators@master/ioc.yaml',
  ],
  'watchware.yaml': [
    'https://raw.githubusercontent.com/AssoEchap/stalkerware-indicators/master/watchware.yaml',
    'https://cdn.jsdelivr.net/gh/AssoEchap/stalkerware-indicators@master/watchware.yaml',
  ],
  'samples.csv': [
    'https://raw.githubusercontent.com/AssoEchap/stalkerware-indicators/master/samples.csv',
    'https://cdn.jsdelivr.net/gh/AssoEchap/stalkerware-indicators@master/samples.csv',
  ],
}

const SOURCE_REFERENCE = 'ECHAP-AssoEchap-GitHub'

const IOC_TYPE_MAP = {
  domains:      'domain',
  packages:     'package_name',
  certificates: 'certificate',
  sha256:       'file_hash',
  filenames:    'filename',
  processes:    'process_name',
  emails:       'email',
  ips:          'ip_address',
}

const SEVERITY_MAP = {
  certificate:  'High',
  package_name: 'High',
  file_hash:    'High',
  ip_address:   'High',
  domain:       'Medium',
  process_name: 'Medium',
  filename:     'Medium',
  email:        'Low',
}

const RELATIONSHIP_MAP = {
  domain:       'communicates_with',
  ip_address:   'connects_to',
  package_name: 'uses',
  file_hash:    'drops',
  certificate:  'signed_with',
  filename:     'drops',
  process_name: 'runs',
  email:        'registered_with',
}

async function fetchOne(filename, onProgress) {
  const urls = SOURCES[filename]
  let lastErr
  for (const url of urls) {
    try {
      onProgress?.(`Fetching ${filename} from ${new URL(url).hostname}…`)
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(`Could not fetch ${filename}: ${lastErr?.message || 'unknown error'}`)
}

// Tiny CSV parser that handles quoted fields with commas / embedded quotes.
// Sufficient for samples.csv from the ECHAP repo; not RFC-complete.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  if (!rows.length) return []
  const header = rows[0].map(h => h.trim())
  return rows.slice(1)
    .filter(r => r.some(v => v && v.length))
    .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

// Insert helpers that mirror the python ones. We hold a map of in-flight
// IDs in JS instead of round-tripping a SELECT before every insert — the
// unique indexes in schema.sql still protect us if we somehow double-add.
function makeInserter(db) {
  const apps = new Map()  // app_name -> app_id
  const iocs = new Map()  // type|value -> ioc_id
  const links = new Set() // app_id|ioc_id

  const insertApp  = db.prepare(
    'INSERT INTO stalkerware_apps (app_name, platform, release_date) VALUES (?, ?, ?)'
  )
  const insertIoc  = db.prepare(
    'INSERT INTO iocs (ioc_type, ioc_value, severity_level, date_identified) VALUES (?, ?, ?, ?)'
  )
  const insertLink = db.prepare(
    'INSERT INTO app_ioc (relationship_type, source_reference, app_id, ioc_id) VALUES (?, ?, ?, ?)'
  )

  function lastInsertId() {
    const r = db.exec('SELECT last_insert_rowid() AS id')
    return r[0].values[0][0]
  }

  return {
    upsertApp(name, platform, releaseDate) {
      if (apps.has(name)) return apps.get(name)
      insertApp.run([name, platform, releaseDate])
      const id = lastInsertId()
      apps.set(name, id)
      return id
    },
    upsertIoc(type, value, severity, date) {
      const k = type + '|' + value
      if (iocs.has(k)) return iocs.get(k)
      insertIoc.run([type, value, severity, date])
      const id = lastInsertId()
      iocs.set(k, id)
      return id
    },
    linkAppIoc(appId, iocId, relationship, source) {
      const k = appId + '|' + iocId
      if (links.has(k)) return false
      insertLink.run([relationship, source, appId, iocId])
      links.add(k)
      return true
    },
    hasApp(name) { return apps.has(name) },
    getAppId(name) { return apps.get(name) },
    finalize() {
      insertApp.free()
      insertIoc.free()
      insertLink.free()
    },
  }
}

function ingestYaml(rawText, ins, defaultPlatform = 'Android') {
  const entries = yaml.load(rawText)
  const stats = { apps: 0, iocs: 0, links: 0 }
  if (!Array.isArray(entries)) return stats
  const today = new Date().toISOString().slice(0, 10)

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const name = String(entry.name ?? '').trim()
    if (!name) continue
    const platform = entry.packages ? 'Android' : defaultPlatform
    const appId = ins.upsertApp(name, platform, today)
    stats.apps++

    for (const [yamlKey, iocType] of Object.entries(IOC_TYPE_MAP)) {
      let values = entry[yamlKey]
      if (!values) continue
      if (typeof values === 'string') values = [values]
      if (!Array.isArray(values)) continue

      const severity = SEVERITY_MAP[iocType] || 'Medium'
      const relationship = RELATIONSHIP_MAP[iocType] || 'related_to'

      for (const raw of values) {
        const value = String(raw ?? '').trim()
        if (!value) continue
        const iocId = ins.upsertIoc(iocType, value, severity, today)
        stats.iocs++
        if (ins.linkAppIoc(appId, iocId, relationship, SOURCE_REFERENCE)) stats.links++
      }
    }
  }
  return stats
}

function ingestSamplesCsv(rawText, ins) {
  const today = new Date().toISOString().slice(0, 10)
  const stats = { iocs: 0, skipped: 0 }
  const rows = parseCsv(rawText)
  for (const row of rows) {
    const sha256 = (row.sha256 || '').trim()
    const appName = (row.app_name || '').trim()
    if (!sha256 || !appName) { stats.skipped++; continue }
    // Only attach hashes to apps already ingested by the YAML pass.
    // ins doesn't expose the app map directly; we attempt the lookup via
    // upsertApp's cache by re-calling with no insert path — instead we
    // skip if upsertApp would create a fresh row. Cheapest way: peek.
    if (!ins.hasApp(appName)) { stats.skipped++; continue }
    const appId = ins.getAppId(appName)
    const iocId = ins.upsertIoc('file_hash', sha256, 'High', today)
    if (ins.linkAppIoc(appId, iocId, 'drops', SOURCE_REFERENCE)) stats.iocs++
  }
  return stats
}

// Build a brand-new sql.js DB and ingest everything. Returns the
// serialized Uint8Array ready to persist.
export async function buildDatabase({ sqlJs, onProgress } = {}) {
  if (!sqlJs) throw new Error('buildDatabase: sqlJs (the initialized SQL module) is required')
  onProgress?.('Initializing database…')
  const db = new sqlJs.Database()
  db.exec(schemaSql)

  const ins = makeInserter(db)
  let totalApps = 0, totalIocs = 0, totalLinks = 0
  try {
    db.exec('BEGIN')

    onProgress?.('Downloading ioc.yaml…')
    const iocYaml = await fetchOne('ioc.yaml', onProgress)
    onProgress?.('Parsing stalkerware entries…')
    const s1 = ingestYaml(iocYaml, ins)
    totalApps += s1.apps; totalIocs += s1.iocs; totalLinks += s1.links

    onProgress?.('Downloading watchware.yaml…')
    const watchYaml = await fetchOne('watchware.yaml', onProgress)
    onProgress?.('Parsing watchware entries…')
    const s2 = ingestYaml(watchYaml, ins)
    totalApps += s2.apps; totalIocs += s2.iocs; totalLinks += s2.links

    onProgress?.('Downloading samples.csv…')
    const samples = await fetchOne('samples.csv', onProgress)
    onProgress?.('Linking sample hashes…')
    const s3 = ingestSamplesCsv(samples, ins)
    totalIocs += s3.iocs; totalLinks += s3.iocs

    db.exec('COMMIT')
  } catch (e) {
    try { db.exec('ROLLBACK') } catch {}
    ins.finalize()
    db.close()
    throw e
  }

  ins.finalize()
  const bytes = db.export()
  db.close()
  onProgress?.(`Done. ${totalApps} apps, ${totalIocs} IoCs, ${totalLinks} links.`)
  return { bytes, stats: { apps: totalApps, iocs: totalIocs, links: totalLinks } }
}
