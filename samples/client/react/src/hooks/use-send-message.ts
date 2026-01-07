import { useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type { AgentCard, Part } from '@a2a-js/sdk';
import { a2aService } from '@/services/a2a-service';
import { catalogService } from '@/services/catalog-service';
import { useChatStore } from '@/stores/chat-store';
import { useA2uiProcessor } from './use-a2ui-processor';
import { extractA2aPartsFromResponse } from '@/utils/a2a';
import { convertPartToUiMessageContent } from '@/utils/ui-message-utils';
import type { UiMessageContent } from '@/types';

/**
 * Hook for sending messages to the A2A agent.
 *
 * Coordinates between:
 * - Chat store (message history, UI state)
 * - A2UI processor (surface rendering)
 * - A2A service (API communication)
 *
 * Uses the existing a2a-service.ts instead of inline fetch.
 *
 * @example
 * const { sendMessage, cancelStream, isStreaming } = useSendMessage();
 *
 * // Send a message
 * await sendMessage("What's the weather?");
 *
 * // Cancel ongoing request
 * cancelStream();
 */
export function useSendMessage() {
  const { processA2uiParts } = useA2uiProcessor();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Select state from chat store
  const contextId = useChatStore((state) => state.contextId);
  const partResolvers = useChatStore((state) => state.partResolvers);
  const isA2aStreamOpen = useChatStore((state) => state.isA2aStreamOpen);

  // Select actions from chat store
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const addPendingAgentMessage = useChatStore((state) => state.addPendingAgentMessage);
  const updateLastMessage = useChatStore((state) => state.updateLastMessage);
  const setContextId = useChatStore((state) => state.setContextId);
  const setStreamOpen = useChatStore((state) => state.setStreamOpen);

  /**
   * Sends a message to the A2A agent.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const now = new Date().toISOString();

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Add messages optimistically
      addUserMessage(text, now);
      addPendingAgentMessage(now);
      setStreamOpen(true);

      try {
        // Use existing a2aService instead of inline fetch
        const response = await a2aService.sendMessage(
          [{ kind: 'text', text }],
          {
            contextId,
            supportedCatalogIds: catalogService.catalogUris,
          },
          abortControllerRef.current.signal
        );

        const agentResponseParts = extractA2aPartsFromResponse(response);

        // Process A2UI parts
        processA2uiParts(agentResponseParts);

        // Convert to UI message contents
        const newContents = agentResponseParts.map((part) =>
          convertPartToUiMessageContent(part, partResolvers)
        );

        // Extract subagent info if available
        const subagentCard = response.result?.metadata?.['a2a_subagent'] as AgentCard | undefined;

        // Update context ID if provided
        const newContextId = (response as { context_id?: string }).context_id;
        if (newContextId) {
          setContextId(newContextId);
        }

        // Update last message with response
        updateLastMessage(newContents, 'completed', subagentCard);
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.name === 'AbortError'
            ? 'You cancelled the response.'
            : `Something went wrong: ${error}`;

        const errorContent: UiMessageContent = {
          type: 'ui_message_content',
          id: uuid(),
          data: { kind: 'text', text: errorMessage } as Part,
          variant: 'default_text_part',
        };

        updateLastMessage([errorContent], 'completed');
      } finally {
        setStreamOpen(false);
        abortControllerRef.current = null;
      }
    },
    [
      contextId,
      partResolvers,
      processA2uiParts,
      addUserMessage,
      addPendingAgentMessage,
      updateLastMessage,
      setContextId,
      setStreamOpen,
    ]
  );

  /**
   * Cancels the ongoing stream/request.
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    sendMessage,
    cancelStream,
    isStreaming: isA2aStreamOpen,
  };
}
