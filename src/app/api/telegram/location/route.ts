
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
      lat < 37 || lat > 46 ||
      lng < 55 || lng > 74
    ) {
      return NextResponse.json(
        { error: "Token yoki koordinatalar noto‘g‘ri." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

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
        { error: "Havola eskirgan. Telegram botda /start yuborib qayta urinib ko‘ring." },
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
        { error: "Botdagi muammo yuborish jarayoni topilmadi. /start yuboring." },
        { status: 409 }
      );
    }

    const draft = session.draft || {};

    if (
      !draft.title ||
      !draft.description ||
      !draft.category ||
      !draft.region
    ) {
      return NextResponse.json(
        { error: "Muammo ma’lumotlari to‘liq emas. Botda /start yuboring." },
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
        { error: "Telegram profilingiz topilmadi. Botda /start yuboring." },
        { status: 409 }
      );
    }

    const updatedDraft = {
      ...draft,
      lat,
      lng,
      photos: [],
    };

    const { error: updateError } = await db
      .from("telegram_sessions")
      .update({
        step: "photos",
        draft: updatedDraft,
      })
      .eq("telegram_id", telegramId);

    if (updateError) throw updateError;

    const { error: deleteTokenError } = await db
      .from("telegram_location_tokens")
      .delete()
      .eq("token", token);

    if (deleteTokenError) throw deleteTokenError;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (botToken) {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramId,
            text:
              "📸 Joylashuv qabul qilindi!\n\n" +
              "Muammo rasmlarini yuboring (ko‘pi bilan 3 ta).\n" +
              "Rasm yubormoqchi bo‘lmasangiz, quyidagi tugmani bosing.",
            reply_markup: {
              keyboard: [
                [{ text: "Rasmlarsiz davom etish" }],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Telegram xabarini yuborishda xatolik:",
          await response.text()
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram location API xatosi:", error);
    return NextResponse.json(
      { error: "Server xatosi. Birozdan keyin qayta urinib ko‘ring." },
      { status: 500 }
    );
  }
}
