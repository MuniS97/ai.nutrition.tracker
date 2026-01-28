import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./config";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type NutritionSource = "manual" | "camera" | "telegram";

export interface NutritionFoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionLogData {
  mealType: MealType;
  foods: NutritionFoodItem[];
  source: NutritionSource;
  /** Date the meal belongs to (day bucket). Defaults to now. */
  date?: Date | Timestamp;
}

export interface TodaySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealCount: number;
  logs: DocumentData[];
}

/**
 * Save a nutrition log entry for a user
 * @param userId - User ID
 * @param data - Nutrition log data
 * @returns Document ID of the created log entry
 */
export async function saveNutritionLog(
  userId: string,
  data: NutritionLogData
): Promise<string> {
  try {
    const logsRef = collection(db, "nutrition_logs");

    const date =
      data.date instanceof Date
        ? Timestamp.fromDate(data.date)
        : data.date || Timestamp.now();

    const totals = data.foods.reduce(
      (acc, f) => ({
        totalCalories: acc.totalCalories + Number(f.calories || 0),
        totalProtein: acc.totalProtein + Number(f.protein || 0),
        totalCarbs: acc.totalCarbs + Number(f.carbs || 0),
        totalFats: acc.totalFats + Number(f.fats || 0),
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
    );

    const logData = {
      mealType: data.mealType,
      foods: data.foods,
      source: data.source,
      userId,
      date,
      ...totals,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(logsRef, logData);
    return docRef.id;
  } catch (error) {
    throw error;
  }
}

/**
 * Get today's nutrition summary for a user
 * @param userId - User ID
 * @returns TodaySummary with totals and logs
 * @note Requires a Firestore composite index on (userId, date)
 * Create it in Firebase Console: Firestore > Indexes > Create Index
 */
export async function getTodaySummary(
  userId: string
): Promise<TodaySummary> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimestamp = Timestamp.fromDate(today);
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

    const logsRef = collection(db, "nutrition_logs");
    const q = query(
      logsRef,
      where("userId", "==", userId),
      where("date", ">=", todayTimestamp),
      where("date", "<", tomorrowTimestamp),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const logs: DocumentData[] = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({ id: doc.id, ...data });

      totalCalories += Number(data.totalCalories || 0);
      totalProtein += Number(data.totalProtein || 0);
      totalCarbs += Number(data.totalCarbs || 0);
      totalFats += Number(data.totalFats || 0);
    });

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      mealCount: logs.length,
      logs,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get recent nutrition logs for a user
 * @param userId - User ID
 * @param logLimit - Maximum number of logs to retrieve (default: 10)
 * @returns Array of nutrition log documents
 */
export async function getRecentLogs(
  userId: string,
  logLimit: number = 10
): Promise<DocumentData[]> {
  try {
    const logsRef = collection(db, "nutrition_logs");
    const q = query(
      logsRef,
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(logLimit)
    );

    const querySnapshot = await getDocs(q);
    const logs: DocumentData[] = [];

    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    return logs;
  } catch (error) {
    throw error;
  }
}

export async function getUserByTelegramId(telegramId: string) {
  try {
    const userDoc = await getDoc(doc(db, "users", telegramId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data();
  } catch (error) {
    console.error("Error getting user by Telegram ID:", error);
    throw error;
  }
}