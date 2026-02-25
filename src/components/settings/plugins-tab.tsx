import { usePlugins } from "@/api/hooks";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function PluginsTab() {
  const { pluginsQuery, enabledPlugins, availablePlugins, enableMutation, disableMutation } = usePlugins();

  async function handleToggle(name: string, currently: boolean) {
    try {
      if (currently) {
        await disableMutation.mutateAsync(name);
        toast.success(`${name} disabled`);
      } else {
        await enableMutation.mutateAsync(name);
        toast.success(`${name} enabled`);
      }
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (pluginsQuery.isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (pluginsQuery.isError) {
    return <div className="py-8 text-center text-sm text-destructive">Failed to load plugins</div>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Enable or disable Deluge plugins. Changes take effect immediately.
      </p>
      {availablePlugins.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No plugins available</p>
      )}
      {availablePlugins.map((name) => {
        const isEnabled = enabledPlugins.includes(name);
        const isBusy = enableMutation.isPending || disableMutation.isPending;
        return (
          <div key={name} className="flex items-center justify-between border rounded-md px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{name}</p>
              {isEnabled && <p className="text-xs text-ul">Active</p>}
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={() => handleToggle(name, isEnabled)}
              disabled={isBusy}
            />
          </div>
        );
      })}
    </div>
  );
}
