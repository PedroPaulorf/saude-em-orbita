import { useState } from 'react'
import { Smartphone } from 'lucide-react'
import { Panel, PanelHeader } from './Panel'
import { Button } from '@/components/ui/button'
import { apiBase } from '@/lib/api'
import type { WearableHistory } from '@/lib/wearables'

export function Fit3Connect({ history }: { history: WearableHistory | null }) {
  const [open, setOpen] = useState(false)
  const latest = history?.items.find(s => s.transport === 'android-health-connect')
  const server = apiBase(import.meta.env.VITE_API_URL).replace(/\/api\/v1$/, '')
  const loopback = /^(?:localhost|127\.|\[::1\])/.test(new URL(server).hostname)
  return <Panel id="fit3-connection" className="scroll-mt-24">
    <PanelHeader icon={<Smartphone />} tone="orange" title="Samsung Galaxy Fit3" subtitle="Fit3 → Samsung Health on your phone → Health7" />
    <p className="text-sm text-ink-soft">The Fit3 does not run Wear OS apps. Its supported integration path here uses the Android phone that receives its Bluetooth data, then reads heart rate shared by Samsung Health through Health Connect. Direct browser pairing is not assumed.</p>
    <Button className="h-auto min-h-11 max-w-full self-start py-2 whitespace-normal" aria-expanded={open} aria-controls="fit3-setup" onClick={() => setOpen(v => !v)}>Connect Samsung Galaxy Fit3 via phone</Button>
    {open && <div id="fit3-setup" className="grid gap-3 rounded-lg bg-surface-2 p-4 text-sm">
      <ol className="list-decimal space-y-3 pl-5">
        <li>Pair the Fit3 with Galaxy Wearable on your phone, then sync a heart-rate measurement into Samsung Health.</li>
        <li>In Samsung Health, enable Health Connect sharing and allow writing heart-rate data. These permissions are controlled on the phone.</li>
        <li>On an <strong>Android 14 or later phone</strong>, install the Health7 Fit3 Bridge test app below, grant heart-rate read permission, and sign in to your Health7 server.</li>
        <li>Read a preview in the phone app, authorize the upload, then press Send. Back here, press Refresh imported history to see the uploaded records.</li>
      </ol>
      <a href={`${import.meta.env.BASE_URL}downloads/health7-fit3-bridge-debug.apk`} download className="self-start font-semibold text-interactive underline">Download Health7 Fit3 Bridge for Android phone (test APK)</a>
      <p>Install this APK on the <strong>phone</strong>. It does not install on the Fit3. This prototype needs a physical test with your phone and band; the exact data available depends on Samsung Health sharing.</p>
      {loopback ? <p className="font-semibold">This page uses a local server. On the phone, “localhost” refers to the phone itself. Use this computer’s Wi-Fi IP and API port 3001; both devices must be on the same network and the API must allow network access.</p>
        : <p className="break-all">Health7 API server to enter in the phone app: <strong>{server}</strong></p>}
      <p>Use HTTPS when deployed. The test app also accepts a private-network HTTP address for local development. It keeps sign-in credentials and session in memory and uploads only after authorization.</p>
      <a className="self-start font-semibold text-interactive underline" href="https://developer.samsung.com/health/health-connect-faq.html" target="_blank" rel="noreferrer">Samsung: Health Connect sharing and synchronization ↗</a>
    </div>}
    <p role="status" className="text-sm">{latest ? `Phone upload received: ${new Date(latest.receivedAt).toLocaleString()}. Source: Samsung Health; device identity comes from phone metadata.` : 'No Samsung Health phone upload in the loaded history yet.'}</p>
    <p className="text-xs text-ink-soft">Phone synchronization is separate from a live BLE heart-rate stream. The phone bridge currently reads heart rate only; it does not modify clinical alerts or simulated check-ups.</p>
  </Panel>
}
