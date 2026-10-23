
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramMessage = {
  message_id: number;
  text?: string;
  from?: { id: number; first_name?: string; username?: string };
  chat: { id: number };
  location?: { latitude: number; longitude: number };
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

type Draft = {
  title?: string;
  description?: string;
  category?: string;
  region?: string;
  lat?: number;
  lng?: number;
};

const categories: Record<string, string> = {
  "1": "chuqur",
  "2": "yoritish",
  "3": "chiqindi",
  "4": "suv",
  "5": "boshqa",
};

const categoryLabels: Record<string, string> = {
  chuqur: "Yo‘l chuquri",
  yoritish: "Ko‘cha chirog‘i",
  chiqindi: "Chiqindi",
  suv: "Suv oqishi",
  boshqa: "Boshqa",
};

async function telegram(method: string, body: object) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram API xatosi:", {
      method,
      status: response.status,
      description: result.description,
    });

    throw new Error(
      `Telegram API xatosi: ${result.description || response.status}`
    );
  }

  return result;
}

async function say(chatId: number, text: string, keyboard?: object) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

async function getProfileId(
  db: ReturnType<typeof createAdminClient>,
  message: TelegramMessage
): Promise<string> {
  const telegramId = message.from?.id;

  if (!telegramId) {
    throw new Error("Telegram foydalanuvchi ID raqami topilmadi");
  }

  // Telegram hisobi avval profilga bog'langanligini tekshirish.
  const { data: linked, error: lookupError } = await db
    .from("telegram_accounts")
    .select("profile_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (lookupError) {
    console.error("Telegram profilini qidirish xatosi:", {
      message: lookupError.message,
      code: lookupError.code,
      details: lookupError.details,
      hint: lookupError.hint,
    });

    throw new Error(
      `Telegram profilini qidirishda xato: ${lookupError.message}`
    );
  }

  if (linked?.profile_id) {
    return linked.profile_id;
  }

  // Supabase Auth'da foydalanuvchi yaratish.
  const email = `telegram-${telegramId}@users.muammoxaritasi.app`;

  const { data, error } = await db.auth.admin.createUser({
    email,
    password: randomUUID() + randomUUID(),
    email_confirm: true,
    user_metadata: {
      full_name:
        message.from?.first_name || "Telegram foydalanuvchisi",
      telegram_id: telegramId,
      telegram_username: message.from?.username || null,
    },
  });

  if (error) {
    console.error("Supabase createUser xatosi:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    throw new Error(
      `Supabase foydalanuvchi yaratishda xato: ${error.message}`
    );
  }

  if (!data.user) {
    throw new Error(
      "Supabase foydalanuvchi yaratilmadi: user ma'lumoti qaytmadi"
    );
  }

  // Telegram hisobini yaratilgan profilga bog'lash.
  const { error: linkError } = await db
    .from("telegram_accounts")
    .insert({
      telegram_id: telegramId,
      profile_id: data.user.id,
    });

  if (linkError) {
    console.error("Telegram hisobini bog'lash xatosi:", {
      message: linkError.message,
      code: linkError.code,
      details: linkError.details,
      hint: linkError.hint,
    });

    throw new Error(
      `Telegram hisobini profilga bog'lashda xato: ${linkError.message}`
    );
  }

  return data.user.id;
}

