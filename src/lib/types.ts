import type { CategoryKey, StatusKey } from "./constants";
export type Report = {
  id: string; user_id: string; title: string; description: string;
  category: CategoryKey; status: StatusKey; lat: number; lng: number;
  region: string | null; photos: string[]; created_at: string;
  confirmations?: { count: number }[];
};
export type Notification = {
  id: number; report_id: string | null; message: string; is_read: boolean; created_at: string;
};
export const confirmCount = (r: Report) => r.confirmations?.[0]?.count ?? 0;
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
