import axios from "axios"

import type { FoodItem } from "@/lib/ai/gemini"

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1"

type USDAFoodNutrient = {
  nutrientName: string
  unitName: string
  value: number
}

type USDAFood = {
  fdcId: number
  description: string
  foodNutrients?: USDAFoodNutrient[]
}

type USDASearchResponse = {
  foods?: USDAFood[]
}

export interface USDAEnrichedNutrition {
  name: string
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
}

/**
 * Try to enhance a food item's macro nutrients using USDA FoodData Central.
 *
 * - Returns `null` if no USDA_API_KEY is configured or no good match is found.
 * - Values are approximate and typically per 100g or per serving as defined by USDA.
 */
export async function enhanceWithUSDA(foodName: string): Promise<USDAEnrichedNutrition | null> {
  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) {
    // Silently fall back to Gemini-only estimates when USDA is not configured
    return null
  }

  const query = foodName.trim()
  if (!query) return null

  try {
    // Search for the best matching food
    const searchRes = await axios.get<USDASearchResponse>(`${USDA_API_BASE}/foods/search`, {
      params: {
        api_key: apiKey,
        query,
        pageSize: 1,
        dataType: ["Survey (FNDDS)", "SR Legacy"],
      },
    })

    const firstFood = searchRes.data.foods?.[0]
    if (!firstFood) {
      return null
    }

    // Fetch detailed nutrient info
    const foodRes = await axios.get<USDAFood>(`${USDA_API_BASE}/food/${firstFood.fdcId}`, {
      params: { api_key: apiKey },
    })

    const nutrients = foodRes.data.foodNutrients || []

    const findNutrient = (names: string[]): number | undefined => {
      const nutrient = nutrients.find((n) =>
        names.some((name) => n.nutrientName.toLowerCase().includes(name.toLowerCase())),
      )
      return nutrient?.value
    }

    const calories = findNutrient(["energy"])
    const protein = findNutrient(["protein"])
    const carbs = findNutrient(["carbohydrate, by difference", "carbohydrate"])
    const fats = findNutrient(["total lipid (fat)", "fat"])

    if (calories == null && protein == null && carbs == null && fats == null) {
      return null
    }

    return {
      name: firstFood.description,
      calories,
      protein,
      carbs,
      fats,
    }
  } catch (error) {
    // Fail soft – just fall back to Gemini estimates
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("USDA enrichment failed for", foodName, error)
    }
    return null
  }
}


