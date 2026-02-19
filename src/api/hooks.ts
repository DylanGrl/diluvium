import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { delugeClient } from "./client";
import type { Peer, TorrentNFOData, TorrentStatus, UpdateUIResult } from "./types";

export const TORRENT_FIELDS: (keyof TorrentStatus)[] = [
  "hash",
  "name",
  "state",
  "progress",
  "size",
  "total_size",
  "download_payload_rate",
  "upload_payload_rate",
  "eta",
  "ratio",
  "num_seeds",
  "total_seeds",
  "num_peers",
  "total_peers",
  "save_path",
  "time_added",
  "tracker_host",
  "label",
  "is_auto_managed",
  "max_download_speed",
  "max_upload_speed",
  "max_connections",
  "max_upload_slots",
  "total_done",
  "total_uploaded",
  "total_wanted",
  "completed_time",
  "active_time",
  "seeding_time",
  "comment",
  "message",
  "queue",
];

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function useAuth() {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: () => delugeClient.checkSession(),
    retry: false,
    staleTime: 30_000,
  });

  const loginMutation = useMutation({
    mutationFn: (password: string) => delugeClient.login(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => delugeClient.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      queryClient.clear();
    },
  });

  return { sessionQuery, loginMutation, logoutMutation };
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

export function useConnection() {
  const queryClient = useQueryClient();

  const hostsQuery = useQuery({
    queryKey: ["connection", "hosts"],
    queryFn: () => delugeClient.getHosts(),
  });

  const connectedQuery = useQuery({
    queryKey: ["connection", "connected"],
    queryFn: () => delugeClient.connected(),
    refetchInterval: 10_000,
  });

  const connectMutation = useMutation({
    mutationFn: (hostId: string) => delugeClient.connect(hostId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection", "connected"] });
    },
  });

  async function connectToFirst() {
    const hosts = hostsQuery.data;
    if (hosts && hosts.length > 0) {
      connectMutation.mutate(hosts[0][0]);
    }
  }

  return { hostsQuery, connectedQuery, connectMutation, connectToFirst };
}

// ---------------------------------------------------------------------------
// Main UI polling
// ---------------------------------------------------------------------------

export function useUpdateUI(
  filterDict: Record<string, string> = {},
  enabled = true,
  interval = 3000,
) {
  return useQuery<UpdateUIResult>({
    queryKey: ["updateUI", filterDict],
    queryFn: () =>
      delugeClient.updateUI(
        TORRENT_FIELDS as string[],
        filterDict,
      ) as Promise<UpdateUIResult>,
    enabled,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
  });
}

// ---------------------------------------------------------------------------
// External IP
// ---------------------------------------------------------------------------

