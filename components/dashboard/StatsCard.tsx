import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  className?: string;
}

export function StatsCard({
  title,
  current,
  target,
  unit = "",
  className,
}: StatsCardProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOverTarget = current > target;
  const remaining = Math.max(target - current, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold">
            {Math.round(current)}
            {unit && <span className="ml-1 text-lg text-muted-foreground">{unit}</span>}
          </span>
          <span className="text-sm text-muted-foreground">
            / {Math.round(target)}
            {unit && unit}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(percentage)}% of target</span>
            {isOverTarget ? (
              <span className="text-destructive">Over by {Math.round(current - target)}{unit}</span>
            ) : (
              <span className="text-muted-foreground">
                {Math.round(remaining)}{unit} remaining
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isOverTarget ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

