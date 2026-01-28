// Firebase exports
export { auth, db, default as app } from "./config";
export {
  signUp,
  signIn,
  signOut,
  getSession,
  type ProfileData,
  type UserSession,
} from "./auth";
export {
  saveNutritionLog,
  getTodaySummary,
  getRecentLogs,
  type NutritionLogData,
  type TodaySummary,
} from "./firestore";

