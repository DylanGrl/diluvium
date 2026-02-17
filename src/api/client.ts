import type { DelugeRPCResponse } from "./types";

class DelugeClient {
  private id = 0;
  private baseUrl = "";

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    const response = await fetch(`${this.baseUrl}/json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: this.id++,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DelugeRPCResponse<T> = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result;
  }

  // Auth
  async login(password: string): Promise<boolean> {
    return this.call<boolean>("auth.login", [password]);
  }

  async checkSession(): Promise<boolean> {
    return this.call<boolean>("auth.check_session");
  }

  async logout(): Promise<void> {
    await this.call("auth.delete_session");
  }

  // Connection
  async getHosts(): Promise<[string, string, number, string][]> {
    return this.call("web.get_hosts");
  }

  async getHostStatus(
    hostId: string,
  ): Promise<[string, string, number, string, string, string]> {
    return this.call("web.get_host_status", [hostId]);
  }

  async connect(hostId: string): Promise<void> {
    await this.call("web.connect", [hostId]);
  }

  async connected(): Promise<boolean> {
    return this.call<boolean>("web.connected");
  }

  // Torrents
  async updateUI(
    keys: string[],
    filterDict: Record<string, string>,
  ): Promise<unknown> {
    return this.call("web.update_ui", [keys, filterDict]);
  }

  async getTorrentStatus(hash: string, keys: string[]): Promise<unknown> {
    return this.call("web.get_torrent_status", [hash, keys]);
  }

  async getTorrentFiles(hash: string): Promise<unknown> {
    return this.call("web.get_torrent_files", [hash]);
  }

  async getTorrentPeers(hash: string): Promise<unknown> {
    return this.call("core.get_torrent_status", [hash, ["peers"]]);
  }

  // Actions
  async pauseTorrents(hashes: string[]): Promise<void> {
    await this.call("core.pause_torrents", [hashes]);
  }

  async resumeTorrents(hashes: string[]): Promise<void> {
    await this.call("core.resume_torrents", [hashes]);
  }

  async removeTorrent(hash: string, removeData: boolean): Promise<boolean> {
    return this.call<boolean>("core.remove_torrent", [hash, removeData]);
  }

  async removeTorrents(
    hashes: string[],
    removeData: boolean,
  ): Promise<unknown> {
    return this.call("core.remove_torrents", [hashes, removeData]);
  }

  async addTorrentMagnet(
    uri: string,
    options: Record<string, unknown>,
  ): Promise<string> {
    return this.call<string>("core.add_torrent_magnet", [uri, options]);
  }

  async addTorrentUrl(
    url: string,
    options: Record<string, unknown>,
  ): Promise<string> {
    return this.call<string>("core.add_torrent_url", [url, options]);
  }

  async addTorrentFile(
    filename: string,
    filedump: string,
    options: Record<string, unknown>,
  ): Promise<string> {
    return this.call<string>("core.add_torrent_file", [
      filename,
      filedump,
      options,
    ]);
  }

  async uploadTorrentFile(file: File): Promise<string[]> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok)
      throw new Error(`Upload failed: ${response.statusText}`);
    const data = await response.json();
    return data.files as string[];
  }

  async setTorrentOptions(
    hash: string,
    options: Record<string, unknown>,
  ): Promise<void> {
    await this.call("core.set_torrent_options", [[hash], options]);
  }

  async setTorrentFilePriorities(
    hash: string,
    priorities: number[],
  ): Promise<void> {
    await this.call("core.set_torrent_file_priorities", [hash, priorities]);
  }

  async queueTop(hashes: string[]): Promise<void> {
    await this.call("core.queue_top", [hashes]);
  }

  async queueUp(hashes: string[]): Promise<void> {
    await this.call("core.queue_up", [hashes]);
  }

  async queueDown(hashes: string[]): Promise<void> {
    await this.call("core.queue_down", [hashes]);
  }

  async queueBottom(hashes: string[]): Promise<void> {
    await this.call("core.queue_bottom", [hashes]);
  }

  async forceRecheck(hashes: string[]): Promise<void> {
    await this.call("core.force_recheck", [hashes]);
  }

  async moveTorrent(hash: string, dest: string): Promise<void> {
    await this.call("core.move_storage", [[hash], dest]);
  }

  // Config
  async getConfig(): Promise<Record<string, unknown>> {
    return this.call("core.get_config");
  }

  async setConfig(config: Record<string, unknown>): Promise<void> {
    await this.call("core.set_config", [config]);
  }
}

export const delugeClient = new DelugeClient();