export function useExternalIP(enabled = true) {
  return useQuery<string>({
    queryKey: ["externalIP"],
    queryFn: () => delugeClient.getExternalIP(),
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Single torrent detail
// ---------------------------------------------------------------------------

export function useTorrentStatus(hash: string | null) {
  return useQuery<TorrentStatus>({
    queryKey: ["torrent", "status", hash],
    queryFn: () =>
      delugeClient.getTorrentStatus(
        hash!,
        TORRENT_FIELDS as string[],
      ) as Promise<TorrentStatus>,
    enabled: !!hash,
    refetchInterval: 3000,
  });
}

// ---------------------------------------------------------------------------
// Torrent files
// ---------------------------------------------------------------------------

export function useTorrentFiles(hash: string | null) {
  return useQuery<unknown>({
    queryKey: ["torrent", "files", hash],
    queryFn: () => delugeClient.getTorrentFiles(hash!),
    enabled: !!hash,
  });
}

// ---------------------------------------------------------------------------
// Torrent peers
// ---------------------------------------------------------------------------

export function useTorrentPeers(hash: string | null) {
  return useQuery<{ peers: Peer[] }>({
    queryKey: ["torrent", "peers", hash],
    queryFn: () =>
      delugeClient.getTorrentPeers(hash!) as Promise<{ peers: Peer[] }>,
    enabled: !!hash,
    refetchInterval: 3000,
  });
}

// ---------------------------------------------------------------------------
// Torrent actions
// ---------------------------------------------------------------------------

export function useTorrentActions() {
  const queryClient = useQueryClient();

  const invalidateTorrents = () => {
    queryClient.invalidateQueries({ queryKey: ["updateUI"] });
    queryClient.invalidateQueries({ queryKey: ["torrent"] });
  };

  const pauseMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.pauseTorrents(hashes),
    onSuccess: invalidateTorrents,
  });

  const resumeMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.resumeTorrents(hashes),
    onSuccess: invalidateTorrents,
  });

  const removeMutation = useMutation({
    mutationFn: ({
      hashes,
      removeData,
    }: {
      hashes: string[];
      removeData: boolean;
    }) => delugeClient.removeTorrents(hashes, removeData),
    onSuccess: invalidateTorrents,
  });

  const recheckMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.forceRecheck(hashes),
    onSuccess: invalidateTorrents,
  });

  const moveMutation = useMutation({
    mutationFn: ({ hash, dest }: { hash: string; dest: string }) =>
      delugeClient.moveTorrent(hash, dest),
    onSuccess: invalidateTorrents,
  });

  const queueTopMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.queueTop(hashes),
    onSuccess: invalidateTorrents,
  });

  const queueUpMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.queueUp(hashes),
    onSuccess: invalidateTorrents,
  });

  const queueDownMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.queueDown(hashes),
    onSuccess: invalidateTorrents,
  });

  const queueBottomMutation = useMutation({
    mutationFn: (hashes: string[]) => delugeClient.queueBottom(hashes),
    onSuccess: invalidateTorrents,
  });

  const setOptionsMutation = useMutation({
    mutationFn: ({
      hash,
      options,
    }: {
      hash: string;
      options: Record<string, unknown>;
    }) => delugeClient.setTorrentOptions(hash, options),
    onSuccess: invalidateTorrents,
  });

  const setFilePrioritiesMutation = useMutation({
    mutationFn: ({
      hash,
      priorities,
    }: {
      hash: string;
      priorities: number[];
    }) => delugeClient.setTorrentFilePriorities(hash, priorities),
    onSuccess: invalidateTorrents,
  });

  return {
    pauseMutation,
    resumeMutation,
    removeMutation,
    recheckMutation,
    moveMutation,
    queueTopMutation,
    queueUpMutation,
    queueDownMutation,
    queueBottomMutation,
    setOptionsMutation,
    setFilePrioritiesMutation,
  };
}

// ---------------------------------------------------------------------------
// Add torrent
// ---------------------------------------------------------------------------

export function useAddTorrent() {
  const queryClient = useQueryClient();

  const invalidateTorrents = () => {
    queryClient.invalidateQueries({ queryKey: ["updateUI"] });
  };

  const addMagnetMutation = useMutation({
    mutationFn: ({
      uri,
      options = {},
    }: {
      uri: string;
      options?: Record<string, unknown>;
    }) => delugeClient.addTorrentMagnet(uri, options),
    onSuccess: invalidateTorrents,
  });

  const addUrlMutation = useMutation({
    mutationFn: ({
      url,
      options = {},
    }: {
      url: string;
      options?: Record<string, unknown>;
    }) => delugeClient.addTorrentUrl(url, options),
    onSuccess: invalidateTorrents,
  });

  const addFileMutation = useMutation({
    mutationFn: ({
      filename,
      filedump,
      options = {},
    }: {
      filename: string;
      filedump: string;
      options?: Record<string, unknown>;
    }) => delugeClient.addTorrentFile(filename, filedump, options),
    onSuccess: invalidateTorrents,
  });

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => delugeClient.uploadTorrentFile(file),
  });

  return { addMagnetMutation, addUrlMutation, addFileMutation, uploadFileMutation };
}

// ---------------------------------------------------------------------------
// NFO / Torrent creation
// ---------------------------------------------------------------------------

export function useTorrentNFOData(hash: string | null) {
  return useQuery<TorrentNFOData>({
    queryKey: ["torrent", "nfo", hash],
    queryFn: () =>
      delugeClient.getTorrentNFOData(hash!) as Promise<TorrentNFOData>,
    enabled: !!hash,
  });
}

export function useCreateTorrent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      path: string;
      tracker: string;
      pieceLength: number;
      comment: string;
      target: string;
      webseeds: string[];
      priv: boolean;
      createdBy: string;
      trackers: string[][];
      addToSession: boolean;
    }) =>
      delugeClient.createTorrent(
        params.path,
        params.tracker,
        params.pieceLength,
        params.comment,
        params.target,
        params.webseeds,
        params.priv,
        params.createdBy,
        params.trackers,
        params.addToSession,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updateUI"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Global config
// ---------------------------------------------------------------------------

export function useConfig() {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: () => delugeClient.getConfig(),
  });

  const setConfigMutation = useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      delugeClient.setConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });

  return { configQuery, setConfigMutation };
}
