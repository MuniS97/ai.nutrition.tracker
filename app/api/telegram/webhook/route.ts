import { NextRequest, NextResponse } from "next/server";
import { createBot } from "@/lib/telegram/bot";

export const maxDuration = 30; // 30 seconds max for API route

// Create bot instance (singleton pattern)
let botInstance: ReturnType<typeof createBot> | null = null;
let botInitialized = false;

async function getBot() {
  if (!botInstance) {
    botInstance = createBot();
  }
  
  // Initialize bot if not already initialized
  if (!botInitialized) {
    await botInstance.init();
    botInitialized = true;
  }
  
  return botInstance;
}

export async function POST(request: NextRequest) {
  try {
    // Verify bot token is set
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Telegram bot token is not configured" },
        { status: 500 }
      );
    }

    // Get update from request body
    const update = await request.json();

    // Get bot instance (will initialize if needed)
    const bot = await getBot();

    // Handle the update directly
    await bot.handleUpdate(update);

    // Return success
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({
    message: "Telegram webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}