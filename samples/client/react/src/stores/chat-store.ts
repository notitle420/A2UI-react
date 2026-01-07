import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { AgentCard, Part } from '@a2a-js/sdk';
import type { PartResolver, UiAgent, UiMessage, UiMessageContent } from '@/types';

// Default part resolvers - will be configured externally
const defaultPartResolvers: PartResolver[] = [];

/**
 * Chat Store - Core chat state management.
 * A2UI surface state has been moved to a2ui-store.ts.
 * Message sending logic has been moved to use-send-message.ts hook.
 */
interface ChatState {
  // Core chat state
  history: UiMessage[];
  isA2aStreamOpen: boolean;
  contextId: string | undefined;
  agentCard: AgentCard | null;
  partResolvers: PartResolver[];

  // Granular actions for use by useSendMessage hook
  addUserMessage: (text: string, timestamp: string) => void;
  addPendingAgentMessage: (timestamp: string) => void;
  updateLastMessage: (
    contents: UiMessageContent[],
    status: 'completed' | 'pending',
    subagentCard?: AgentCard
  ) => void;
  setStreamOpen: (isOpen: boolean) => void;

  // Configuration actions
  setAgentCard: (card: AgentCard | null) => void;
  setPartResolvers: (resolvers: PartResolver[]) => void;
  setContextId: (contextId: string) => void;

  // Utility actions
  cancelOngoingStream: () => void;
  clearHistory: () => void;

  // Legacy sendMessage - kept for backwards compatibility
  // Use useSendMessage hook for new code
  sendMessage: (text: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  history: [],
  isA2aStreamOpen: false,
  contextId: undefined,
  agentCard: null,
  partResolvers: defaultPartResolvers,

  addUserMessage: (text: string, timestamp: string) => {
    const state = get();

    const userMessage: UiMessage = {
      type: 'ui_message',
      id: uuid(),
      contextId: state.contextId ?? '',
      role: { type: 'ui_user' },
      contents: [
        {
          type: 'ui_message_content',
          id: uuid(),
          data: { kind: 'text', text } as Part,
          variant: 'default_text_part',
        },
      ],
      status: 'pending',
      created: timestamp,
      lastUpdated: timestamp,
    };

    set((state) => ({
      history: [...state.history, userMessage],
    }));
  },

  addPendingAgentMessage: (timestamp: string) => {
    const state = get();

    const agentRole: UiAgent = {
      type: 'ui_agent',
      name: state.agentCard?.name ?? 'Agent',
      iconUrl: state.agentCard?.iconUrl ?? 'gemini-color.svg',
    };

    const pendingAgentMessage: UiMessage = {
      type: 'ui_message',
      id: uuid(),
      contextId: state.contextId ?? '',
      role: agentRole,
      contents: [],
      status: 'pending',
      created: timestamp,
      lastUpdated: timestamp,
    };

    set((state) => ({
      history: [...state.history, pendingAgentMessage],
    }));
  },

  updateLastMessage: (
    contents: UiMessageContent[],
    status: 'completed' | 'pending',
    subagentCard?: AgentCard
  ) => {
    set((state) => {
      const history = [...state.history];
      if (history.length > 0) {
        const lastMessage = history[history.length - 1];

        // Update role with subagent info if available
        let updatedRole = lastMessage.role;
        if (subagentCard && lastMessage.role.type === 'ui_agent') {
          updatedRole = {
            ...lastMessage.role,
            subagentName: subagentCard.name,
          };
        }

        history[history.length - 1] = {
          ...lastMessage,
          role: updatedRole,
          contents: [...lastMessage.contents, ...contents],
          status,
          lastUpdated: new Date().toISOString(),
        };
      }
      return { history };
    });
  },

  setStreamOpen: (isOpen: boolean) => {
    set({ isA2aStreamOpen: isOpen });
  },

  cancelOngoingStream: () => {
    // This is now handled by useSendMessage hook's cancelStream
    // Kept for backwards compatibility
    set({ isA2aStreamOpen: false });
  },

  setAgentCard: (card) => set({ agentCard: card }),

  setPartResolvers: (resolvers) => set({ partResolvers: resolvers }),

  setContextId: (contextId) => set({ contextId }),

  clearHistory: () => {
    // Note: A2UI surfaces should be cleared via useA2uiProcessor.reset()
    set({ history: [], contextId: undefined });
  },

  // Legacy sendMessage - preserved for backwards compatibility
  // New code should use the useSendMessage hook
  sendMessage: async (text: string) => {
    console.warn(
      'useChatStore.sendMessage is deprecated. Use useSendMessage hook instead.'
    );

    const { addUserMessage, addPendingAgentMessage, updateLastMessage, setStreamOpen, setContextId, partResolvers, contextId } = get();
    const now = new Date().toISOString();

    addUserMessage(text, now);
    addPendingAgentMessage(now);
    setStreamOpen(true);

    try {
      const { a2aService } = await import('@/services/a2a-service');
      const { catalogService } = await import('@/services/catalog-service');
      const { extractA2aPartsFromResponse } = await import('@/utils/a2a');
      const { convertPartToUiMessageContent } = await import('@/utils/ui-message-utils');

      const response = await a2aService.sendMessage(
        [{ kind: 'text', text }],
        {
          contextId,
          supportedCatalogIds: catalogService.catalogUris,
        }
      );

      const agentResponseParts = extractA2aPartsFromResponse(response);
      const newContents = agentResponseParts.map((part) =>
        convertPartToUiMessageContent(part, partResolvers)
      );

      const subagentCard = response.result?.metadata?.['a2a_subagent'] as AgentCard | undefined;
      const newContextId = (response as { context_id?: string }).context_id;
      if (newContextId) {
        setContextId(newContextId);
      }

      updateLastMessage(newContents, 'completed', subagentCard);
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.name === 'AbortError'
          ? 'You cancelled the response.'
          : `Something went wrong: ${error}`;

      updateLastMessage(
        [
          {
            type: 'ui_message_content',
            id: uuid(),
            data: { kind: 'text', text: errorMessage } as Part,
            variant: 'default_text_part',
          },
        ],
        'completed'
      );
    } finally {
      setStreamOpen(false);
    }
  },
}));
