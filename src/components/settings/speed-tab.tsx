import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function SpeedField({ id, label, hint, value, onChange }: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Input id={id} type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function SpeedTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [maxDl, setMaxDl] = useState("");
  const [maxUl, setMaxUl] = useState("");
  const [maxDlPerTorrent, setMaxDlPerTorrent] = useState("");
  const [maxUlPerTorrent, setMaxUlPerTorrent] = useState("");
  const [maxConn, setMaxConn] = useState("");
  const [maxConnPerTorrent, setMaxConnPerTorrent] = useState("");
  const [maxUlSlots, setMaxUlSlots] = useState("");
  const [maxUlSlotsPerTorrent, setMaxUlSlotsPerTorrent] = useState("");

  useEffect(() => {
    if (!configQuery.data) return;
    const c = configQuery.data;
    setMaxDl(String(c.max_download_speed ?? -1));
    setMaxUl(String(c.max_upload_speed ?? -1));
    setMaxDlPerTorrent(String(c.max_download_speed_per_torrent ?? -1));
    setMaxUlPerTorrent(String(c.max_upload_speed_per_torrent ?? -1));
    setMaxConn(String(c.max_connections_global ?? 200));
    setMaxConnPerTorrent(String(c.max_connections_per_torrent ?? -1));
    setMaxUlSlots(String(c.max_upload_slots_global ?? 4));
    setMaxUlSlotsPerTorrent(String(c.max_upload_slots_per_torrent ?? -1));
  }, [configQuery.data]);

  async function handleSave() {
    const values = {
      max_download_speed: parseFloat(maxDl),
      max_upload_speed: parseFloat(maxUl),
      max_download_speed_per_torrent: parseFloat(maxDlPerTorrent),
      max_upload_speed_per_torrent: parseFloat(maxUlPerTorrent),
      max_connections_global: parseInt(maxConn),
      max_connections_per_torrent: parseInt(maxConnPerTorrent),
      max_upload_slots_global: parseInt(maxUlSlots),
      max_upload_slots_per_torrent: parseInt(maxUlSlotsPerTorrent),
    };
    if (Object.values(values).some(isNaN)) {
      toast.error("Please enter valid numbers (-1 for unlimited)");
      return;
    }
    try {
      await setConfigMutation.mutateAsync(values);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (configQuery.isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  if (configQuery.isError) return <div className="py-8 text-center text-sm text-destructive">Failed to load config</div>;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Global (-1 = unlimited)</p>
        <div className="grid grid-cols-2 gap-3">
          <SpeedField id="max-dl" label="Download (KiB/s)" value={maxDl} onChange={setMaxDl} />
          <SpeedField id="max-ul" label="Upload (KiB/s)" value={maxUl} onChange={setMaxUl} />
          <SpeedField id="max-conn" label="Connections" value={maxConn} onChange={setMaxConn} />
          <SpeedField id="max-ul-slots" label="Upload slots" value={maxUlSlots} onChange={setMaxUlSlots} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Per torrent (-1 = unlimited)</p>
        <div className="grid grid-cols-2 gap-3">
          <SpeedField id="max-dl-t" label="Download (KiB/s)" value={maxDlPerTorrent} onChange={setMaxDlPerTorrent} />
          <SpeedField id="max-ul-t" label="Upload (KiB/s)" value={maxUlPerTorrent} onChange={setMaxUlPerTorrent} />
          <SpeedField id="max-conn-t" label="Connections" value={maxConnPerTorrent} onChange={setMaxConnPerTorrent} />
          <SpeedField id="max-ul-slots-t" label="Upload slots" value={maxUlSlotsPerTorrent} onChange={setMaxUlSlotsPerTorrent} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
