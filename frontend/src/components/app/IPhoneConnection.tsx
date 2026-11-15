import { Smartphone } from 'lucide-react'
import { Panel, PanelHeader } from './Panel'
import { Button } from '@/components/ui/button'
import type { WearableHistory } from '@/lib/wearables'

export function IPhoneConnection({ apiOrigin, history }: { apiOrigin: string; history?: WearableHistory | null }) {
  const apple = history?.items.filter(s => s.source === 'apple') ?? []
  const latest = apple.map(s => s.receivedAt).sort().at(-1)
  return <Panel id="connect-iphone">
    <PanelHeader icon={<Smartphone />} title="Connect iPhone" subtitle="iOS companion app required" />
    <p className="text-sm text-ink-soft">Safari cannot read Apple Health. Install the Health7 companion from Xcode on your iPhone, then sign in to the same Health7 account.</p>
    <ol className="list-decimal space-y-2 pl-5 text-sm">
      <li>Keep the iPhone and notebook on the same Wi-Fi.</li>
      <li>In the companion, enter this server address: <code className="break-all select-all">{apiOrigin}</code></li>
      <li>Sign in, authorize Apple Health access and enable automatic sync. Sync runs every minute while the companion is open.</li>
      <li>Use “Refresh imported history” below to see received measurements. Stop sync or disconnect in the companion; revoke Health access in iPhone settings.</li>
    </ol>
    <p role="status" className="rounded-lg bg-surface-2 p-3 text-sm">{latest
      ? <>{apple.length} Apple measurement{apple.length === 1 ? '' : 's'} in the loaded history. Latest receipt: {new Date(latest).toLocaleString()}. Receipt confirms saved data, not a live device connection.</>
      : 'No Apple measurements received in the loaded history. Installing the companion on a physical iPhone requires a Mac with Xcode.'}</p>
    <p className="text-xs text-ink-soft">Reads heart rate, resting heart rate, oxygen saturation, respiratory rate and body mass when available and authorized. No direct Apple Watch pairing or background sync. Imported records stay separate from simulated check-ups and clinical alerts.</p>
    <Button variant="outline" className="self-start" onClick={() => document.getElementById('apple-file-import')?.scrollIntoView({ behavior: 'smooth' })}>Import Apple Health file instead</Button>
  </Panel>
}
