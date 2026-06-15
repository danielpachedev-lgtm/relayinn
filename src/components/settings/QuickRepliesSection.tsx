import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { QuickReplyModal } from './QuickReplyModal'
import { useQuickReplies } from '../../hooks/useQuickReplies'
import type { QuickReply } from '../../types'

export function QuickRepliesSection() {
  const { replies, loading, add, update, remove, moveUp, moveDown } = useQuickReplies()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<QuickReply | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuickReply | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(reply: QuickReply) {
    setEditing(reply)
    setModalOpen(true)
  }

  async function handleSubmit(name: string, message: string) {
    try {
      if (editing) {
        await update(editing.id, name, message)
        toast.success('Quick reply updated')
      } else {
        await add(name, message)
        toast.success('Quick reply added')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
      throw err
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      toast.success('Quick reply deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Quick Replies</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Message templates available in the inbox reply bar.
          </p>
        </div>
        <Button onClick={openAdd}>Add Quick Reply</Button>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E5E3DF] divide-y divide-[#E5E3DF]">
        {loading ? (
          <p className="px-4 py-8 text-sm text-[#6B7280] text-center">Loading…</p>
        ) : replies.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[#6B7280] text-center">
            No quick replies yet. Add one or they will be seeded automatically.
          </p>
        ) : (
          replies.map((reply, index) => (
            <div key={reply.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveUp(index)}
                  className="p-0.5 text-[#9CA3AF] hover:text-[#374151] disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUpIcon />
                </button>
                <button
                  type="button"
                  disabled={index === replies.length - 1}
                  onClick={() => moveDown(index)}
                  className="p-0.5 text-[#9CA3AF] hover:text-[#374151] disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDownIcon />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827]">{reply.name}</p>
                <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{reply.message}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(reply)}
                  className="p-2 rounded-[6px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
                  aria-label="Edit"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => setDeleteTarget(reply)}
                  className="p-2 rounded-[6px] text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors"
                  aria-label="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <QuickReplyModal
        open={modalOpen}
        reply={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete quick reply"
        message={`Delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function ChevronUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
