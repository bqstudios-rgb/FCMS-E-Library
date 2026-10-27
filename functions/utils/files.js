export const MAX = 6 * 1024 * 1024;
export const STANDARD = 3 * 1024 * 1024;
export const MIME = {
  pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
};
const starts = (b, sig) => sig.every((v, i) => b[i] === v);

export function looksRight(ext, b) {
  if (ext === "pdf") return starts(b, [0x25, 0x50, 0x44, 0x46]);
  if (["docx", "xlsx", "pptx"].includes(ext)) return starts(b, [0x50, 0x4b, 0x03, 0x04]);
  if (["doc", "xls", "ppt"].includes(ext)) return starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (ext === "jpg" || ext === "jpeg") return starts(b, [0xff, 0xd8, 0xff]);
  if (ext === "png") return starts(b, [0x89, 0x50, 0x4e, 0x47]);
  if (ext === "txt") { for (let i = 0; i < b.length; i++) if (b[i] === 0) return false; return true; }
  return false;
}

export const cleanName = (n) => String(n || "file").replace(/[^\w.\- ]/g, "_").slice(0, 120);

export async function bufHash(buf) {
  const d = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}

export function newTicket() {
  return "MCL-" + String(10000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 90000));
}

export function newSecret() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  crypto.getRandomValues(new Uint8Array(8)).forEach((v, i) => { s += A[v % 32]; if (i === 3) s += "-"; });
  return s;
}
