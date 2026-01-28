"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type UserSession } from "@/lib/firebase/auth";
import { getTodaySummary, type TodaySummary } from "@/lib/firebase/firestore";
import { getUserByTelegramId } from "@/lib/firebase/firestore"; // You'll need to create this
import { calculateTargets } from "@/lib/utils/nutrition";
import { initTelegramWebApp, isTelegramMiniApp } from "@/lib/telegram/webapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PageLoading, LoadingSpinner } from "@/components/layout/LoadingSpinner";

interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function createTelegramUser(telegramUserId: string, username?: string, firstName?: string) {
  return {
    uid: telegramUserId,
    email: username ? `${username}@telegram` : `user${telegramUserId}@telegram`,
    emailVerified: false,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: '',
    tenantId: null,
    displayName: firstName || username || null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'telegram',
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
  } as any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if running as Telegram Mini App
        if (isTelegramMiniApp()) {
          setIsMiniApp(true);
          
          const webApp = initTelegramWebApp();
          if (webApp?.userId) {
            setTelegramUserId(webApp.userId);
            
            try {
              const userData = await getUserByTelegramId(webApp.userId);
              if (userData) {
                // User exists, set session
                setSession({
                  user: createTelegramUser(webApp.userId, webApp.username, webApp.firstName),
                  profile: userData.profile,
                });
                setIsLoading(false);
                return;
              } else {
                // New Telegram user - redirect to setup
                router.push(`/setup?telegram_id=${webApp.userId}&name=${webApp.firstName}`);
                return;
              }
            } catch (err) {
              console.error("Error fetching Telegram user:", err);
              setError("Failed to load user data from Telegram");
            }
          }
        } else {
          // Regular web app - use Firebase auth
          const userSession = await getSession();
          if (!userSession) {
            router.push("/login");
            return;
          }
          setSession(userSession);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (!isMiniApp) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, isMiniApp]);

  useEffect(() => {
    const fetchNutritionData = async () => {
      if (!session?.user) return;

      setIsLoadingData(true);
      setError(null);

      try {
        // Use Telegram ID if Mini App, otherwise use Firebase UID
        const userId = isMiniApp ? telegramUserId! : session.user.uid;
        
        // Fetch today's summary
        const summary = await getTodaySummary(userId);
        setTodaySummary(summary);

        // Calculate targets if profile data is available
        let calculatedTargets: NutritionTargets | null = null;
        if (session.profile) {
          const profile = session.profile;
          if (
            profile.age &&
            profile.gender &&
            profile.height &&
            profile.weight &&
            profile.activityLevel &&
            profile.goal
          ) {
            calculatedTargets = calculateTargets({
              age: Number(profile.age),
              gender: String(profile.gender),
              height: Number(profile.height),
              weight: Number(profile.weight),
              activityLevel: String(profile.activityLevel),
              goal: String(profile.goal),
            });
          }
        }

        setTargets(
          calculatedTargets || {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65,
          }
        );
      } catch (err) {
        console.error("Error fetching nutrition data:", err);
        setError("Failed to load nutrition data. Please try again.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchNutritionData();
  }, [session, isMiniApp, telegramUserId]);

  const handleSignOut = async () => {
    if (isMiniApp) {
      // Close Mini App
      const tg = initTelegramWebApp();
      tg?.tg.close();
    } else {
      // Regular sign out
      try {
        const { signOut } = await import("@/lib/firebase/auth");
        await signOut();
        router.push("/login");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  };

  if (isLoading) {
    return <PageLoading text="Loading dashboard..." />;
  }

  if (!session) {
    return null;
  }

  const currentStats = todaySummary || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    mealCount: 0,
    logs: [],
  };

  const defaultTargets: NutritionTargets = targets || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isMiniApp 
              ? `Welcome back from Telegram!`
              : `Welcome back, ${session.user.email}`
            }
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          {isMiniApp ? 'Close' : 'Sign Out'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoadingData ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading nutrition data..." />
        </div>
      ) : (
        <>
          {/* Stats Cards Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Calories"
              current={currentStats.totalCalories}
              target={defaultTargets.calories}
              unit="kcal"
            />
            <StatsCard
              title="Protein"
              current={currentStats.totalProtein}
              target={defaultTargets.protein}
              unit="g"
            />
            <StatsCard
              title="Carbs"
              current={currentStats.totalCarbs}
              target={defaultTargets.carbs}
              unit="g"
            />
            <StatsCard
              title="Fats"
              current={currentStats.totalFats}
              target={defaultTargets.fat}
              unit="g"
            />
          </div>

          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isMiniApp && (
                <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🤖 Connected via Telegram Mini App
                  </p>
                </div>
              )}
              
              <div>
                <span className="font-medium">
                  {isMiniApp ? 'Telegram ID: ' : 'Email: '}
                </span>
                <span className="text-muted-foreground">
                  {session.user.email}
                </span>
              </div>
              
              {/* Rest of profile info... */}
              {session.profile && (
                <>
                  {session.profile.age && (
                    <div>
                      <span className="font-medium">Age: </span>
                      <span className="text-muted-foreground">{session.profile.age}</span>
                    </div>
                  )}
                  {/* ... rest of your existing profile fields ... */}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}