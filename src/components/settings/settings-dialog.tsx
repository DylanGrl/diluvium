import { useState } from "react";
import { useAuth } from "@/api/hooks";
import { store, applyTheme, type ThemeMode } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Bell, BellOff, LogOut } from "lucide-react";
import { DownloadsTab } from "./downloads-tab";
import { SpeedTab } from "./speed-tab";
import { QueueTab } from "./queue-tab";
import { NetworkTab } from "./network-tab";
import { EncryptionTab } from "./encryption-tab";
import { ProxyTab } from "./proxy-tab";
import { CacheTab } from "./cache-tab";
import { PluginsTab } from "./plugins-tab";

const THEMES: { id: ThemeMode; label: string; preview: string }[] = [
  { id: "light", label: "Light", preview: "bg-white border-zinc-200" },
  { id: "dark", label: "Dark", preview: "bg-zinc-900 border-zinc-700" },
  { id: "system", label: "System", preview: "bg-gradient-to-r from-white to-zinc-900 border-zinc-400" },
  { id: "catppuccin", label: "Catppuccin", preview: "bg-[#1e1e2e] border-[#cba6f7]" },
  { id: "catppuccin-latte", label: "Catppuccin Latte", preview: "bg-[#eff1f5] border-[#8839ef]" },
  { id: "nord", label: "Nord", preview: "bg-[#2e3440] border-[#88c0d0]" },
  { id: "nord-light", label: "Nord Light", preview: "bg-[#eceff4] border-[#5e81ac]" },
];

const TABS = [
  { id: "general", label: "General" },
  { id: "downloads", label: "Downloads" },
  { id: "speed", label: "Speed" },
  { id: "queue", label: "Queue" },
  { id: "network", label: "Network" },
  { id: "encryption", label: "Encryption" },
  { id: "proxy", label: "Proxy" },
  { id: "cache", label: "Cache" },
  { id: "plugins", label: "Plugins" },
  { id: "about", label: "About" },
] as const;

type TabId = typeof TABS[number]["id"];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [tab, setTab] = useState<TabId>("general");
  const [theme, setTheme] = useState<ThemeMode>(store.getTheme());
  const [notificationsEnabled, setNotificationsEnabled] = useState(store.getNotificationsEnabled());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );
  const { logoutMutation } = useAuth();

  function setThemeMode(mode: ThemeMode) {
    setTheme(mode);
    store.setTheme(mode);
    applyTheme(mode);
  }

  function toggleNotifications(enabled: boolean) {
    setNotificationsEnabled(enabled);
    store.setNotificationsEnabled(enabled);
  }

  async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      toggleNotifications(true);
      toast.success("Notifications enabled");
    } else {
      toast.error("Notification permission denied");
    }
  }

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Logout failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar nav */}
          <nav className="w-36 shrink-0 border-r py-3 flex flex-col gap-0.5 overflow-y-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "w-full text-left px-4 py-1.5 text-sm rounded-none transition-colors",
                  tab === t.id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {tab === "general" && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium mb-1">Theme</p>
                  <p className="text-xs text-muted-foreground mb-3">Choose your preferred appearance</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeMode(t.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border border-border p-2 text-xs transition-colors",
                          theme === t.id ? "ring-2 ring-ring bg-accent" : "hover:bg-muted"
                        )}
                      >
                        <div className={`h-6 w-10 rounded border-2 ${t.preview}`} />
                        <span className="text-[10px] leading-tight">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Get a desktop notification when a torrent finishes downloading.
                  </p>
                  {notifPermission === "granted" ? (
                    <Button variant="outline" size="sm" onClick={() => toggleNotifications(!notificationsEnabled)}>
                      {notificationsEnabled ? (
                        <><Bell className="mr-1.5 h-3.5 w-3.5" />Enabled — click to disable</>
                      ) : (
                        <><BellOff className="mr-1.5 h-3.5 w-3.5" />Disabled — click to enable</>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={requestNotificationPermission} disabled={notifPermission === "denied"}>
                      <Bell className="mr-1.5 h-3.5 w-3.5" />
                      {notifPermission === "denied" ? "Blocked by browser — allow in browser settings" : "Allow notifications"}
                    </Button>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Logout
                  </Button>
                </div>
              </div>
            )}

            {tab === "downloads" && <DownloadsTab />}
            {tab === "speed" && <SpeedTab />}
            {tab === "queue" && <QueueTab />}
            {tab === "network" && <NetworkTab />}
            {tab === "encryption" && <EncryptionTab />}
            {tab === "proxy" && <ProxyTab />}
            {tab === "cache" && <CacheTab />}
            {tab === "plugins" && <PluginsTab />}

            {tab === "about" && (
              <div className="space-y-2 text-sm">
                <p className="text-lg font-semibold">Diluvium</p>
                <p className="text-muted-foreground">A modern web UI for Deluge BitTorrent client.</p>
                <p className="text-xs text-muted-foreground">Version 0.2.0</p>
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
