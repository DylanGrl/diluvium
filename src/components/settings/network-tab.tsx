import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function NetworkTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [randomPort, setRandomPort] = useState(true);
  const [listenPortMin, setListenPortMin] = useState("");
  const [listenPortMax, setListenPortMax] = useState("");
  const [maxConnPerSecond, setMaxConnPerSecond] = useState("");
  const [ignoreLimitsLan, setIgnoreLimitsLan] = useState(true);
  const [rateLimitOverhead, setRateLimitOverhead] = useState(true);
  const [dht, setDht] = useState(true);
  const [upnp, setUpnp] = useState(true);
  const [natpmp, setNatpmp] = useState(true);
  const [utpex, setUtpex] = useState(true);
  const [lsd, setLsd] = useState(true);

  useEffect(() => {
    if (!configQuery.data) return;
    const c = configQuery.data;
    setRandomPort(Boolean(c.random_port ?? true));
    const ports = c.listen_ports as number[] | undefined;
    setListenPortMin(String(ports?.[0] ?? 6881));
    setListenPortMax(String(ports?.[1] ?? 6891));
    setMaxConnPerSecond(String(c.max_connections_per_second ?? 20));
    setIgnoreLimitsLan(Boolean(c.ignore_limits_on_local_network ?? true));
    setRateLimitOverhead(Boolean(c.rate_limit_ip_overhead ?? true));
    setDht(Boolean(c.dht ?? true));
    setUpnp(Boolean(c.upnp ?? true));
    setNatpmp(Boolean(c.natpmp ?? true));
    setUtpex(Boolean(c.utpex ?? true));
    setLsd(Boolean(c.lsd ?? true));
  }, [configQuery.data]);

  async function handleSave() {
    const portMin = parseInt(listenPortMin);
    const portMax = parseInt(listenPortMax);
    const connPerSec = parseInt(maxConnPerSecond);
    if ([portMin, portMax, connPerSec].some(isNaN)) {
      toast.error("Please enter valid numbers");
      return;
    }
    try {
      await setConfigMutation.mutateAsync({
        random_port: randomPort,
        listen_ports: [portMin, portMax],
        max_connections_per_second: connPerSec,
        ignore_limits_on_local_network: ignoreLimitsLan,
        rate_limit_ip_overhead: rateLimitOverhead,
        dht,
        upnp,
        natpmp,
        utpex,
        lsd,
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (configQuery.isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (configQuery.isError) return <div className="py-8 text-center text-sm text-destructive">Failed to load config</div>;

  return (
    <div className="space-y-5">
      <div className="space-y-3 border rounded-md p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Incoming port</p>
        <div className="flex items-center justify-between">
          <p className="text-sm">Use random port</p>
          <Switch checked={randomPort} onCheckedChange={setRandomPort} />
        </div>
        {!randomPort && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="port-min">From</Label>
              <Input id="port-min" type="number" value={listenPortMin} onChange={(e) => setListenPortMin(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="port-max">To</Label>
              <Input id="port-max" type="number" value={listenPortMax} onChange={(e) => setListenPortMax(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="conn-per-sec">Max connection attempts per second</Label>
        <Input id="conn-per-sec" type="number" value={maxConnPerSecond} onChange={(e) => setMaxConnPerSecond(e.target.value)} className="w-32" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bandwidth</p>
        {[
          { label: "Ignore limits on local network", value: ignoreLimitsLan, onChange: setIgnoreLimitsLan },
          { label: "Rate limit IP overhead", value: rateLimitOverhead, onChange: setRateLimitOverhead },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="flex items-center justify-between border rounded-md px-3 py-2.5">
            <p className="text-sm">{label}</p>
            <Switch checked={value} onCheckedChange={onChange} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Protocols</p>
        {[
          { label: "DHT (Distributed Hash Table)", value: dht, onChange: setDht },
          { label: "UPnP port mapping", value: upnp, onChange: setUpnp },
          { label: "NAT-PMP port mapping", value: natpmp, onChange: setNatpmp },
          { label: "Peer Exchange (PEX)", value: utpex, onChange: setUtpex },
          { label: "Local Service Discovery (LSD)", value: lsd, onChange: setLsd },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="flex items-center justify-between border rounded-md px-3 py-2.5">
            <p className="text-sm">{label}</p>
            <Switch checked={value} onCheckedChange={onChange} />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
