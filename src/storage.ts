import Dexie, { type Table } from "dexie";
import { initialJournal, type Journal } from "./model";
class JournalDB extends Dexie {
  state!: Table<{ id: string; data: Journal }>;
  constructor() {
    super("tokyo-travel-journal");
    this.version(1).stores({ state: "id" });
  }
}
export const db = new JournalDB();
export async function loadJournal() {
  const row = await db.state.get("journal");
  if (row) return row.data;
  const data = initialJournal();
  await saveJournal(data);
  return data;
}
export async function saveJournal(data: Journal) {
  await db.state.put({ id: "journal", data });
}
export function parseBackup(text: string): Journal {
  const data: unknown = JSON.parse(text);
  const record = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  const str = (v: unknown) => typeof v === "string";
  const photos = (v: unknown) =>
    Array.isArray(v) &&
    v.every(
      (p) =>
        record(p) &&
        str(p.id) &&
        str(p.caption) &&
        typeof p.data === "string" &&
        /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data),
    );
  const rows = (
    v: unknown,
    keys: string[],
    check: (r: Record<string, unknown>) => boolean,
  ) =>
    Array.isArray(v) &&
    v.every((r) => record(r) && keys.every((k) => str(r[k])) && check(r)) &&
    new Set(v.map((r) => r.id)).size === v.length;
  if (
    !record(data) ||
    data.version !== 1 ||
    typeof data.rate !== "number" ||
    !Number.isFinite(data.rate) ||
    data.rate <= 0 ||
    !str(data.mapsUrl) ||
    !rows(
      data.entries,
      ["id", "date", "time", "name", "address", "notes", "url", "privateInfo"],
      (r) => /^2026-11-2[3-7]$/.test(String(r.date)) && photos(r.photos),
    ) ||
    !rows(
      data.places,
      ["id", "name", "category", "area", "url", "notes"],
      (r) => photos(r.photos),
    ) ||
    !rows(
      data.packing,
      ["id", "name", "category"],
      (r) => typeof r.done === "boolean",
    ) ||
    !rows(
      data.expenses,
      ["id", "date", "name", "category", "currency", "notes"],
      (r) =>
        /^\d{4}-\d{2}-\d{2}$/.test(String(r.date)) &&
        ["JPY", "TWD"].includes(String(r.currency)) &&
        typeof r.amount === "number" &&
        Number.isFinite(r.amount) &&
        r.amount >= 0,
    )
  )
    throw new Error("備份格式不正確或版本不支援，原有資料未變更。");
  return data as Journal;
}
export async function compressPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("請選擇 JPG、PNG 或 WebP 照片。");
  if (file.size > 30 * 1024 * 1024) throw new Error("單張照片請小於 30 MB。");
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("瀏覽器無法處理照片。");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    bitmap.close();
  }
}
