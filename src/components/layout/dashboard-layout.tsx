import { useRouterState, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  LayoutDashboard,
  GraduationCap,
  School,
  LineChart,
  ShieldAlert,
  FileText,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Input } from '#/components/ui/input'
import { SidebarSeparator } from '#/components/ui/sidebar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'

interface DashboardLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/students', icon: GraduationCap },
  { label: 'Classes', href: '/classes', icon: School },
  { label: 'Analytics', href: '/analytics', icon: LineChart },
  { label: 'Predictions', href: '/predictions', icon: ShieldAlert },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

export function DashboardLayout({ title, description, children }: DashboardLayoutProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const currentLabel = useMemo(() => {
    const matchedItem = navigationItems.find((item) => pathname.startsWith(item.href))
    return matchedItem?.label ?? 'Dashboard'
  }, [pathname])

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="px-4 pt-4">
          <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <School className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/65">
                  MSc Platform
                </p>
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  Intelligent Student Success Platform
                </p>
              </div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link to={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="px-4 pb-4">
          <div className="rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-sidebar-foreground">Staff view</p>
                <p className="text-xs text-sidebar-foreground/70">
                  Admins and staff use the same interface.
                </p>
              </div>
              <Badge variant="outline" className="border-sidebar-border text-sidebar-foreground">
                Role agnostic
              </Badge>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-start gap-3">
                <SidebarTrigger className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {currentLabel}
                  </p>
                  <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" className="relative">
                        <Bell />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuItem>New attendance alert</DropdownMenuItem>
                    <DropdownMenuItem>Prediction refresh completed</DropdownMenuItem>
                    <DropdownMenuItem>Two students need review</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className="h-10 gap-3 rounded-full border-border/80 bg-background px-2 pr-3"
                      >
                        <Avatar className="size-8">
                          <AvatarFallback>AS</AvatarFallback>
                        </Avatar>
                        <span className="hidden text-left leading-tight sm:block">
                          <span className="block text-xs text-muted-foreground">Logged in as</span>
                          <span className="block text-sm font-semibold text-foreground">Academic Staff</span>
                        </span>
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Role settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full max-w-2xl">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search dashboard"
                    placeholder="Search students, classes, reports, predictions"
                    className="h-11 rounded-xl border-border/70 pl-10 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Menu className="size-4 lg:hidden" />
                  <span>Institutional dashboard preview</span>
                </div>
              </div>
            </div>
          </header>
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}