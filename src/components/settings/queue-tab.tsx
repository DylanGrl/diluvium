import { useEffect, useState } from "react";
import { useConfig } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function QueueTab() {
  const { configQuery, setConfigMutation } = useConfig();

  const [maxActiveDl, setMaxActiveDl] = useState("");
  const [maxActiveSeed, setMaxActiveSeed] = useState("");
  const [maxActiveLimit, setMaxActiveLimit] = useState("");
  const [dontCountSlow, setDontCountSlow] = useState(false);
  const [queueNewToTop, setQueueNewToTop] = useState(false);
  const [addPaused, setAddPaused] = useState(false);
  const [stopSeedAtRatio, setStopSeedAtRatio] = useState(false);
  const [stopSeedRatio, setStopSeedRatio] = useState("");
  const [removeSeedAtRatio, setRemoveSeedAtRatio] = useState(false);
  const [shareRatioLimit, setShareRatioLimit] = useState("");
  const [seedTimeLimit, setSeedTimeLimit] = useState("");

  useEffect(() => {
    if (!configQuery.data) return;
    const c = configQuery.data;
    setMaxActiveDl(String(c.max_active_downloading ?? 3));
    setMaxActiveSeed(String(c.max_active_seeding ?? 5));
    setMaxActiveLimit(String(c.max_active_limit ?? 8));
    setDontCountSlow(Boolean(c.dont_count_slow_torrents ?? false));
    setQueueNewToTop(Boolean(c.queue_new_to_top ?? false));
    setAddPaused(Boolean(c.add_paused ?? false));
    setStopSeedAtRatio(Boolean(c.stop_seed_at_ratio ?? false));
    setStopSeedRatio(String(c.stop_seed_ratio ?? 2.0));
    setRemoveSeedAtRatio(Boolean(c.remove_seed_at_ratio ?? false));
    setShareRatioLimit(String(c.share_ratio_limit ?? 2.0));
    setSeedTimeLimit(String(c.seed_time_limit ?? 180));
  }, [configQuery.data]);

  async function handleSave() {
    const maxDl = parseInt(maxActiveDl);
    const maxSeed = parseInt(maxActiveSeed);
    const maxLimit = parseInt(maxActiveLimit);
    const stopRatio = parseFloat(stopSeedRatio);
    const shareRatio = parseFloat(shareRatioLimit);
    const seedTime = parseInt(seedTimeLimit);
    if ([maxDl, maxSeed, maxLimit, stopRatio, shareRatio, seedTime].some(isNaN)) {
      toast.error("Please enter valid numbers");
      return;
    }
    try {
      await setConfigMutation.mutateAsync({
        max_active_downloading: maxDl,
        max_active_seeding: maxSeed,
        max_active_limit: maxLimit,
        dont_count_slow_torrents: dontCountSlow,
        queue_new_to_top: queueNewToTop,
        add_paused: addPaused,
        stop_seed_at_ratio: stopSeedAtRatio,
        stop_seed_ratio: stopRatio,
        remove_seed_at_ratio: removeSeedAtRatio,
        share_ratio_limit: shareRatio,
        seed_time_limit: seedTime,
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Active limits (-1 = unlimited)</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="max-dl">Downloading</Label>
            <Input id="max-dl" type="number" value={maxActiveDl} onChange={(e) => setMaxActiveDl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-seed">Seeding</Label>
            <Input id="max-seed" type="number" value={maxActiveSeed} onChange={(e) => setMaxActiveSeed(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-total">Total active</Label>
            <Input id="max-total" type="number" value={maxActiveLimit} onChange={(e) => setMaxActiveLimit(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Behaviour</p>
        {[
          { label: "Don't count slow torrents toward limits", value: dontCountSlow, onChange: setDontCountSlow },
          { label: "Queue new torrents to top", value: queueNewToTop, onChange: setQueueNewToTop },
          { label: "Add torrents in paused state", value: addPaused, onChange: setAddPaused },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="flex items-center justify-between border rounded-md px-3 py-2.5">
            <p className="text-sm">{label}</p>
            <Switch checked={value} onCheckedChange={onChange} />
          </div>
        ))}
      </div>

      <div className="space-y-3 border rounded-md p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seeding goals</p>
        <div className="flex items-center justify-between">
          <p className="text-sm">Stop seeding at ratio</p>
          <Switch checked={stopSeedAtRatio} onCheckedChange={setStopSeedAtRatio} />
        </div>
        {stopSeedAtRatio && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stop-ratio">Stop ratio</Label>
              <Input id="stop-ratio" type="number" step="0.1" value={stopSeedRatio} onChange={(e) => setStopSeedRatio(e.target.value)} />
            </div>
            <div className="flex items-center justify-between pt-5">
              <p className="text-sm">Remove on stop</p>
              <Switch checked={removeSeedAtRatio} onCheckedChange={setRemoveSeedAtRatio} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="share-ratio">Share ratio limit</Label>
            <Input id="share-ratio" type="number" step="0.1" value={shareRatioLimit} onChange={(e) => setShareRatioLimit(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seed-time">Seed time limit (min)</Label>
            <Input id="seed-time" type="number" value={seedTimeLimit} onChange={(e) => setSeedTimeLimit(e.target.value)} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
