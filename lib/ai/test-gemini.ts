/**
 * Test script for Gemini food analysis
 * 
 * Usage:
 * 1. Place a test image file in the project root (e.g., test-food.jpg)
 * 2. Run: npx tsx lib/ai/test-gemini.ts
 * 
 * Or use Node.js:
 * node --loader ts-node/esm lib/ai/test-gemini.ts
 */

import { analyzeFood } from "./gemini";
import * as fs from "fs";
import * as path from "path";

async function testFoodAnalysis() {
  try {
    console.log("🧪 Testing Gemini Food Analysis...\n");

    // Check if API key is set
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ Error: GEMINI_API_KEY environment variable is not set");
      console.log("\nPlease set it in your .env.local file:");
      console.log("GEMINI_API_KEY=your_api_key_here\n");
      process.exit(1);
    }

    // Look for a test image file
    const testImagePaths = [
      path.join(process.cwd(), "test-food.jpg"),
      path.join(process.cwd(), "test-food.png"),
      path.join(process.cwd(), "test-food.jpeg"),
    ];

    let imagePath: string | null = null;
    for (const testPath of testImagePaths) {
      if (fs.existsSync(testPath)) {
        imagePath = testPath;
        break;
      }
    }

    if (!imagePath) {
      console.log("ℹ️  No test image found. Please place a test image file named:");
      console.log("   - test-food.jpg");
      console.log("   - test-food.png");
      console.log("   - test-food.jpeg");
      console.log("\nIn the project root directory.\n");
      
      // Example: Create a simple base64 test (you can replace this with actual image base64)
      console.log("Alternatively, you can test with a base64 string directly.");
      console.log("Example usage in your code:");
      console.log(`
import { analyzeFood } from "@/lib/ai/gemini";

const imageBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."; // Your base64 image
const result = await analyzeFood(imageBase64);
console.log(result);
      `);
      process.exit(0);
    }

    console.log(`📸 Reading image: ${path.basename(imagePath)}\n`);

    // Read and encode image
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    const mimeType = path.extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log("🔍 Analyzing food image with Gemini...\n");

    // Analyze the image
    const result = await analyzeFood(dataUrl);

    console.log("✅ Analysis complete!\n");
    console.log("📊 Results:");
    console.log(JSON.stringify(result, null, 2));

    if (result.foods.length === 0) {
      console.log("\n⚠️  No foods detected in the image.");
    } else {
      console.log(`\n🍽️  Detected ${result.foods.length} food item(s):\n`);
      result.foods.forEach((food, index) => {
        console.log(`${index + 1}. ${food.name}`);
        console.log(`   Quantity: ${food.quantity}`);
        console.log(`   Calories: ${food.calories} kcal`);
        console.log(`   Protein: ${food.protein}g`);
        console.log(`   Carbs: ${food.carbs}g`);
        console.log(`   Fats: ${food.fats}g\n`);
      });
    }
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testFoodAnalysis();

