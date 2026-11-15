import { describe, it, expect } from 'vitest'
import { HeartRateConnection, parseHeartRate, bluetoothUnavailable, type HeartRateCharacteristic, type HeartRateDevice } from './bluetooth'
const packet = (...bytes: number[]) => new DataView(Uint8Array.from(bytes).buffer)
class Characteristic extends EventTarget implements HeartRateCharacteristic {
  value?: DataView
  starts = 0; stops = 0
  async startNotifications() { this.starts++ }
  async stopNotifications() { this.stops++ }
  send(...bytes: number[]) { this.value = packet(...bytes); this.dispatchEvent(new Event('characteristicvaluechanged')) }
}
function sensor() {
  const characteristic = new Characteristic(), device = new EventTarget() as HeartRateDevice
  Object.assign(device, { id: 'browser-private-device-id', name: 'Declared watch', gatt: {
    connected: false,
    async connect() { this.connected = true; return this },
    disconnect() { this.connected = false },
    async getPrimaryService(name: string) { expect(name).toBe('heart_rate'); return { async getCharacteristic(id: string) { expect(id).toBe('heart_rate_measurement'); return characteristic } } },
  } })
  return { device, characteristic }
}
describe('Bluetooth Heart Rate Service', () => {
  it('decodes UINT8/UINT16, contact, energy, RR intervals and DataView offsets', () => {
    expect(parseHeartRate(packet(0, 72))).toEqual({ bpm: 72, contact: 'not-supported', rrMilliseconds: [] })
    expect(parseHeartRate(packet(7, 44, 1)).bpm).toBe(300)
    expect(parseHeartRate(packet(4, 72)).contact).toBe('not-detected')
    const bytes = Uint8Array.from([255, 30, 72, 5, 0, 0, 4, 0, 2, 255])
    expect(parseHeartRate(new DataView(bytes.buffer, 1, 8))).toEqual({ bpm: 72, contact: 'detected', energyKj: 5, rrMilliseconds: [1000, 500] })
  })
  it('rejects truncated, inconsistent, unsupported or out-of-range notifications', () => {
    for (const bytes of [[], [0], [1, 72], [8, 72, 1], [16, 72], [16, 72, 1], [0, 72, 0], [32, 72], [0, 0], [1, 255, 1]]) expect(() => parseHeartRate(packet(...bytes))).toThrow()
  })
  it('detects insecure URLs and browsers without support', () => {
    expect(bluetoothUnavailable(false)).toMatch(/HTTPS or localhost/)
    expect(bluetoothUnavailable(true)).toMatch(/unavailable/)
    expect(bluetoothUnavailable(true, { requestDevice: async () => sensor().device })).toBeNull()
  })
  it('requests only HRS on an explicit call, receives values and cleans up listeners on disconnect', async () => {
    const { device, characteristic } = sensor(), connection = new HeartRateConnection(() => '2026-11-15T12:00:00.000Z')
    let requests = 0
    const access = { requestDevice: async (options: unknown) => { requests++; expect(options).toEqual({ filters: [{ services: ['heart_rate'] }] }); return device } }
    expect(requests).toBe(0)
    const pending = connection.connect(access)
    expect(requests).toBe(1)
    await pending
    expect(connection.getSnapshot().phase).toBe('connected')
    characteristic.send(6, 72)
    expect(connection.getSnapshot().reading).toMatchObject({ bpm: 72, device: 'Declared watch', at: '2026-11-15T12:00:00.000Z' })
    characteristic.send(4, 72)
    expect(connection.getSnapshot().reading).toBeNull()
    expect(connection.getSnapshot().error).toMatch(/skin contact/)
    characteristic.send(6, 73)
    characteristic.send(0)
    expect(connection.getSnapshot().reading).toBeNull()
    connection.disconnect(); characteristic.send(6, 99)
    expect(connection.getSnapshot().reading).toBeNull()
    expect(device.gatt!.connected).toBe(false); expect(characteristic.stops).toBe(1)
  })
  it('clears readings on physical disconnection and does not reconnect automatically', async () => {
    const { device, characteristic } = sensor(), connection = new HeartRateConnection()
    let calls = 0
    await connection.connect({ requestDevice: async () => { calls++; return device } })
    characteristic.send(0, 70)
    device.dispatchEvent(new Event('gattserverdisconnected'))
    expect(connection.getSnapshot().phase).toBe('disconnected'); expect(connection.getSnapshot().reading).toBeNull()
    expect(calls).toBe(1)
  })
  it('reports cancelled choosers and denied permissions without leaving a connection', async () => {
    for (const name of ['NotFoundError', 'NotAllowedError']) {
      const connection = new HeartRateConnection()
      await connection.connect({ requestDevice: async () => { throw new DOMException('denied', name) } })
      expect(connection.getSnapshot().phase).toBe('error'); expect(connection.getSnapshot().reading).toBeNull()
    }
  })
  it('disconnects a late GATT connection after the page has been disposed', async () => {
    const { device } = sensor(), connection = new HeartRateConnection()
    let release!: () => void
    device.gatt!.connect = () => new Promise<void>(resolve => { release = () => { device.gatt!.connected = true; resolve() } })
    const pending = connection.connect({ requestDevice: async () => device })
    await Promise.resolve()
    connection.disconnect(); release(); await pending
    expect(device.gatt!.connected).toBe(false); expect(connection.getSnapshot().phase).toBe('disconnected')
  })
})
