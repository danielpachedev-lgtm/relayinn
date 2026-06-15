import { useState } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { InviteTeamModal } from './InviteTeamModal'
import { UpgradeLimitModal } from '../billing/UpgradeLimitModal'
import { useTeam } from '../../hooks/useTeam'
import { usePlanEnforcement } from '../../store/hotelStore'
import type { TeamMember } from '../../types'

export function TeamSection() {
  const { members, loading, changeRole, remove } = useTeam()
  const { canAddStaff } = usePlanEnforcement()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [removing, setRemoving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleRoleChange(member: TeamMember, role: 'manager' | 'staff') {
    if (member.role === 'owner' || member.role === role) return
    setUpdatingId(member.id)
    try {
      await changeRole(member.id, role)
      toast.success('Role updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await remove(removeTarget.id)
      toast.success(`${removeTarget.name} removed from team`)
      setRemoveTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Team</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Manage who has access to your hotel inbox.
          </p>
        </div>
        <Button onClick={() => (canAddStaff ? setInviteOpen(true) : setLimitOpen(true))}>
          Invite Team Member
        </Button>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E5E3DF] overflow-hidden">
        {loading ? (
          <p className="px-4 py-8 text-sm text-[#6B7280] text-center">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[#6B7280] text-center">No team members yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E3DF] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Member</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Email</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Role</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7280]">Status</th>
                <th className="text-right px-4 py-3 font-medium text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DF]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-[#F9FAFB]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} src={member.avatar_url} size="sm" />
                      <span className="font-medium text-[#111827]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{member.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[#16A34A]">
                      <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {member.role !== 'owner' ? (
                        <>
                          <select
                            value={member.role}
                            disabled={updatingId === member.id}
                            onChange={(e) =>
                              handleRoleChange(member, e.target.value as 'manager' | 'staff')
                            }
                            className="text-xs px-2 py-1.5 border border-[#E5E3DF] rounded-[6px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          >
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                          <button
                            onClick={() => setRemoveTarget(member)}
                            className="text-xs font-medium text-[#DC2626] hover:text-[#B91C1C] px-2 py-1.5"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InviteTeamModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <UpgradeLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        title="Team limit reached"
        message="You've reached your team limit. Upgrade to Pro for up to 10 team members."
      />

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove team member"
        message={`Remove ${removeTarget?.name ?? ''} from your team?`}
        confirmLabel="Remove"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: 'bg-[#F3E8FF] text-[#7C3AED]',
    manager: 'bg-[#EFF6FF] text-[#2563EB]',
    staff: 'bg-[#F3F4F6] text-[#6B7280]',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[role] ?? styles.staff}`}
    >
      {role}
    </span>
  )
}
