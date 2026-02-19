import { useEffect, useState } from "react";
import { useAuth, useConfig } from "@/api/hooks";
import { store, applyTheme, type ThemeMode } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

const THEMES: { id: ThemeMode; label: string; preview: string }[] = [
  { id: "light", label: "Light", preview: "bg-white border-zinc-200" },
  { id: "dark", label: "Dark", preview: "bg-zinc-900 border-zinc-700" },
  { id: "system", label: "System", preview: "bg-gradient-to-r from-white to-zinc-900 border-zinc-400" },
  { id: "catppuccin", label: "Catppuccin", preview: "bg-[#1e1e2e] border-[#cba6f7]" },
  { id: "catppuccin-latte", label: "Catppuccin Latte", preview: "bg-[#eff1f5] border-[#8839ef]" },
  { id: "nord", label: "Nord", preview: "bg-[#2e3440] border-[#88c0d0]" },
  { id: "nord-light", label: "Nord Light", preview: "bg-[#eceff4] border-[#5e81ac]" },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [tab, setTab] = useState("general");
  const [theme, setTheme] = useState<ThemeMode>(store.getTheme());
  const { logoutMutation } = useAuth();

  function setThemeMode(mode: ThemeMode) {
    setTheme(mode);
    store.setTheme(mode);
    applyTheme(mode);
  }

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="speed">Speed Limits</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="mt-3 space-y-4">
              <div>
                <Label>Theme</Label>
                <p className="text-xs text-muted-foreground mb-2">Choose your preferred appearance</p>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeMode(t.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border border-border p-2 text-xs transition-colors ${
                        theme === t.id
                          ? "ring-2 ring-ring bg-accent"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className={`h-6 w-10 rounded border-2 ${t.preview}`} />
                      <span className="text-[10px] leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Logout
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="speed">
            {tab === "speed" && <SpeedLimitsTab />}
          </TabsContent>

          <TabsContent value="about">
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-lg font-semibold">Diluvium</p>
              <p className="text-muted-foreground">
                A modern web UI for Deluge BitTorrent client.
              </p>
              <p className="text-xs text-muted-foreground">
                Version 0.1.0
              </p>
              <div className="pt-2 text-xs text-muted-foreground">
                <p>Keyboard shortcuts:</p>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li><kbd className="rounded bg-muted px-1">A</kbd> — Add torrent</li>
                  <li><kbd className="rounded bg-muted px-1">N</kbd> — Generate NFO</li>
                  <li><kbd className="rounded bg-muted px-1">Space</kbd> — Pause/Resume</li>
                  <li><kbd className="rounded bg-muted px-1">Delete</kbd> — Remove</li>
                  <li><kbd className="rounded bg-muted px-1">Esc</kbd> — Deselect</li>
                  <li><kbd className="rounded bg-muted px-1">Ctrl+A</kbd> — Select All</li>
                  <li><kbd className="rounded bg-muted px-1">Ctrl+F</kbd> — Search</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SpeedLimitsTab() {
  const { configQuery, setConfigMutation } = useConfig();
  const [maxDownload, setMaxDownload] = useState("");
  const [maxUpload, setMaxUpload] = useState("");
  const [maxConnections, setMaxConnections] = useState("");

  useEffect(() => {
    if (configQuery.data) {
      const c = configQuery.data;
      setMaxDownload(String(c.max_download_speed ?? -1));
      setMaxUpload(String(c.max_upload_speed ?? -1));
      setMaxConnections(String(c.max_connections_global ?? -1));
    }
  }, [configQuery.data]);

  async function handleSaveConfig() {
    const dl = parseFloat(maxDownload);
    const ul = parseFloat(maxUpload);
    const conn = parseInt(maxConnections);
    if (isNaN(dl) || isNaN(ul) || isNaN(conn)) {
      toast.error("Please enter valid numbers (-1 for unlimited)");
      return;
    }
    try {
      await setConfigMutation.mutateAsync({
        max_download_speed: dl,
        max_upload_speed: ul,
        max_connections_global: conn,
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <div className="mt-3 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="max-dl">Max Download Speed (KiB/s, -1 = unlimited)</Label>
        <Input id="max-dl" type="number" step="any" value={maxDownload} onChange={(e) => setMaxDownload(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max-ul">Max Upload Speed (KiB/s, -1 = unlimited)</Label>
        <Input id="max-ul" type="number" step="any" value={maxUpload} onChange={(e) => setMaxUpload(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max-conn">Max Connections (-1 = unlimited)</Label>
        <Input id="max-conn" type="number" value={maxConnections} onChange={(e) => setMaxConnections(e.target.value)} />
      </div>
      <Button onClick={handleSaveConfig} disabled={setConfigMutation.isPending}>
        {setConfigMutation.isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
