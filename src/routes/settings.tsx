import { createFileRoute } from '@tanstack/react-router'
import { Settings, Shield, Palette } from 'lucide-react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      description="Configure institutional preferences, theming, and future access controls."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Branding, language, and default view options.</CardDescription>
          </CardHeader>
          <CardContent><Settings className="size-6 text-primary" /></CardContent>
        </Card>
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>Admin and staff role configuration.</CardDescription>
          </CardHeader>
          <CardContent><Shield className="size-6 text-primary" /></CardContent>
        </Card>
        <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme, contrast, and presentation styling.</CardDescription>
          </CardHeader>
          <CardContent><Palette className="size-6 text-primary" /></CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}