import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PROXY_TYPES = [
  { value: "0", label: "None" },
  { value: "1", label: "SOCKS4" },
  { value: "2", label: "SOCKS5" },
  { value: "3", label: "SOCKS5 with auth" },
  { value: "4", label: "HTTP" },
  { value: "5", label: "HTTP with auth" },
];

function needsAuth(type: string) {
  return type === "3" || type === "5";
}

export function ProxyTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [proxyType, setProxyType] = useState("0");
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState("8080");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [proxyHostnames, setProxyHostnames] = useState(true);
  const [proxyPeers, setProxyPeers] = useState(true);
  const [proxyTrackers, setProxyTrackers] = useState(true);

  useEffect(() => {
    if (!configQuery.data) return;
    const proxy = configQuery.data.proxy as Record<string, unknown> | undefined;
    if (!proxy) return;
    setProxyType(String(proxy.type ?? 0));
    setHostname(String(proxy.hostname ?? ""));
    setPort(String(proxy.port ?? 8080));
    setUsername(String(proxy.username ?? ""));
    setPassword(String(proxy.password ?? ""));
    setProxyHostnames(Boolean(proxy.proxy_hostnames ?? true));
    setProxyPeers(Boolean(proxy.proxy_peer_connections ?? true));
    setProxyTrackers(Boolean(proxy.proxy_tracker_connections ?? true));
  }, [configQuery.data]);

  async function handleSave() {
    const portNum = parseInt(port);
    if (isNaN(portNum)) {
      toast.error("Please enter a valid port number");
      return;
    }
    const existingProxy = (configQuery.data?.proxy as Record<string, unknown>) ?? {};
    try {
      await setConfigMutation.mutateAsync({
        proxy: {
          ...existingProxy,
          type: parseInt(proxyType),
          hostname,
          port: portNum,
          username,
          password,
          proxy_hostnames: proxyHostnames,
          proxy_peer_connections: proxyPeers,
          proxy_tracker_connections: proxyTrackers,
        },
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (configQuery.isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (configQuery.isError) return <div className="py-8 text-center text-sm text-destructive">Failed to load config</div>;

  const showAuth = needsAuth(proxyType);
  const showServer = proxyType !== "0";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="proxy-type">Proxy type</Label>
        <Select id="proxy-type" value={proxyType} onChange={(e) => setProxyType(e.target.value)}>
          {PROXY_TYPES.map((o) => <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>)}
        </Select>
      </div>

      {showServer && (
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proxy-host">Hostname</Label>
            <Input id="proxy-host" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="proxy.example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-port">Port</Label>
            <Input id="proxy-port" type="number" value={port} onChange={(e) => setPort(e.target.value)} className="w-24" />
          </div>
        </div>
      )}

      {showAuth && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proxy-user">Username</Label>
            <Input id="proxy-user" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-pass">Password</Label>
            <Input id="proxy-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
      )}

      {showServer && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proxy scope</p>
          {[
            { label: "Proxy hostname lookups", value: proxyHostnames, onChange: setProxyHostnames },
            { label: "Proxy peer connections", value: proxyPeers, onChange: setProxyPeers },
            { label: "Proxy tracker connections", value: proxyTrackers, onChange: setProxyTrackers },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="flex items-center justify-between border rounded-md px-3 py-2.5">
              <p className="text-sm">{label}</p>
              <Switch checked={value} onCheckedChange={onChange} />
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
