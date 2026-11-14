import { Orbit, Watch } from 'lucide-react'
import { Panel, PanelHeader } from './Panel'
import { arowUrl } from '@/lib/wearables'

export function MissionTracking() {
  return <Panel>
    <PanelHeader icon={<Orbit />} tone="blue" title="Artemis mission tracking" subtitle="AROW · official NASA resource" />
    <p className="text-sm text-ink-soft">Explore Orion position, mission information and NASA trajectory resources. Live tracking depends on mission operations and NASA availability.</p>
    <p className="text-xs text-ink-soft">External resource. No live Orion telemetry is loaded into Health7.</p>
    <a href={arowUrl} target="_blank" rel="noreferrer" className="self-start font-semibold text-interactive underline">Open NASA AROW information ↗</a>
  </Panel>
}
export function IntegrationLinks() {
  return <div className="mt-4 grid gap-4 md:grid-cols-2">
    <MissionTracking />
    <Panel>
      <PanelHeader icon={<Watch />} tone="orange" title="Watches & research devices" />
      <p className="text-sm text-ink-soft">Import and review measurements from Apple Health, Samsung, Garmin or ActLumus using supported files.</p>
      <p className="text-xs text-ink-soft">File import available. Automatic device connections require additional setup.</p>
      <a href="#/integrations" className="self-start font-semibold text-interactive underline">Mission & device integrations</a>
    </Panel>
  </div>
}
