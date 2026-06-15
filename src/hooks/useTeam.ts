import { useCallback, useEffect, useState } from 'react'
import { fetchTeam, updateStaffRole, removeStaffMember } from '../lib/settingsService'
import type { TeamMember } from '../types'

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchTeam()
    setMembers(data)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  async function changeRole(staffId: string, role: 'manager' | 'staff') {
    await updateStaffRole(staffId, role)
    setMembers((prev) =>
      prev.map((m) => (m.id === staffId ? { ...m, role } : m))
    )
  }

  async function remove(staffId: string) {
    await removeStaffMember(staffId)
    setMembers((prev) => prev.filter((m) => m.id !== staffId))
  }

  return { members, loading, refresh, changeRole, remove }
}
