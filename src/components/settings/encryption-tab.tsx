import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { toast } from "sonner";

const POLICY_OPTIONS = [
  { value: "0", label: "Disabled" },
  { value: "1", label: "Enabled" },
  { value: "2", label: "Forced" },
];

const LEVEL_OPTIONS = [
  { value: "0", label: "Plaintext only" },
  { value: "1", label: "RC4 only" },
  { value: "2", label: "Both (prefer RC4)" },
];

export function EncryptionTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [encIn, setEncIn] = useState("1");
  const [encOut, setEncOut] = useState("1");
  const [encLevel, setEncLevel] = useState("2");

  useEffect(() => {
    if (!configQuery.data) return;
    const c = configQuery.data;
    setEncIn(String(c.enc_in_policy ?? 1));
    setEncOut(String(c.enc_out_policy ?? 1));
    setEncLevel(String(c.enc_level ?? 2));
  }, [configQuery.data]);

  async function handleSave() {
    try {
      await setConfigMutation.mutateAsync({
        enc_in_policy: parseInt(encIn),
        enc_out_policy: parseInt(encOut),
        enc_level: parseInt(encLevel),
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
      <p className="text-xs text-muted-foreground">
        Controls BitTorrent protocol encryption between peers. "Enabled" allows both encrypted and plaintext connections. "Forced" rejects unencrypted peers.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="enc-in">Inbound policy</Label>
        <Select id="enc-in" value={encIn} onChange={(e) => setEncIn(e.target.value)}>
          {POLICY_OPTIONS.map((o) => <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>)}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="enc-out">Outbound policy</Label>
        <Select id="enc-out" value={encOut} onChange={(e) => setEncOut(e.target.value)}>
          {POLICY_OPTIONS.map((o) => <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>)}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="enc-level">Encryption level</Label>
        <Select id="enc-level" value={encLevel} onChange={(e) => setEncLevel(e.target.value)}>
          {LEVEL_OPTIONS.map((o) => <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>)}
        </Select>
      </div>

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
