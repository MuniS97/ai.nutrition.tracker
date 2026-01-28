import { Bot, Context, InlineKeyboard } from "grammy";
import { analyzeFood, type FoodItem } from "@/lib/ai/gemini";
import { saveNutritionLog } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

// Initialize bot
export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is not set");
  }

  const bot = new Bot(token);

  // /start command handler
  bot.command("start", async (ctx) => {
    const telegramUserId = ctx.from?.id.toString();
    
    // Check if user exists
    const userDoc = await getDoc(doc(db, "users", telegramUserId || ""));
    
    const keyboard = new InlineKeyboard()
      .webApp("📊 Open Dashboard", process.env.NEXT_PUBLIC_APP_URL + "/dashboard")
      .row()
      .webApp("🧮 Calorie Calculator", process.env.NEXT_PUBLIC_APP_URL + "/calculator");
    
    if (!userDoc.exists()) {
      await ctx.reply(
        "👋 Welcome! Let's get started!\n\n" +
        "Tap the button below to set up your profile:",
        { reply_markup: keyboard }
      );
    } else {
      await ctx.reply(
        "👋 Welcome back!\n\n" +
        "📸 Send a food photo for instant analysis\n" +
        "📊 Or open the dashboard for detailed stats",
        { reply_markup: keyboard }
      );
    }
  });

  // /help command handler
  bot.command("help", async (ctx: Context) => {
    await ctx.reply(
      `📖 <b>How to use:</b>\n\n` +
        `1. Take a photo of your food\n` +
        `2. Send it to me\n` +
        `3. I'll analyze it and show you the nutrition info\n` +
        `4. The data will be saved automatically\n\n` +
        `<b>Commands:</b>\n` +
        `/start - Start the bot\n` +
        `/help - Show this help message\n\n` +
        `<i>Note: Make sure your food is clearly visible in the photo for best results.</i>`,
      { parse_mode: "HTML" }
    );
  });

  // Photo message handler
  bot.on("message:photo", async (ctx: Context) => {
    try {
      // Get the largest photo
      const photo = ctx?.message?.photo;
      if (!photo || photo.length === 0) {
        await ctx.reply("❌ Could not process the photo. Please try again.");
        return;
      }

      // Get the largest photo size
      const largestPhoto = photo[photo.length - 1];
      const fileId = largestPhoto.file_id;

      // Send "analyzing" message
      const analyzingMsg = await ctx.reply("🔍 Analyzing your food photo...");

      // Get file from Telegram
      const file = await ctx.api.getFile(fileId);
      if (!file.file_path) {
        await ctx.api.editMessageText(
          ctx?.chat?.id ?? 0,
          analyzingMsg.message_id,
          "❌ Could not download the photo. Please try again."
        );
        return;
      }

      // Download file from Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        throw new Error("Bot token not available");
      }
      const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Failed to download photo from Telegram");
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      
      // Detect MIME type from file extension
      const mimeType = file.file_path.endsWith(".jpg") || file.file_path.endsWith(".jpeg")
        ? "image/jpeg"
        : file.file_path.endsWith(".png")
        ? "image/png"
        : "image/jpeg"; // Default to JPEG

      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Analyze with Gemini
      const result = await analyzeFood(dataUrl);

      if (!result.foods || result.foods.length === 0) {
        await ctx.api.editMessageText(
          ctx?.chat?.id ?? 0,
          analyzingMsg.message_id,
          "❌ No food items detected in the photo. Please make sure the food is clearly visible and try again."
        );
        return;
      }

      // Calculate totals
      const totals = result.foods.reduce(
        (acc, food) => ({
          calories: acc.calories + food.calories,
          protein: acc.protein + food.protein,
          carbs: acc.carbs + food.carbs,
          fat: acc.fat + food.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Format results message
      let resultsText = "✅ <b>Nutrition Analysis Results:</b>\n\n";
      
      result.foods.forEach((food, index) => {
        resultsText += `<b>${index + 1}. ${food.name}</b>\n`;
        resultsText += `   Quantity: ${food.quantity}\n`;
        resultsText += `   Calories: ${food.calories} kcal\n`;
        resultsText += `   Protein: ${food.protein}g | Carbs: ${food.carbs}g | Fats: ${food.fats}g\n\n`;
      });

      resultsText += `<b>📊 Total:</b>\n`;
      resultsText += `   Calories: ${totals.calories.toFixed(1)} kcal\n`;
      resultsText += `   Protein: ${totals.protein.toFixed(1)}g\n`;
      resultsText += `   Carbs: ${totals.carbs.toFixed(1)}g\n`;
      resultsText += `   Fats: ${totals.fat.toFixed(1)}g\n\n`;
      resultsText += `💾 Saving to your nutrition log...`;

      // Update message with results
      await ctx.api.editMessageText(ctx?.chat?.id ?? 0, analyzingMsg.message_id, resultsText, {
        parse_mode: "HTML",
      });

      // Save to Firebase
      // Use Telegram user ID as userId (you may want to map this to Firebase user ID)
      const telegramUserId = ctx.from?.id.toString();
      if (!telegramUserId) {
        throw new Error("Could not get user ID");
      }

      await saveNutritionLog(telegramUserId, {
        mealType: "snack",
        foods: result.foods,
        source: "telegram",
        date: new Date(),
      });

      // Send success confirmation
      await ctx.reply("✅ Nutrition data saved successfully to your log!");
    } catch (error) {
      console.error("Error processing photo:", error);
      await ctx.reply(
        "❌ An error occurred while analyzing your photo. Please try again later."
      );
    }
  });

  // Handle text messages (non-photo)
  bot.on("message:text", async (ctx: Context) => {
    const text = ctx?.message?.text;
    
    // Ignore commands (handled separately)
    if (text?.startsWith("/")) {
      return;
    }

    await ctx.reply(
      "📸 Please send me a photo of your food to analyze its nutrition information.\n\n" +
        "Use /help for more information."
    );
  });

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  return bot;
}

