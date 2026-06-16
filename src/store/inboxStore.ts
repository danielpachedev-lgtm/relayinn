import { create } from 'zustand'
import type { Conversation, Message } from '../types'

interface InboxStore {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>

  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (conversation: Conversation | null) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void

  setMessages: (conversationId: string, messages: Message[]) => void
  appendMessage: (conversationId: string, message: Message) => void
  removeMessage: (conversationId: string, messageId: string) => void
  clearMessages: (conversationId: string) => void
}

export const useInboxStore = create<InboxStore>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: {},

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      activeConversation:
        state.activeConversation?.id === id
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  appendMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? []
      if (existing.some((m) => m.id === message.id)) return state

      const withoutPendingDuplicate =
        message.sender_type === 'staff' && !message.id.startsWith('pending-')
          ? existing.filter(
              (m) => !(m.id.startsWith('pending-') && m.content === message.content)
            )
          : existing

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...withoutPendingDuplicate, message],
        },
      }
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),

  clearMessages: (conversationId) =>
    set((state) => {
      const next = { ...state.messages }
      delete next[conversationId]
      return { messages: next }
    }),
}))
