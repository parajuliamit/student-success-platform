import { useState } from 'react'
import { createFileRoute, Link, Navigate, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useAuth } from '#/features/auth/auth-provider'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login, status } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('Admin123!')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ username, password })
      await navigate({ to: '/dashboard' })
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to sign in right now.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative mx-auto flex min-h-svh w-full items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(79,184,178,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(47,106,74,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(231,243,236,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(79,184,178,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(47,106,74,0.12),transparent_30%),linear-gradient(180deg,rgba(8,18,22,0.96),rgba(10,20,24,0.92))]" />
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="island-shell relative overflow-hidden rounded-3xl border border-[var(--line)] p-6 shadow-[0_22px_70px_rgba(15,45,40,0.12)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.7),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(79,184,178,0.18),transparent_34%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kicker)] shadow-[0_10px_24px_rgba(30,90,72,0.08)]">
              <ShieldCheck className="size-3.5" />
              Secure staff access
            </div>
            <div className="max-w-xl space-y-4">
              <h1 className="display-title text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
                Sign in to monitor student risk, attendance, and intervention progress.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--sea-ink-soft)] sm:text-lg">
                Connect to the FastAPI auth endpoints at localhost:8000, store the
                bearer token locally, and keep the current profile visible across
                the dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 backdrop-blur-sm">
                <KeyRound className="size-5 text-[var(--lagoon-deep)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--sea-ink)]">Token login</p>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Bearer access tokens with local session restore.</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 backdrop-blur-sm">
                <UserRound className="size-5 text-[var(--lagoon-deep)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--sea-ink)]">Profile check</p>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Fetch the signed-in user from <code>/auth/me</code>.</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 backdrop-blur-sm">
                <LockKeyhole className="size-5 text-[var(--lagoon-deep)]" />
                <p className="mt-3 text-sm font-semibold text-[var(--sea-ink)]">Logout flow</p>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Clear the server and local session together.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 shadow-[0_18px_40px_rgba(15,45,40,0.08)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kicker)]">Quick start</p>
              <div className="mt-4 grid gap-2 text-sm text-[var(--sea-ink-soft)] sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
                  <p className="font-semibold text-[var(--sea-ink)]">Username</p>
                  <p className="mt-1">admin</p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-white/70 p-4">
                  <p className="font-semibold text-[var(--sea-ink)]">Password</p>
                  <p className="mt-1">Admin123!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full rounded-3xl border-[color-mix(in_oklch,var(--border),white_12%)] bg-[var(--surface-strong)] shadow-[0_24px_80px_rgba(15,45,40,0.16)] backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Sign in with your platform credentials to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
                {error ? (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <div className="flex items-center justify-between gap-4 text-sm text-[var(--sea-ink-soft)]">
                  <span>Need a different route?</span>
                  <Link to="/about" className="font-semibold">
                    Learn more
                  </Link>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-muted/30 px-4 py-3 text-sm text-[var(--sea-ink-soft)]">
                  <CheckCircle2 className="size-4 text-[var(--lagoon-deep)]" />
                  <span>Session state is restored automatically when a valid token exists.</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}