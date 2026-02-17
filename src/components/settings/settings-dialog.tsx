import { useEffect, useState } from "react";
import { useAuth, useConfig } from "@/api/hooks";
import { store } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Moon, Sun, LogOut } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [tab, setTab] = useState("general");
  const [theme, setTheme] = useState(store.getTheme());
  const { logoutMutation } = useAuth();
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

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    store.setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function handleSaveConfig() {
    try {
      await setConfigMutation.mutateAsync({
        max_download_speed: parseFloat(maxDownload),
        max_upload_speed: parseFloat(maxUpload),
        max_connections_global: parseInt(maxConnections),
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
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
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-xs text-muted-foreground">Toggle dark/light mode</p>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === "dark" ? (
                    <><Sun className="mr-1.5 h-3.5 w-3.5" /> Light</>
                  ) : (
                    <><Moon className="mr-1.5 h-3.5 w-3.5" /> Dark</>
                  )}
                </Button>
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
            <div className="mt-3 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-dl">Max Download Speed (KiB/s, -1 = unlimited)</Label>
                <Input id="max-dl" value={maxDownload} onChange={(e) => setMaxDownload(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-ul">Max Upload Speed (KiB/s, -1 = unlimited)</Label>
                <Input id="max-ul" value={maxUpload} onChange={(e) => setMaxUpload(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-conn">Max Connections (-1 = unlimited)</Label>
                <Input id="max-conn" value={maxConnections} onChange={(e) => setMaxConnections(e.target.value)} />
              </div>
              <Button onClick={handleSaveConfig} disabled={setConfigMutation.isPending}>
                {setConfigMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
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
                  <li><kbd className="rounded bg-muted px-1">Space</kbd> — Pause/Resume</li>
                  <li><kbd className="rounded bg-muted px-1">Delete</kbd> — Remove</li>
                  <li><kbd className="rounded bg-muted px-1">Esc</kbd> — Deselect</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
