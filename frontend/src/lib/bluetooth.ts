/** Narrow interfaces keep browser capability detection explicit and make GATT testable. */
export interface HeartRateCharacteristic extends EventTarget {
  value?: DataView
  startNotifications(): Promise<unknown>
  stopNotifications(): Promise<unknown>
}
export interface HeartRateDevice extends EventTarget {
  id: string; name?: string
  gatt?: { connected: boolean; connect(): Promise<unknown>; disconnect(): void
    getPrimaryService(service: string): Promise<{ getCharacteristic(name: string): Promise<HeartRateCharacteristic> }> }
}
export interface BluetoothAccess { requestDevice(options: { filters: { services: string[] }[] }): Promise<HeartRateDevice> }
export interface HeartRatePacket { bpm: number; contact: 'detected' | 'not-detected' | 'not-supported'; rrMilliseconds: number[]; energyKj?: number }
export interface LiveHeartRate extends HeartRatePacket { at: string; device: string }
export interface BluetoothState {
  phase: 'idle' | 'choosing' | 'connecting' | 'connected' | 'disconnected' | 'error'
  deviceName: string; reading: LiveHeartRate | null; error: string | null; packets: number
}
export function bluetoothAccess(nav: Navigator = navigator): BluetoothAccess | undefined {
  return (nav as Navigator & { bluetooth?: BluetoothAccess }).bluetooth
}
export function bluetoothUnavailable(secure: boolean, access?: BluetoothAccess) {
  if (!secure) return 'Bluetooth requires HTTPS or localhost. Open http://localhost:5173 on this computer, or configure HTTPS for network access.'
  if (!access) return 'Web Bluetooth is unavailable in this browser. Try an up-to-date Chrome or Edge with Bluetooth enabled on the computer.'
  return null
}

/** Bluetooth SIG HRS 1.0, 0x2A37. UINT16, energy and RR fields are little-endian. */
export function parseHeartRate(data: DataView): HeartRatePacket {
  if (data.byteLength < 2) throw new Error('Incomplete heart-rate packet.')
  const flags = data.getUint8(0)
  if (flags & 0xe0) throw new Error('Unsupported heart-rate flags.')
  let offset = 1
  const take = (wide: boolean) => {
    const size = wide ? 2 : 1
    if (offset + size > data.byteLength) throw new Error('Incomplete heart-rate packet.')
    const value = wide ? data.getUint16(offset, true) : data.getUint8(offset)
    offset += size; return value
  }
  const bpm = take(Boolean(flags & 1))
  const contact = flags & 4 ? (flags & 2 ? 'detected' : 'not-detected') : 'not-supported'
  const energyKj = flags & 8 ? take(true) : undefined
  const rrMilliseconds: number[] = []
  if (flags & 16) {
    if (offset === data.byteLength || (data.byteLength - offset) % 2) throw new Error('Incomplete RR interval.')
    while (offset < data.byteLength) rrMilliseconds.push(take(true) * 1000 / 1024)
  }
  if (offset !== data.byteLength) throw new Error('Unexpected heart-rate packet bytes.')
  if (!Number.isInteger(bpm) || bpm < 1 || bpm > 350) throw new Error('Heart-rate value is outside this app’s accepted range (1–350 bpm).')
  return { bpm, contact, rrMilliseconds, ...(energyKj !== undefined ? { energyKj } : {}) }
}

export class HeartRateConnection {
  private state: BluetoothState = { phase: 'idle', deviceName: '', reading: null, error: null, packets: 0 }
  private listeners = new Set<() => void>()
  private epoch = 0
  private cleanup: (() => void) | undefined
  private readonly now: () => string
  constructor(now = () => new Date().toISOString()) { this.now = now }
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private update(patch: Partial<BluetoothState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(l => l()) }
  disconnect = () => {
    this.epoch++; this.cleanup?.(); this.cleanup = undefined
    this.update({ phase: 'disconnected', reading: null, error: null })
  }
  async connect(access: BluetoothAccess) {
    if (['choosing', 'connecting', 'connected'].includes(this.state.phase)) return
    const epoch = ++this.epoch
    this.cleanup?.(); this.cleanup = undefined
    this.update({ phase: 'choosing', deviceName: '', reading: null, error: null, packets: 0 })
    let device: HeartRateDevice | undefined
    try {
      // This call runs directly in the click handler, before any await or server request.
      device = await access.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      if (epoch !== this.epoch) return
      const gatt = device.gatt
      if (!gatt) throw new Error('This device does not expose a Bluetooth LE GATT server.')
      let characteristic: HeartRateCharacteristic | undefined
      const changed = () => {
        if (epoch !== this.epoch || !characteristic?.value) return
        try {
          const packet = parseHeartRate(characteristic.value)
          if (packet.contact === 'not-detected') {
            this.update({ reading: null, error: 'Sensor reports no skin contact. Adjust the watch and wait for a fresh reading.' }); return
          }
          this.update({ reading: { ...packet, at: this.now(), device: this.state.deviceName }, error: null, packets: this.state.packets + 1 })
        } catch (error) { this.update({ reading: null, error: error instanceof Error ? error.message : 'Invalid Bluetooth packet.' }) }
      }
      const dropped = () => {
        if (epoch !== this.epoch) return
        this.disconnect()
        this.update({ error: 'Bluetooth disconnected. Reconnect explicitly to resume receiving readings.' })
      }
      this.cleanup = () => {
        device?.removeEventListener('gattserverdisconnected', dropped)
        characteristic?.removeEventListener('characteristicvaluechanged', changed)
        if (characteristic && gatt.connected) void characteristic.stopNotifications().catch(() => {})
        if (gatt.connected) gatt.disconnect()
      }
      device.addEventListener('gattserverdisconnected', dropped)
      this.update({ phase: 'connecting', deviceName: (device.name?.trim() || 'Unnamed Bluetooth heart-rate sensor').slice(0, 160) })
      await gatt.connect()
      if (epoch !== this.epoch) { gatt.disconnect(); return }
      const service = await gatt.getPrimaryService('heart_rate')
      if (epoch !== this.epoch) return
      characteristic = await service.getCharacteristic('heart_rate_measurement')
      if (epoch !== this.epoch) return
      characteristic.addEventListener('characteristicvaluechanged', changed)
      await characteristic.startNotifications()
      if (epoch === this.epoch) this.update({ phase: 'connected' })
    } catch (error) {
      if (epoch !== this.epoch) return
      this.cleanup?.(); this.cleanup = undefined
      const name = error instanceof Error ? error.name : ''
      const message = name === 'NotFoundError' ? 'No compatible sensor was selected. Enable heart-rate broadcasting on the device, then try again.'
        : name === 'SecurityError' || name === 'NotAllowedError' ? 'Bluetooth access was blocked. Allow it in the browser’s site permissions and connect again.'
        : error instanceof Error ? error.message : 'Could not connect to Bluetooth.'
      this.update({ phase: 'error', reading: null, error: message })
    }
  }
}
