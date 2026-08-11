import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle, Key, Plus, Shield, Trash2, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DashboardLayout } from '#/components/layout/dashboard-layout'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useAuth } from '#/features/auth/auth-provider'
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type AuthUser,
  type UserCreatePayload,
  type UserUpdatePayload,
} from '#/features/users/users-api'

export const Route = createFileRoute('/admin/users')({
  component: UserManagementPage,
})

type FormMode = 'create' | 'edit' | 'reset-password'

interface FormState {
  mode: FormMode
  userId?: number
  username: string
  fullName: string
  email: string
  password: string
  role: 'admin' | 'staff'
  isActive: boolean
}

const initialFormState: FormState = {
  mode: 'create',
  username: '',
  fullName: '',
  email: '',
  password: '',
  role: 'staff',
  isActive: true,
}

function UserManagementPage() {
  const { user: currentUser, token } = useAuth()
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const usersQuery = useQuery({
    queryKey: ['users', token],
    queryFn: () => listUsers(token ?? ''),
    enabled: Boolean(token),
  })

  const createUserMutation = useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(token ?? '', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDialogOpen(false)
      setFormState(initialFormState)
      setSuccessMessage('User created successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Failed to create user')
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UserUpdatePayload }) =>
      updateUser(token ?? '', userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDialogOpen(false)
      setFormState(initialFormState)
      setSuccessMessage('User updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Failed to update user')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) =>
      resetUserPassword(token ?? '', userId, { password }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDialogOpen(false)
      setFormState(initialFormState)
      setSuccessMessage('Password reset successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Failed to reset password')
    },
  })

  const users = usersQuery.data?.users ?? []
  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase()
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.full_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    )
  }, [users, search])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formState.username.trim()) {
      setFormError('Username is required')
      return
    }
    if (!formState.fullName.trim()) {
      setFormError('Full name is required')
      return
    }
    if (!formState.email.trim()) {
      setFormError('Email is required')
      return
    }
    if (!formState.password.trim()) {
      setFormError('Password is required')
      return
    }
    if (formState.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    const payload: UserCreatePayload = {
      username: formState.username,
      full_name: formState.fullName,
      email: formState.email,
      password: formState.password,
      role: formState.role,
    }

    await createUserMutation.mutateAsync(payload)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formState.userId) {
      setFormError('User ID is missing')
      return
    }

    if (!formState.fullName.trim()) {
      setFormError('Full name is required')
      return
    }
    if (!formState.email.trim()) {
      setFormError('Email is required')
      return
    }

    const payload: UserUpdatePayload = {
      full_name: formState.fullName,
      email: formState.email,
      role: formState.role,
      is_active: formState.isActive,
    }

    await updateUserMutation.mutateAsync({
      userId: formState.userId,
      payload,
    })
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formState.userId) {
      setFormError('User ID is missing')
      return
    }
    if (!formState.password.trim()) {
      setFormError('New password is required')
      return
    }
    if (formState.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    await resetPasswordMutation.mutateAsync({
      userId: formState.userId,
      password: formState.password,
    })
  }

  const openCreateDialog = () => {
    setFormState(initialFormState)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (targetUser: AuthUser) => {
    setFormState({
      mode: 'edit',
      userId: targetUser.id,
      username: targetUser.username,
      fullName: targetUser.full_name,
      email: targetUser.email,
      password: '',
      role: targetUser.role as 'admin' | 'staff',
      isActive: targetUser.is_active,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const openResetPasswordDialog = (targetUser: AuthUser) => {
    setFormState({
      mode: 'reset-password',
      userId: targetUser.id,
      username: targetUser.username,
      fullName: targetUser.full_name,
      email: targetUser.email,
      password: '',
      role: targetUser.role as 'admin' | 'staff',
      isActive: targetUser.is_active,
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const isLoading =
    createUserMutation.isPending ||
    updateUserMutation.isPending ||
    resetPasswordMutation.isPending

  const getDialogTitle = () => {
    switch (formState.mode) {
      case 'create':
        return 'Create New User'
      case 'edit':
        return 'Edit User'
      case 'reset-password':
        return 'Reset Password'
    }
  }

  const getDialogSubmitLabel = () => {
    switch (formState.mode) {
      case 'create':
        return 'Create User'
      case 'edit':
        return 'Update User'
      case 'reset-password':
        return 'Reset Password'
    }
  }

  const handleDialogSubmit = (e: React.FormEvent) => {
    switch (formState.mode) {
      case 'create':
        void handleCreateUser(e)
        break
      case 'edit':
        void handleUpdateUser(e)
        break
      case 'reset-password':
        void handleResetPassword(e)
        break
    }
  }

  // Check if not admin and show access denied
  if (currentUser?.role !== 'admin') {
    return (
      <DashboardLayout title="Access Denied" description="">
        <Card className="rounded-2xl border-red-500/50 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6 flex items-start gap-3">
            <Shield className="size-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-200">Access Denied</p>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                Only administrators can access the user management page.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="User Management"
      description="Create, edit, and manage user accounts and permissions."
    >
      <div className="space-y-6">
        {successMessage && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            {successMessage}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search users by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="size-4" />
            Create User
          </Button>
        </div>

        <Card className="rounded-2xl border-border/70">
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage platform users and their roles.</CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-muted-foreground">
                      <th className="text-left font-semibold px-4 py-3">Name</th>
                      <th className="text-left font-semibold px-4 py-3">Username</th>
                      <th className="text-left font-semibold px-4 py-3">Email</th>
                      <th className="text-left font-semibold px-4 py-3">Role</th>
                      <th className="text-left font-semibold px-4 py-3">Status</th>
                      <th className="text-right font-semibold px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((targetUser) => (
                      <tr key={targetUser.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{targetUser.full_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">@{targetUser.username}</td>
                        <td className="px-4 py-3 text-muted-foreground">{targetUser.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">
                            {targetUser.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={targetUser.is_active ? 'outline' : 'destructive'}>
                            {targetUser.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(targetUser)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openResetPasswordDialog(targetUser)}
                              title="Reset password"
                            >
                              <Key className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            {formState.mode === 'reset-password' && (
              <DialogDescription>
                Set a new password for {formState.fullName}. They will need to use this password on their next login.
              </DialogDescription>
            )}
          </DialogHeader>

          <form onSubmit={handleDialogSubmit} className="space-y-4">
            {formError && (
              <div className="flex gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {formState.mode !== 'reset-password' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formState.username}
                    onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                    disabled={isLoading || formState.mode === 'edit'}
                    placeholder="john.doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    disabled={isLoading}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    disabled={isLoading}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {formState.mode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formState.password}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    disabled={isLoading}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formState.role} onValueChange={(role) =>
                    setFormState({ ...formState, role: role as 'admin' | 'staff' })
                  }>
                    <SelectTrigger id="role" disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff (Module Coordinator)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formState.mode === 'edit' && (
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Select
                      value={formState.isActive ? 'active' : 'inactive'}
                      onValueChange={(status) =>
                        setFormState({ ...formState, isActive: status === 'active' })
                      }
                    >
                      <SelectTrigger id="isActive" disabled={isLoading}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {formState.mode === 'reset-password' && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formState.password}
                  onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                  disabled={isLoading}
                  placeholder="••••••••"
                />
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : getDialogSubmitLabel()}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
