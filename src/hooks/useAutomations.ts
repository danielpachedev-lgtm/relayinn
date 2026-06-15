import { useState, useEffect, useCallback } from 'react'
import { useHotelStore } from '../store/hotelStore'
import {
  ensureAutomations,
  fetchAutomationLogs,
  type AutomationLogWithMeta,
} from '../lib/automationService'
import type { Automation } from '../types'
import { supabase } from '../lib/supabase'

export function useAutomations() {
  const { currentHotel } = useHotelStore()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [logs, setLogs] = useState<AutomationLogWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)

  const loadAll = useCallback(async (hotelId: string) => {
    setLoading(true)
    setLogsLoading(true)
    try {
      const [autoData, logData] = await Promise.all([
        ensureAutomations(hotelId),
        fetchAutomationLogs(hotelId),
      ])
      setAutomations(autoData)
      setLogs(logData)
    } catch (err) {
      console.error('[useAutomations]', err)
    } finally {
      setLoading(false)
      setLogsLoading(false)
    }
  }, [])

  const reloadLogs = useCallback(async () => {
    if (!currentHotel) return
    const logData = await fetchAutomationLogs(currentHotel.id)
    setLogs(logData)
  }, [currentHotel])

  const reloadAutomations = useCallback(async () => {
    if (!currentHotel) return
    const autoData = await ensureAutomations(currentHotel.id)
    setAutomations(autoData)
  }, [currentHotel])

  useEffect(() => {
    if (!currentHotel) {
      setLoading(false)
      setLogsLoading(false)
      return
    }

    loadAll(currentHotel.id)

    const channel = supabase
      .channel(`automations:${currentHotel.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automations',
          filter: `hotel_id=eq.${currentHotel.id}`,
        },
        () => reloadAutomations()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_logs',
          filter: `hotel_id=eq.${currentHotel.id}`,
        },
        () => reloadLogs()
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [currentHotel?.id, loadAll, reloadAutomations, reloadLogs])

  return {
    automations,
    logs,
    loading,
    logsLoading,
    setAutomations,
    reloadLogs,
    reloadAutomations,
  }
}
