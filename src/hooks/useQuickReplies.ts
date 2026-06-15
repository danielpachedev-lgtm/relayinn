import { useCallback, useEffect, useState } from 'react'
import { useHotelStore } from '../store/hotelStore'
import {
  ensureQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  swapQuickReplyOrder,
} from '../lib/quickReplyService'
import type { QuickReply } from '../types'

export function useQuickReplies() {
  const { currentHotel } = useHotelStore()
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!currentHotel) return
    const data = await ensureQuickReplies(currentHotel.id)
    setReplies(data)
  }, [currentHotel])

  useEffect(() => {
    if (!currentHotel) {
      setLoading(false)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [currentHotel, refresh])

  async function add(name: string, message: string) {
    if (!currentHotel) return
    const maxOrder = replies.reduce((m, r) => Math.max(m, r.sort_order), -1)
    const created = await createQuickReply(currentHotel.id, name, message, maxOrder + 1)
    setReplies((prev) => [...prev, created])
    return created
  }

  async function update(id: string, name: string, message: string) {
    const updated = await updateQuickReply(id, { name, message })
    setReplies((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }

  async function remove(id: string) {
    await deleteQuickReply(id)
    setReplies((prev) => prev.filter((r) => r.id !== id))
  }

  async function moveUp(index: number) {
    if (index <= 0) return
    const a = replies[index]
    const b = replies[index - 1]
    await swapQuickReplyOrder(a, b)
    setReplies((prev) => {
      const next = [...prev]
      next[index] = { ...b, sort_order: a.sort_order }
      next[index - 1] = { ...a, sort_order: b.sort_order }
      return next.sort((x, y) => x.sort_order - y.sort_order)
    })
  }

  async function moveDown(index: number) {
    if (index >= replies.length - 1) return
    const a = replies[index]
    const b = replies[index + 1]
    await swapQuickReplyOrder(a, b)
    setReplies((prev) => {
      const next = [...prev]
      next[index] = { ...b, sort_order: a.sort_order }
      next[index + 1] = { ...a, sort_order: b.sort_order }
      return next.sort((x, y) => x.sort_order - y.sort_order)
    })
  }

  return { replies, loading, refresh, add, update, remove, moveUp, moveDown }
}