function parseCoordinates(
  text: string
): { lat: number; lng: number } | null {
  const match = text.trim().match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/
  );

  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < 37 ||
    lat > 46 ||
    lng < 55 ||
    lng > 74
  ) {
    return null;
  }

  return { lat, lng };
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET sozlanmagan");

    return NextResponse.json(
      { error: "Webhook sozlanmagan" },
      { status: 500 }
    );
  }

  if (
    request.headers.get("x-telegram-bot-api-secret-token") !== secret
  ) {
    return NextResponse.json(
      { error: "Ruxsat yo‘q" },
      { status: 401 }
    );
  }

  let update: TelegramUpdate;

  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;

  if (!message?.from || !message.chat) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const telegramId = message.from.id;
  const text = message.text?.trim() || "";

  try {
    const db = createAdminClient();

    // /cancel profil yaratishni talab qilmaydi.
    if (text === "/cancel") {
      const { error } = await db
        .from("telegram_sessions")
        .delete()
        .eq("telegram_id", telegramId);

      if (error) {
        throw new Error(`Suhbatni bekor qilishda xato: ${error.message}`);
      }

      await say(
        chatId,
        "Bekor qilindi. Yangi muammo yuborish uchun /start yozing."
      );

      return NextResponse.json({ ok: true });
    }

    // Foydalanuvchi profilini topish yoki yaratish.
    const profileId = await getProfileId(db, message);

    if (text === "/start") {
      const { error } = await db
        .from("telegram_sessions")
        .upsert({
          telegram_id: telegramId,
          step: "title",
          draft: {},
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Suhbatni boshlashda xato: ${error.message}`);
      }

      await say(
        chatId,
        "Assalomu alaykum! Muammo yuborish botiga xush kelibsiz.\n\nMuammo sarlavhasini kiriting (5–120 belgi).\nBekor qilish: /cancel"
      );

      return NextResponse.json({ ok: true });
    }

    const { data: session, error: sessionError } = await db
      .from("telegram_sessions")
      .select("step, draft")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (sessionError) {
      throw new Error(
        `Suhbat ma'lumotlarini olishda xato: ${sessionError.message}`
      );
    }

    if (!session) {
      await say(chatId, "Boshlash uchun /start buyrug‘ini yuboring.");
      return NextResponse.json({ ok: true });
    }

    const draft = (session.draft || {}) as Draft;

    if (session.step === "title") {
      if (text.length < 5 || text.length > 120) {
        await say(
          chatId,
          "Sarlavha 5–120 belgi bo‘lishi kerak. Qayta kiriting."
        );

        return NextResponse.json({ ok: true });
      }

      draft.title = text;

      const { error } = await db
        .from("telegram_sessions")
        .update({
          step: "description",
          draft,
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", telegramId);

      if (error) {
        throw new Error(`Sarlavhani saqlashda xato: ${error.message}`);
      }

      await say(chatId, "Muammoni batafsil tushuntiring (10–2000 belgi).");
    } else if (session.step === "description") {
      if (text.length < 10 || text.length > 2000) {
        await say(
          chatId,
          "Tavsif 10–2000 belgi bo‘lishi kerak. Qayta kiriting."
        );

        return NextResponse.json({ ok: true });
      }

      draft.description = text;

      const { error } = await db
        .from("telegram_sessions")
        .update({
          step: "category",
          draft,
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", telegramId);

      if (error) {
        throw new Error(`Tavsifni saqlashda xato: ${error.message}`);
      }

      await say(
        chatId,
        "Muammo turini raqam bilan tanlang:\n1 — Yo‘l chuquri\n2 — Ko‘cha chirog‘i\n3 — Chiqindi\n4 — Suv oqishi\n5 — Boshqa"
      );
    } else if (session.step === "category") {
      const category = categories[text];

      if (!category) {
        await say(
          chatId,
          "1, 2, 3, 4 yoki 5 raqamidan birini yuboring."
        );

        return NextResponse.json({ ok: true });
      }

      draft.category = category;

      const { error } = await db
        .from("telegram_sessions")
        .update({
          step: "region",
          draft,
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", telegramId);

      if (error) {
        throw new Error(`Muammo turini saqlashda xato: ${error.message}`);
      }

      await say(chatId, "Viloyat yoki hudud nomini kiriting.");
    } else if (session.step === "region") {
      if (text.length < 2 || text.length > 100) {
        await say(chatId, "Hudud nomini to‘g‘ri kiriting.");
        return NextResponse.json({ ok: true });
      }

      draft.region = text;

      const { error } = await db
        .from("telegram_sessions")
        .update({
          step: "location",
          draft,
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_id", telegramId);

      if (error) {
        throw new Error(`Hududni saqlashda xato: ${error.message}`);
      }

      await say(
        chatId,
        "Joylashuvni yuboring: tugma orqali lokatsiya jo‘nating yoki kenglik, uzunlikni kiriting (masalan: 41.2995, 69.2401).",
        {
          keyboard: [
            [
              {
                text: "📍 Joylashuvni yuborish",
                request_location: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      );
    } else if (session.step === "location") {
      const coords = message.location
        ? {
            lat: message.location.latitude,
            lng: message.location.longitude,
          }
        : parseCoordinates(text);

      if (
        !coords ||
        !Number.isFinite(coords.lat) ||
        !Number.isFinite(coords.lng) ||
        coords.lat < 37 ||
        coords.lat > 46 ||
        coords.lng < 55 ||
        coords.lng > 74
      ) {
        await say(
          chatId,
          "Joylashuv O‘zbekiston hududida bo‘lishi kerak. Tugma orqali yuboring yoki masalan 41.2995, 69.2401 formatida kiriting."
        );

        return NextResponse.json({ ok: true });
      }

      draft.lat = coords.lat;
      draft.lng = coords.lng;

      const { error: insertError } = await db.from("reports").insert({
        user_id: profileId,
        title: draft.title,
        description: draft.description,
        category: draft.category,
        region: draft.region,
        lat: draft.lat,
        lng: draft.lng,
        status: "yangi",
        photos: [],
      });

      if (insertError) {
        console.error("Muammoni saqlash xatosi:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });

        throw new Error(
          `Muammoni ma'lumotlar bazasiga saqlashda xato: ${insertError.message}`
        );
      }

      const { error: deleteError } = await db
        .from("telegram_sessions")
        .delete()
        .eq("telegram_id", telegramId);

      if (deleteError) {
        console.error("Suhbatni o'chirish xatosi:", deleteError.message);
      }

      await say(
        chatId,
        `✅ Muammo muvaffaqiyatli yuborildi!\n\nSarlavha: ${draft.title}\nTuri: ${categoryLabels[draft.category || ""] || draft.category}\nHudud: ${draft.region}\nKoordinatalar: ${coords.lat}, ${coords.lng}\n\nYangi muammo yuborish uchun /start yozing.`,
        { remove_keyboard: true }
      );
    } else {
      const { error } = await db
        .from("telegram_sessions")
        .delete()
        .eq("telegram_id", telegramId);

      if (error) {
        throw new Error(`Suhbatni qayta boshlashda xato: ${error.message}`);
      }

      await say(chatId, "Suhbat qayta boshlandi. /start yuboring.");
    }
  } catch (error) {
    console.error("Telegram webhook xatosi:", error);

    try {
      await say(
        chatId,
        "Kechirasiz, so‘rovda xatolik yuz berdi. Iltimos, /start orqali qayta urinib ko‘ring."
      );
    } catch (telegramError) {
      console.error("Telegramga xabar yuborish xatosi:", telegramError);
    }
  }

  return NextResponse.json({ ok: true });
}
