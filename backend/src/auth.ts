import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto'
const cost = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scryptCallback(password, salt, 64, cost, (error, key) => error ? reject(error) : resolve(key))
})
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return 'scrypt-v1$32768$8$3$' + salt + '$' + (await derive(password, salt)).toString('hex')
}
export async function verifyPassword(password: string, stored: string) {
  const [method, n, r, p, salt, hex] = stored.split('$')
  if (method !== 'scrypt-v1' || n !== '32768' || r !== '8' || p !== '3' || !salt || !hex || hex.length !== 128) return false
  return timingSafeEqual(await derive(password, salt), Buffer.from(hex, 'hex'))
}
