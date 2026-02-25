import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CacheTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [cacheSize, setCacheSize] = useState("");
  const [cacheExpiry, setCacheExpiry] = useState("");

  useEffect(() => {
    if (!configQuery.data) return;
    const c = configQuery.data;
    setCacheSize(String(c.cache_size ?? 512));
    setCacheExpiry(String(c.cache_expiry ?? 60));
  }, [configQuery.data]);

  async function handleSave() {
    const size = parseInt(cacheSize);
    const expiry = parseInt(cacheExpiry);
    if (isNaN(size) || isNaN(expiry)) {
      toast.error("Please enter valid numbers");
      return;
    }
    try {
      await setConfigMutation.mutateAsync({
        cache_size: size,
        cache_expiry: expiry,
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
        The read/write cache reduces disk I/O at the cost of memory. Larger caches improve performance for many simultaneous torrents.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="cache-size">Cache size (MiB)</Label>
        <Input id="cache-size" type="number" value={cacheSize} onChange={(e) => setCacheSize(e.target.value)} className="w-32" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cache-expiry">Cache expiry (seconds)</Label>
        <p className="text-xs text-muted-foreground">How long unread pieces stay in cache before being flushed to disk</p>
        <Input id="cache-expiry" type="number" value={cacheExpiry} onChange={(e) => setCacheExpiry(e.target.value)} className="w-32" />
      </div>

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
