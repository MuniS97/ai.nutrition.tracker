import { GoogleGenerativeAI } from "@google/generative-ai"
import { enhanceWithUSDA } from "@/lib/nutrition/usda"

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  return new GoogleGenerativeAI(apiKey)
}

export interface FoodItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface FoodAnalysisResult {
  foods: FoodItem[]
}

/**
 * Analyzes a food image using Gemini 2.0 Flash model
 * @param imageBase64 - Base64 encoded image string (with or without data URL prefix)
 * @returns Promise resolving to FoodAnalysisResult with detected foods and nutrition info
 * @throws Error if API key is missing, image is invalid, or API call fails
 */
export async function analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
  try {
    // Validate API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    // Clean base64 string (remove data URL prefix if present)
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64

    if (!base64Data || base64Data.length === 0) {
      throw new Error("Invalid base64 image data")
    }

    const genAI = getGeminiClient()

    // Use Gemini 2.0 Flash model (or fallback to 1.5 Flash)
    // Available models: gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        // Remove responseMimeType - it may not be supported
      },
    });

    const prompt = `Analyze this food image and extract detailed nutrition information.

Return a JSON object with the following structure:
{
  "foods": [
    {
      "name": "food item name",
      "quantity": "serving size description (e.g., '1 cup', '100g', '1 piece')",
      "calories": number,
      "protein": number (in grams),
      "carbs": number (in grams),
      "fats": number (in grams)
    }
  ]
}

Instructions:
- Identify all visible food items in the image
- Estimate realistic quantities based on what you see
- Provide accurate nutrition values per item
- If multiple servings are visible, describe the quantity accordingly
- Round numbers to reasonable precision
- If you cannot identify a food item clearly, omit it
- Return an empty foods array if no food is detected

Be precise and realistic with your estimates.`;

    // Detect MIME type from base64 data URL prefix if present
    let mimeType = "image/jpeg" // Default
    if (imageBase64.includes("data:")) {
      const mimeMatch = imageBase64.match(/data:([^;]+);base64/)
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1]
      }
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    if (!text) {
      throw new Error("Empty response from Gemini API")
    }

    // Parse JSON response
    // Parse JSON response
let parsedResult: FoodAnalysisResult
try {
  // Remove markdown code blocks if present
  let cleanedText = text.trim()
  
  // Remove ```json and ``` wrapper
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '')
  }
  
  parsedResult = JSON.parse(cleanedText)
} catch (parseError) {
  console.error("Raw Gemini response:", text)
  throw new Error(
    `Failed to parse JSON response from Gemini: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
  )
}

    // Validate response structure
    if (!parsedResult || typeof parsedResult !== "object") {
      throw new Error("Invalid response structure from Gemini API")
    }

    if (!Array.isArray(parsedResult.foods)) {
      throw new Error("Response missing 'foods' array")
    }

    // Validate and sanitize food items
    const validatedFoods: FoodItem[] = parsedResult.foods
      .filter((food: unknown) => {
        if (!food || typeof food !== "object") return false
        const f = food as Partial<FoodItem>
        return (
          typeof f.name === "string" &&
          typeof f.quantity === "string" &&
          typeof f.calories === "number" &&
          typeof f.protein === "number" &&
          typeof f.carbs === "number" &&
          typeof f.fats === "number"
        );
      })
      .map((food: Partial<FoodItem>) => ({
        name: food.name!,
        quantity: food.quantity!,
        calories: Math.max(0, Math.round(food.calories! * 10) / 10),
        protein: Math.max(0, Math.round(food.protein! * 10) / 10),
        carbs: Math.max(0, Math.round(food.carbs! * 10) / 10),
        fats: Math.max(0, Math.round(food.fats! * 10) / 10),
      }))

    // Optionally enhance with USDA data for better accuracy
    const usdaEnhancedFoods = await Promise.all(
      validatedFoods.map(async (food) => {
        const usda = await enhanceWithUSDA(food.name)
        if (!usda) return food

        return {
          ...food,
          calories: usda.calories ?? food.calories,
          protein: usda.protein ?? food.protein,
          carbs: usda.carbs ?? food.carbs,
          fats: usda.fats ?? food.fats,
        }
      }),
    )

    return {
      foods: usdaEnhancedFoods,
    }
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      // Check for specific API errors
      if (error.message.includes("API_KEY")) {
        throw new Error("Gemini API key is invalid or missing. Please check your GEMINI_API_KEY environment variable.")
      }
      if (error.message.includes("quota") || error.message.includes("rate limit")) {
        throw new Error("Gemini API quota exceeded or rate limit reached. Please try again later.")
      }
      if (error.message.includes("safety")) {
        throw new Error("Image was blocked by Gemini safety filters. Please try a different image.")
      }
      throw error;
    }
    throw new Error(
      `Unexpected error analyzing food image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

