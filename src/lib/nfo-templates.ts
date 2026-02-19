import { formatBytes, formatDate } from "@/lib/utils";

export interface NFOData {
  name: string;
  hash: string;
  totalSize: number;
  files: { path: string; size: number }[];
  tracker: string;
  dateAdded: number;
  pieceSize: number;
  numPieces: number;
  creator: string;
  comment: string;
  notes: string;
}

export type TemplateId = "minimal" | "detailed" | "fancy";

export const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "minimal", label: "Minimal" },
  { id: "detailed", label: "Detailed" },
  { id: "fancy", label: "Fancy" },
];

export function generateNFO(data: NFOData, template: TemplateId): string {
  switch (template) {
    case "minimal":
      return generateMinimal(data);
    case "detailed":
      return generateDetailed(data);
    case "fancy":
      return generateFancy(data);
  }
}

function generateMinimal(d: NFOData): string {
  const lines: string[] = [];
  lines.push(d.name);
  lines.push("");
  lines.push(`Size:      ${formatBytes(d.totalSize)}`);
  lines.push(`Hash:      ${d.hash}`);
  if (d.tracker) lines.push(`Tracker:   ${d.tracker}`);
  if (d.dateAdded) lines.push(`Added:     ${formatDate(d.dateAdded)}`);
  if (d.pieceSize > 0) lines.push(`Pieces:    ${d.numPieces} x ${formatBytes(d.pieceSize)}`);
  if (d.comment) lines.push(`Comment:   ${d.comment}`);
  if (d.creator) lines.push(`Creator:   ${d.creator}`);

  if (d.files.length > 0) {
    lines.push("");
    lines.push("Files:");
    for (const f of d.files) {
      lines.push(`  ${f.path} (${formatBytes(f.size)})`);
    }
  }

  if (d.notes) {
    lines.push("");
    lines.push("Notes:");
    lines.push(d.notes);
  }

  return lines.join("\n");
}

function generateDetailed(d: NFOData): string {
  const sep = "─".repeat(60);
  const lines: string[] = [];

  lines.push(sep);
  lines.push(`  ${d.name}`);
  lines.push(sep);
  lines.push("");
  lines.push("  General Information");
  lines.push("  " + "─".repeat(40));
  lines.push(`  Name .......... ${d.name}`);
  lines.push(`  Size .......... ${formatBytes(d.totalSize)}`);
  lines.push(`  Hash .......... ${d.hash}`);
  if (d.tracker) lines.push(`  Tracker ....... ${d.tracker}`);
  if (d.dateAdded) lines.push(`  Added ......... ${formatDate(d.dateAdded)}`);
  if (d.pieceSize > 0) {
    lines.push(`  Piece Size .... ${formatBytes(d.pieceSize)}`);
    lines.push(`  Pieces ........ ${d.numPieces}`);
  }
  if (d.comment) lines.push(`  Comment ....... ${d.comment}`);
  if (d.creator) lines.push(`  Creator ....... ${d.creator}`);

  if (d.files.length > 0) {
    lines.push("");
    lines.push("  File Listing");
    lines.push("  " + "─".repeat(40));
    const maxPathLen = Math.max(...d.files.map((f) => f.path.length), 10);
    for (const f of d.files) {
      const sizeStr = formatBytes(f.size);
      lines.push(`  ${f.path.padEnd(maxPathLen + 2)} ${sizeStr}`);
    }
    lines.push("");
    lines.push(`  ${d.files.length} file${d.files.length !== 1 ? "s" : ""}, ${formatBytes(d.totalSize)} total`);
  }

  if (d.notes) {
    lines.push("");
    lines.push("  Notes");
    lines.push("  " + "─".repeat(40));
    for (const line of d.notes.split("\n")) {
      lines.push(`  ${line}`);
    }
  }

  lines.push("");
  lines.push(sep);
  return lines.join("\n");
}

function generateFancy(d: NFOData): string {
  const W = 64;
  const lines: string[] = [];

  function pad(s: string, width: number): string {
    if (s.length >= width) return s.slice(0, width);
    return s + " ".repeat(width - s.length);
  }

  function center(s: string, width: number): string {
    if (s.length >= width) return s.slice(0, width);
    const left = Math.floor((width - s.length) / 2);
    const right = width - s.length - left;
    return " ".repeat(left) + s + " ".repeat(right);
  }

  function boxLine(content: string): string {
    return `║ ${pad(content, W - 4)} ║`;
  }

  function boxCenter(content: string): string {
    return `║ ${center(content, W - 4)} ║`;
  }

  const topBorder = "╔" + "═".repeat(W - 2) + "╗";
  const botBorder = "╚" + "═".repeat(W - 2) + "╝";
  const midBorder = "╠" + "═".repeat(W - 2) + "╣";
  const emptyLine = "║" + " ".repeat(W - 2) + "║";

  // Title
  lines.push(topBorder);
  lines.push(emptyLine);
  // Split name if too long
  const nameWidth = W - 6;
  if (d.name.length <= nameWidth) {
    lines.push(boxCenter(d.name));
  } else {
    const words = d.name.split(/[\s._-]+/);
    let current = "";
    for (const word of words) {
      if (current && (current + " " + word).length > nameWidth) {
        lines.push(boxCenter(current));
        current = word;
      } else {
        current = current ? current + " " + word : word;
      }
    }
    if (current) lines.push(boxCenter(current));
  }
  lines.push(emptyLine);
  lines.push(midBorder);

  // Info section
  lines.push(emptyLine);
  lines.push(boxLine(`Size:       ${formatBytes(d.totalSize)}`));
  lines.push(boxLine(`Hash:       ${d.hash}`));
  if (d.tracker) lines.push(boxLine(`Tracker:    ${d.tracker}`));
  if (d.dateAdded) lines.push(boxLine(`Added:      ${formatDate(d.dateAdded)}`));
  if (d.pieceSize > 0) {
    lines.push(boxLine(`Pieces:     ${d.numPieces} x ${formatBytes(d.pieceSize)}`));
  }
  if (d.comment) lines.push(boxLine(`Comment:    ${d.comment}`));
  if (d.creator) lines.push(boxLine(`Creator:    ${d.creator}`));

  // Files section
  if (d.files.length > 0) {
    lines.push(emptyLine);
    lines.push(midBorder);
    lines.push(emptyLine);
    lines.push(boxCenter("File Listing"));
    lines.push(emptyLine);
    for (const f of d.files) {
      const sizeStr = formatBytes(f.size);
      const maxPath = W - 8 - sizeStr.length;
      const path = f.path.length > maxPath ? "..." + f.path.slice(-(maxPath - 3)) : f.path;
      lines.push(boxLine(`${path.padEnd(maxPath + 2)} ${sizeStr}`));
    }
    lines.push(emptyLine);
    lines.push(boxCenter(`${d.files.length} file${d.files.length !== 1 ? "s" : ""} — ${formatBytes(d.totalSize)}`));
  }

  // Notes section
  if (d.notes) {
    lines.push(emptyLine);
    lines.push(midBorder);
    lines.push(emptyLine);
    for (const line of d.notes.split("\n")) {
      lines.push(boxLine(line));
    }
  }

  lines.push(emptyLine);
  lines.push(botBorder);
  return lines.join("\n");
}
