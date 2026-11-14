import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../src/auth.js'
test('password hashes have distinct salts, cost version and verify without plaintext storage', async () => {
  const password = 'test-password-example'
  const one = await hashPassword(password), two = await hashPassword(password)
  assert.notEqual(one, two)
  assert.ok(one.startsWith('scrypt-v1$32768$8$3$'))
  assert.equal(one.includes(password), false)
  assert.equal(await verifyPassword(password, one), true)
  assert.equal(await verifyPassword('wrong', one), false)
})
