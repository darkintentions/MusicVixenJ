// Usage: node scripts/create-teacher.mjs <username> <password> [--remote]
import { webcrypto } from 'node:crypto'
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const { subtle } = webcrypto
const projectDir = join(dirname(fileURLToPath(import.meta.url)), '..')

async function hashPassword(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const hashBuffer = await subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const saltB64 = Buffer.from(salt).toString('base64')
  const hashB64 = Buffer.from(hashBuffer).toString('base64')
  return `${saltB64}:${hashB64}`
}

const username = process.argv[2]
const password = process.argv[3]
const remote = process.argv.includes('--remote')

if (!username || !password) {
  console.error('Usage: node scripts/create-teacher.mjs <username> <password> [--remote]')
  process.exit(1)
}

const hash = await hashPassword(password)
const flag = remote ? '--remote' : '--local'

// Write SQL to a temp file to avoid Windows shell quoting issues
const sql = `INSERT OR REPLACE INTO users (username, password_hash, role) VALUES ('${username}', '${hash}', 'teacher');`
const tmpFile = join(projectDir, '.tmp-create-teacher.sql')
writeFileSync(tmpFile, sql)

console.log(`Creating teacher account: "${username}" ...`)
try {
  execSync(`npx wrangler d1 execute musicvixenj ${flag} --file=.tmp-create-teacher.sql`, {
    stdio: 'inherit',
    cwd: projectDir,
    shell: true,
  })
  console.log('Done! You can now log in.')
} finally {
  unlinkSync(tmpFile)
}
