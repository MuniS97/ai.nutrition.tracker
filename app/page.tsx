import Link from "next/link"
import { ArrowRight, Bot, Sigma, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_circle_at_50%_-10%,hsl(var(--foreground)/0.08),transparent_60%)]" />

      <main className="relative mx-auto w-full max-w-5xl px-6 pb-16 pt-10">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Build a chat-first calculator powered by modern AI.
            </h1>
            <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Next.js 16 + Tailwind + shadcn/ui, ready for Firebase, Axios,
              Grammy (Telegram), and Google Generative AI.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/#get-started">
                  Get started <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="https://nextjs.org/docs" target="_blank" rel="noreferrer">
                  Next.js docs
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Zap className="size-4" /> Fast UI
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  App Router, server components, and shadcn primitives.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Bot className="size-4" /> AI-ready
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hook up Gemini via <code className="font-mono">@google/generative-ai</code>.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Sigma className="size-4" /> Typed core
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  TypeScript-first structure with <code className="font-mono">lib/</code> and{" "}
                  <code className="font-mono">types/</code>.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 font-medium">
                  <ArrowRight className="size-4" /> Integrations
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Firebase auth/db, Axios HTTP, and Grammy for Telegram bot flows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="get-started" className="mt-16 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Next steps</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Start dev server: <code className="font-mono">npm run dev</code></li>
            <li>Add more UI: <code className="font-mono">npx shadcn@latest add card input</code></li>
            <li>Create bot entrypoint under <code className="font-mono">lib/</code> and types in <code className="font-mono">types/</code></li>
          </ul>
        </section>
      </main>
    </div>
  )
}
