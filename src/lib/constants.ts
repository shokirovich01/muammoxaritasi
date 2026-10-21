export const CATEGORIES = {
  chuqur: { label: "Yo‘l chuquri", emoji: "🕳️" },
  yoritish: { label: "Ko‘cha chirog‘i", emoji: "💡" },
  chiqindi: { label: "Chiqindi", emoji: "🗑️" },
  suv: { label: "Suv oqishi", emoji: "💧" },
  boshqa: { label: "Boshqa", emoji: "📍" },
} as const;
export type CategoryKey = keyof typeof CATEGORIES;

export const STATUSES = {
  yangi: { label: "Yangi", color: "#ef4444", cls: "bg-red-100 text-red-700" },
  korib_chiqilmoqda: { label: "Ko‘rib chiqilmoqda", color: "#f59e0b", cls: "bg-amber-100 text-amber-700" },
  jarayonda: { label: "Jarayonda", color: "#3b82f6", cls: "bg-blue-100 text-blue-700" },
  hal_qilindi: { label: "Hal qilindi", color: "#10b981", cls: "bg-emerald-100 text-emerald-700" },
  rad_etildi: { label: "Rad etildi", color: "#6b7280", cls: "bg-gray-200 text-gray-700" },
} as const;
export type StatusKey = keyof typeof STATUSES;

export const REGIONS = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon viloyati", "Buxoro viloyati",
  "Farg‘ona viloyati", "Jizzax viloyati", "Xorazm viloyati", "Namangan viloyati",
  "Navoiy viloyati", "Qashqadaryo viloyati", "Qoraqalpog‘iston Respublikasi",
  "Samarqand viloyati", "Sirdaryo viloyati", "Surxondaryo viloyati",
];

export const MAP_CENTER: [number, number] = [41.3111, 69.2797];
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
