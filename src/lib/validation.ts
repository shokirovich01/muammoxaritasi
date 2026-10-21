import { z } from "zod";
import { ALLOWED_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES } from "./constants";

export const reportSchema = z.object({
  title: z.string().trim().min(5, "Sarlavha kamida 5 ta belgidan iborat bo‘lishi kerak").max(120, "Sarlavha 120 belgidan oshmasin"),
  description: z.string().trim().min(10, "Tavsif kamida 10 ta belgidan iborat bo‘lishi kerak").max(2000, "Tavsif 2000 belgidan oshmasin"),
  category: z.enum(["chuqur", "yoritish", "chiqindi", "suv", "boshqa"], { errorMap: () => ({ message: "Toifani tanlang" }) }),
  region: z.string().min(1, "Hududni tanlang"),
  lat: z.number({ invalid_type_error: "Xaritada joyni belgilang" }).min(37).max(46),
  lng: z.number({ invalid_type_error: "Xaritada joyni belgilang" }).min(55).max(74),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Ism-familiyani kiriting").max(100),
  email: z.string().trim().email("Elektron pochta noto‘g‘ri"),
  password: z.string().min(8, "Parol kamida 8 ta belgi bo‘lishi kerak").max(72),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Ism-familiyani kiriting").max(100),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{9,20}$/, "Telefon raqami noto‘g‘ri").or(z.literal("")),
});

export function validatePhotos(files: File[]): string | null {
  if (files.length > MAX_PHOTOS) return `Ko‘pi bilan ${MAX_PHOTOS} ta rasm yuklash mumkin`;
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) return "Faqat JPG, PNG yoki WEBP rasmlar mumkin";
    if (f.size > MAX_PHOTO_BYTES) return "Har bir rasm 5 MB dan oshmasligi kerak";
  }
  return null;
}
