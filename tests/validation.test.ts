import { describe, it, expect } from "vitest";
import { reportSchema, registerSchema } from "../src/lib/validation";

describe("reportSchema", () => {
  const ok = { title: "Katta chuqur", description: "Yo‘lning o‘rtasida katta chuqur bor", category: "chuqur", region: "Toshkent shahri", lat: 41.3, lng: 69.2 };
  it("to‘g‘ri ma’lumotni qabul qiladi", () => expect(reportSchema.safeParse(ok).success).toBe(true));
  it("qisqa sarlavhani rad etadi", () => expect(reportSchema.safeParse({ ...ok, title: "ab" }).success).toBe(false));
  it("O‘zbekistondan tashqari koordinatani rad etadi", () => expect(reportSchema.safeParse({ ...ok, lat: 10 }).success).toBe(false));
});
describe("registerSchema", () => {
  it("qisqa parolni rad etadi", () => expect(registerSchema.safeParse({ fullName: "Ali Vali", email: "a@b.uz", password: "123" }).success).toBe(false));
});
