
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const db = createAdminClient();

  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (
      !token ||
      token.length > 200 ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < 37 ||
      lat > 46 ||
      lng < 55 ||
      lng > 74
    ) {
      return NextResponse.json(
        { error: "Token yoki koordinatalar noto‘g‘ri." },
        { status: 400 }
      );
    }

    const { data: locationToken, error: tokenError } = await db
      .from("telegram_location_tokens")
      .select("token, telegram_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (tokenError) throw tokenError;

    if (
      !locationToken ||
      new Date(locationToken.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Havola eskirgan. Telegram botda /start yuborib qayta urinib ko‘ring.",
        },
        { status: 401 }
      );
    }

    const telegramId = locationToken.telegram_id;

    const { data: session, error: sessionError } = await db
      .from("telegram_sessions")
      .select("step, draft")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session || session.step !== "location") {
      return NextResponse.json(
        {
          error:
            "Botdagi muammo yuborish jarayoni topilmadi. /start yuboring.",
        },
        { status: 409 }
      );
    }

    const draft = (session.draft || {}) as {
      title?: string;
      description?: string;
      category?: string;
      region?: string;
      lat?: number;
      lng?: number;
      photos?: string[];
    };

    if (
      !draft.title ||
      !draft.description ||
      !draft.category ||
      !draft.region
    ) {
      return NextResponse.json(
        {
          error:
            "Muammo ma’lumotlari to‘liq emas. Botda /start yuboring.",
        },
        { status: 409 }
      );
    }

    const { data: account, error: accountError } = await db
      .from("telegram_accounts")
      .select("profile_id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (accountError) throw accountError;

    if (!account?.profile_id) {
      return NextResponse.json(
        {
          error:
            "Telegram profilingiz topilmadi. Botda /start yuboring.",
        },
        { status: 409 }
      );
    }

    draft.lat = lat;
    draft.lng = lng;
    draft.photos = [];

    const { error: updateError } = await db
      .from("telegram_sessions")
      .update({
        step: "photos",
        draft,
        updated_at: new Date().toISOString(),
      })
      .eq("telegram_id", telegramId);

    if (updateError) throw updateError;

    // Tokenni qayta ishlatishning oldini olamiz.
    const { error: deleteTokenError } = await db
      .from("telegram_location_tokens")
      .delete()
      .eq("token", token);

    if (deleteTokenError) throw deleteTokenError;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan");
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramId,
          text:
            "📍 Joylashuv saqlandi!\n\n" +
            "Endi 1–3 ta rasm yuboring.\n" +
            "Rasm yubormasdan tugatish uchun quyidagi tugmani bosing.",
          reply_markup: {
            keyboard: [[{ text: "Rasmlarsiz davom etish" }]],
            resize_keyboard: true,
            is_persistent: true,
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Telegram xabarini yuborishda xatolik: ${response.status}`
      );
    }

    const telegramResult = await response.json();

    if (!telegramResult.ok) {
      throw new Error("Telegram xabarni qabul qilmadi");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram location API xatosi:", error);

    return NextResponse.json(
      {
        error:
          "Server xatosi. Birozdan keyin qayta urinib ko‘ring.",
      },
      { status: 500 }
    );
  }
}
