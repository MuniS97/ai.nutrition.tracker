"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/firebase/auth";
import { saveNutritionLog, type MealType } from "@/lib/firebase/firestore";
import { type FoodItem } from "@/lib/ai/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { PageLoading } from "@/components/layout/LoadingSpinner";

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<FoodItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mealType] = useState<MealType>("snack");

  // Auth guard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (!session) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Error checking session:", error);
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return <PageLoading text="Checking authentication..." />;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file is too large. Maximum size is 10MB.");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResults(null);
    setSaveSuccess(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setSaveSuccess(false);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("image", selectedFile);

      // Call API endpoint
      const response = await fetch("/api/nutrition/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze image");
      }

      const data = await response.json();
      if (data.success && data.data?.foods) {
        setResults(data.data.foods);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze image. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!results || results.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Get current user session
      const session = await getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      // Save to Firestore (no image stored in Firestore)
      const mealId = await saveNutritionLog(session.user.uid, {
        mealType,
        foods: results,
        source: "camera",
        date: new Date(),
      });

      // Save image locally in browser storage (NOT in Firebase Storage)
      if (previewUrl) {
        localStorage.setItem(`meal-${mealId}`, previewUrl);
      }

      setSaveSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error saving nutrition log:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save nutrition log. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    setSaveSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Scan Food</h1>
        <p className="text-muted-foreground">
          Take a photo or upload an image to analyze nutrition information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Capture or select a food image to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload">Food Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    disabled={isAnalyzing}
                    className="cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing}
                    title="Take photo"
                  >
                    <Camera className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG, WebP. Max size: 10MB
                </p>
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isAnalyzing}
                  >
                    Remove image
                  </Button>
                </div>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!selectedFile || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 size-4" />
                    Analyze Image
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Results</CardTitle>
            <CardDescription>
              Detected foods and nutrition information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!results && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Camera className="mb-4 size-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload an image to see nutrition analysis results
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analyzing your food image...
                </p>
              </div>
            )}

            {results && results.length > 0 && (
              <div className="space-y-4">
                {results.map((food, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{food.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {food.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Calories</span>
                        <p className="font-medium">{food.calories} kcal</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Protein</span>
                        <p className="font-medium">{food.protein}g</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carbs</span>
                        <p className="font-medium">{food.carbs}g</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fats</span>
                        <p className="font-medium">{food.fats}g</p>
                      </div>
                    </div>
                  </div>
                ))}

                {saveSuccess ? (
                  <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Nutrition log saved successfully! Redirecting...</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleSave}
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save to Nutrition Log"
                    )}
                  </Button>
                )}
              </div>
            )}

            {results && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="mb-4 size-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No food items detected in the image. Please try a different photo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

