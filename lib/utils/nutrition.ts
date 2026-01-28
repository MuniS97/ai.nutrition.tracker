/**
 * Calculate target daily calories based on user profile
 * Uses Mifflin-St Jeor Equation for BMR calculation
 */
export function calculateTargetCalories(
  age: number,
  gender: string,
  height: number, // in cm
  weight: number, // in kg
  activityLevel: string,
  goal: string
): number {
  // Convert height to meters
  const heightM = height / 100;

  // Calculate BMR using Mifflin-St Jeor Equation
  // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + s
  // s = +5 for males, -161 for females
  const genderFactor = gender === "male" ? 5 : -161;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderFactor;

  // Activity multipliers
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  const activityMultiplier = activityMultipliers[activityLevel] || 1.2;
  let tdee = bmr * activityMultiplier;

  // Adjust based on goal
  const goalAdjustments: Record<string, number> = {
    "lose-weight": -500, // 500 calorie deficit
    "maintain-weight": 0,
    "gain-weight": 300, // 300 calorie surplus
    "build-muscle": 300, // 300 calorie surplus
    "improve-health": 0,
  };

  const adjustment = goalAdjustments[goal] || 0;
  const targetCalories = Math.round(tdee + adjustment);

  return Math.max(targetCalories, 1200); // Minimum 1200 calories
}

/**
 * Calculate target macros based on calories and goal
 */
export function calculateTargetMacros(
  targetCalories: number,
  weight: number, // in kg
  goal: string
): {
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
} {
  // Protein: 1.6-2.2g per kg body weight (higher for muscle building)
  const proteinPerKg = goal === "build-muscle" ? 2.2 : 1.8;
  const targetProtein = Math.round(weight * proteinPerKg);

  // Fat: 20-30% of calories (0.9g per calorie)
  const fatPercentage = 0.25; // 25% of calories
  const targetFat = Math.round((targetCalories * fatPercentage) / 9); // 9 calories per gram of fat

  // Carbs: remaining calories
  // Protein: 4 calories per gram
  // Fat: 9 calories per gram
  const proteinCalories = targetProtein * 4;
  const fatCalories = targetFat * 9;
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const targetCarbs = Math.round(carbCalories / 4); // 4 calories per gram of carbs

  return {
    protein: Math.max(targetProtein, 50), // Minimum 50g protein
    carbs: Math.max(targetCarbs, 100), // Minimum 100g carbs
    fat: Math.max(targetFat, 30), // Minimum 30g fat
  };
}

/**
 * Calculate all target nutrition values from user profile
 */
export function calculateTargets(profile: {
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  goal: string;
}): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const targetCalories = calculateTargetCalories(
    profile.age,
    profile.gender,
    profile.height,
    profile.weight,
    profile.activityLevel,
    profile.goal
  );

  const macros = calculateTargetMacros(
    targetCalories,
    profile.weight,
    profile.goal
  );

  return {
    calories: targetCalories,
    ...macros,
  };
}

