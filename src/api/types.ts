export interface TorrentStatus {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number; // total_size
  total_size: number;
  download_payload_rate: number;
  upload_payload_rate: number;
  eta: number;
  ratio: number;
  num_seeds: number;
  total_seeds: number;
  num_peers: number;
  total_peers: number;
  save_path: string;
  time_added: number;
  tracker_host: string;
  label: string;
  is_auto_managed: boolean;
  max_download_speed: number;
  max_upload_speed: number;
  max_connections: number;
  max_upload_slots: number;
  total_done: number;
  total_uploaded: number;
  total_wanted: number;
  completed_time: number;
  active_time: number;
  seeding_time: number;
  comment: string;
  message: string;
  queue: number;
}

export interface TorrentFile {
  index: number;
  path: string;
  size: number;
  progress: number;
  priority: number;
  offset: number;
}

export interface Peer {
  ip: string;
  client: string;
  down_speed: number;
  up_speed: number;
  progress: number;
  country: string;
  seed: boolean;
}

export interface Tracker {
  url: string;
  tier: number;
  message: string;
  seeds: number;
  peers: number;
  next_announce: number;
  updating: boolean;
}

export interface UpdateUIResult {
  connected: boolean;
  torrents?: Record<string, TorrentStatus>;
  filters?: {
    state: [string, number][];
    tracker_host: [string, number][];
    label?: [string, number][];
  };
  stats: {
    upload_rate: number;
    download_rate: number;
    max_upload: number;
    max_download: number;
    num_connections: number;
    max_num_connections: number;
    upload_protocol_rate: number;
    download_protocol_rate: number;
    dht_nodes: number;
    free_space: number;
    has_incoming_connections: boolean;
  };
}

export interface HostStatus {
  id: string;
  host: string;
  port: number;
  user: string;
  status: string;
  version: string;
}

export type FilterState =
  | "All"
  | "Downloading"
  | "Seeding"
  | "Paused"
  | "Checking"
  | "Error"
  | "Active"
  | "Queued";

export interface TorrentNFOData {
  num_pieces: number;
  piece_length: number;
  creator: string;
  creation_date: number;
  trackers: { url: string; tier: number }[];
}

export interface DelugeRPCResponse<T = unknown> {
  id: number;
  result: T;
  error: { message: string; code: number } | null;
}
