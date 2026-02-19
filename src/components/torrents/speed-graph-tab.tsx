import { useState, useEffect } from "react";
import type { TorrentStatus } from "@/api/types";
import { formatSpeed } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

interface SpeedPoint {
  time: number;
  down: number;
  up: number;
}

export function SpeedGraphTab({ torrent, contentHeight }: { torrent: TorrentStatus; contentHeight: number }) {
  const [history, setHistory] = useState<SpeedPoint[]>([]);

  useEffect(() => {
    setHistory((prev) => {
      const next = [
        ...prev,
        { time: Date.now(), down: torrent.download_payload_rate, up: torrent.upload_payload_rate },
      ];
      // Keep last 60 data points (3s polling = ~3 minutes)
      return next.slice(-60);
    });
  }, [torrent.download_payload_rate, torrent.upload_payload_rate]);

  return (
    <div style={{ height: contentHeight }} className="px-4 py-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <XAxis dataKey="time" hide />
          <YAxis
            tickFormatter={(v: number) => formatSpeed(v)}
            width={70}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            formatter={(value) => formatSpeed(value as number)}
            labelFormatter={() => ""}
            contentStyle={{ fontSize: 11, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 6 }}
          />
          <Line type="monotone" dataKey="down" stroke="var(--dl)" strokeWidth={1.5} dot={false} name="Download" />
          <Line type="monotone" dataKey="up" stroke="var(--ul)" strokeWidth={1.5} dot={false} name="Upload" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
