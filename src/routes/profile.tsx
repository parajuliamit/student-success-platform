import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, LogOut, Mail, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { useAuth } from '#/features/auth/auth-provider'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth()

  return (
    <DashboardLayout
      title="Profile"
      description="Inspect the current login profile returned by /auth/me and refresh it on demand."
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Current session</CardTitle>
            <CardDescription>Information returned from the backend profile endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <UserRound className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{user.full_name}</p>
                      <Badge variant="secondary" className="rounded-full capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <Mail className="size-3.5" />
                      Email
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">{user.email}</dd>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <ShieldCheck className="size-3.5" />
                      Active
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {user.is_active ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Created
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {new Date(user.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Updated
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-foreground">
                      {new Date(user.updated_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                No profile is currently loaded.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border/70 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Re-check the login profile or end the session.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" className="justify-start gap-2" onClick={() => void refreshProfile()}>
                <RefreshCw className="size-4" />
                Refresh profile
              </Button>
              <Button variant="destructive" className="justify-start gap-2" onClick={() => void logout()}>
                <LogOut className="size-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}