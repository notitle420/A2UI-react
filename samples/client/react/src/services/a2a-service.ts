import type { AgentCard, Part, SendMessageSuccessResponse } from '@a2a-js/sdk';

export interface A2aServiceConfig {
  baseUrl?: string;
  contextId?: string;
  supportedCatalogIds?: string[];
}

/**
 * Service for communicating with the A2A agent via the proxy server.
 */
export const a2aService = {
  /**
   * Sends a message to the A2A agent.
   */
  async sendMessage(
    parts: Part[],
    config: A2aServiceConfig = {},
    signal?: AbortSignal
  ): Promise<SendMessageSuccessResponse> {
    const { baseUrl = '', contextId, supportedCatalogIds } = config;

    const response = await fetch(`${baseUrl}/a2a`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts,
        context_id: contextId,
        metadata: supportedCatalogIds
          ? {
              a2uiClientCapabilities: {
                supportedCatalogIds,
              },
            }
          : undefined,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Fetches the agent card information.
   */
  async getAgentCard(baseUrl = ''): Promise<AgentCard> {
    const response = await fetch(`${baseUrl}/a2a/agent-card`);

    if (!response.ok) {
      throw new Error(`Failed to fetch agent card: ${response.status}`);
    }

    return response.json();
  },
};
