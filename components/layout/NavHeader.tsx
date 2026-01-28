"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSession, signOut, type UserSession } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Sigma, Menu, X, LogOut, Camera, LayoutDashboard, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Предполагаем, что в @/lib/firebase/auth у тебя есть доступ к объекту auth
    // Если нет, импортируй getAuth из firebase/auth
    const auth = getAuth(); 
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession({
          user,
          profile: user.providerData[0] as unknown as any,
        });
      } else {
        setSession(null);
      }
      setIsLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isAuthenticated = !!session;
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  const navLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/scan", label: "Scan Food", icon: Camera },
      ]
    : [
        { href: "/login", label: "Sign In", icon: null },
        { href: "/register", label: "Sign Up", icon: null },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-card">
            <Sigma className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            AI Calculator Bot
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {!isPublicPage && (
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground/80",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Home className="mr-1 inline size-4" />
              Home
            </Link>
          )}
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors hover:text-foreground/80",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {Icon && <Icon className="size-4" />}
                {link.label}
              </Link>
            );
          })}
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign Out
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {!isPublicPage && (
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="size-4" />
                Home
              </Link>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="size-4" />}
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated && (
              <Button
                variant="outline"
                className="mt-2 w-full justify-start"
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="mr-2 size-4" />
                Sign Out
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

