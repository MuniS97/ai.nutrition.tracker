"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signOut, type UserSession } from "@/lib/firebase/auth";
import { getTodaySummary, type TodaySummary } from "@/lib/firebase/firestore";
import { calculateTargets } from "@/lib/utils/nutrition";
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

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userSession = await getSession();
        if (!userSession) {
          router.push("/login");
          return;
        }
        setSession(userSession);
      } catch (error) {
        console.error("Error checking session:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchNutritionData = async () => {
      if (!session?.user) return;

      setIsLoadingData(true);
      setError(null);

      try {
        // Fetch today's summary
        const summary = await getTodaySummary(session.user.uid);
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

        // Set targets (calculated or default)
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
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
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
            Welcome back, {session.user.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
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
              <div>
                <span className="font-medium">Email: </span>
                <span className="text-muted-foreground">{session.user.email}</span>
              </div>
              {session.profile && (
                <>
                  {session.profile.age && (
                    <div>
                      <span className="font-medium">Age: </span>
                      <span className="text-muted-foreground">{session.profile.age}</span>
                    </div>
                  )}
                  {session.profile.gender && (
                    <div>
                      <span className="font-medium">Gender: </span>
                      <span className="text-muted-foreground capitalize">
                        {session.profile.gender}
                      </span>
                    </div>
                  )}
                  {session.profile.height && (
                    <div>
                      <span className="font-medium">Height: </span>
                      <span className="text-muted-foreground">{session.profile.height} cm</span>
                    </div>
                  )}
                  {session.profile.weight && (
                    <div>
                      <span className="font-medium">Weight: </span>
                      <span className="text-muted-foreground">{session.profile.weight} kg</span>
                    </div>
                  )}
                  {session.profile.activityLevel && (
                    <div>
                      <span className="font-medium">Activity Level: </span>
                      <span className="text-muted-foreground capitalize">
                        {session.profile.activityLevel.replace("-", " ")}
                      </span>
                    </div>
                  )}
                  {session.profile.goal && (
                    <div>
                      <span className="font-medium">Goal: </span>
                      <span className="text-muted-foreground capitalize">
                        {session.profile.goal.replace("-", " ")}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}