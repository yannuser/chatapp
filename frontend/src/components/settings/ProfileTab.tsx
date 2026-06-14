import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { differenceInYears, parseISO } from 'date-fns'
import { updateUser, deleteUser } from '../../api/users'
import { apiErrorDetail } from '../../lib/apiError'
import { useAuthStore } from '../../stores/authStore'
import { useToastStore } from '../../stores/toastStore'
import Avatar from '../ui/Avatar'
import ConfirmDialog from '../ui/ConfirmDialog'

export default function ProfileTab() {
  const navigate = useNavigate()
  const { user, setAuth, accessToken, clearAuth } = useAuthStore()
  const { addToast } = useToastStore()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    username: user?.username ?? '',
    email: user?.email ?? '',
  })
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })

  const update = useMutation({
    mutationFn: () => updateUser(user!.id, form),
    onSuccess: (updated) => {
      setAuth(updated, accessToken!)
      setEditing(false)
      addToast('Profile updated', 'success')
    },
    onError: (e) => addToast(apiErrorDetail(e, 'Update failed')),
  })

  const changePassword = useMutation({
    mutationFn: () => updateUser(user!.id, { password: pwForm.password }),
    onSuccess: () => { setPwForm({ password: '', confirm: '' }); addToast('Password changed', 'success') },
    onError: (e) => addToast(apiErrorDetail(e, 'Password change failed')),
  })

  const deleteAccount = useMutation({
    mutationFn: () => deleteUser(user!.id),
    onSuccess: () => { clearAuth(); navigate('/login', { replace: true }) },
    onError: (e) => addToast(apiErrorDetail(e, 'Could not delete account')),
  })

  const age = user?.birthdate ? differenceInYears(new Date(), parseISO(user.birthdate)) : null

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        <Avatar name={user ? `${user.first_name} ${user.last_name}` : '?'} size="lg" />
        <div>
          <p className="font-semibold text-primary text-base">{user?.first_name} {user?.last_name}</p>
          <p className="text-secondary text-sm">@{user?.username}</p>
          {age !== null && <p className="text-secondary text-xs mt-0.5">{age} years old</p>}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          {(['first_name', 'last_name', 'username', 'email'] as const).map((field) => (
            <div key={field}>
              <label className="text-secondary text-xs mb-1 block capitalize">{field.replace('_', ' ')}</label>
              <input
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-primary text-primary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => update.mutate()} disabled={update.isPending} className="px-4 py-2 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-secondary text-sm rounded-lg hover-bg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {[
            { label: 'Email', value: user?.email },
            { label: 'Username', value: `@${user?.username}` },
            { label: 'Birthdate', value: user?.birthdate },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-default">
              <span className="text-secondary text-sm">{label}</span>
              <span className="text-primary text-sm">{value}</span>
            </div>
          ))}
          <button onClick={() => setEditing(true)} className="mt-2 px-4 py-2 bg-accent text-on-accent text-sm rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors">
            Edit profile
          </button>
        </div>
      )}

      <div className="border-t border-default pt-4 space-y-3">
        <p className="font-medium text-primary text-sm">Change password</p>
        <input
          type="password"
          value={pwForm.password}
          onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="New password"
          className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        />
        <input
          type="password"
          value={pwForm.confirm}
          onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
          placeholder="Confirm password"
          className="w-full bg-primary text-primary placeholder:text-secondary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        />
        <button
          onClick={() => {
            if (pwForm.password !== pwForm.confirm) { addToast('Passwords do not match'); return }
            changePassword.mutate()
          }}
          disabled={!pwForm.password || !pwForm.confirm || changePassword.isPending}
          className="px-4 py-2 bg-accent text-on-accent text-sm rounded-lg font-medium disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
        >
          Update password
        </button>
      </div>

      <div className="border-t border-default pt-4">
        <p className="font-medium text-danger text-sm mb-1">Danger zone</p>
        <p className="text-secondary text-xs mb-3">Permanently delete your account and all of your data.</p>
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          Delete account
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete account"
          message="This permanently deletes your account, messages, and settings. This cannot be undone."
          confirmLabel="Delete account"
          danger
          loading={deleteAccount.isPending}
          onConfirm={() => deleteAccount.mutate()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
