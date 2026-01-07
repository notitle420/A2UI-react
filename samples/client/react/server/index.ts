import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { A2AClient } from '@a2a-js/sdk/client';
import type { MessageSendParams, Part, SendMessageResponse } from '@a2a-js/sdk';

const app = express();
const PORT = process.env.PORT || 3001;
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:10002';

let client: A2AClient | null = null;

// Middleware
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[a2a-proxy] ${req.method} ${req.url}`);
  next();
});

// CORS for development
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Custom fetch with A2UI extension header
async function fetchWithCustomHeader(url: string | URL | globalThis.Request, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set('X-A2A-Extensions', 'https://a2ui.org/a2a-extension/a2ui/v0.8');
  const newInit = { ...init, headers };
  return fetch(url, newInit);
}

// Create or get A2A client
async function createOrGetClient(): Promise<A2AClient> {
  if (!client) {
    client = await A2AClient.fromCardUrl(`${AGENT_URL}/.well-known/agent-card.json`, {
      fetchImpl: fetchWithCustomHeader,
    });
  }
  return client;
}

// A2A message endpoint
app.post('/a2a', async (req: Request, res: Response) => {
  try {
    const { parts, metadata, context_id } = req.body as {
      parts: Part[];
      metadata?: Record<string, unknown>;
      context_id?: string;
    };

    console.log('[a2a-proxy] Received message:', JSON.stringify({ parts, context_id }));

    const sendParams: MessageSendParams = {
      message: {
        messageId: uuidv4(),
        contextId: context_id,
        role: 'user',
        parts,
        kind: 'message',
        metadata,
      },
    };

    console.log('[a2a-proxy] Sending to agent:', JSON.stringify(sendParams, null, 2));
    const a2aClient = await createOrGetClient();
    const response: SendMessageResponse = await a2aClient.sendMessage(sendParams);
    console.log('[a2a-proxy] Response from agent:', JSON.stringify(response, null, 2));

    res.set('Cache-Control', 'no-store');

    if ('error' in response) {
      console.error('[a2a-proxy] Error:', response.error);
      res.status(500).json({ error: response.error.message });
      return;
    }

    // Include context_id in response if available
    const result = response.result;
    const responseContextId = result.contextId;

    res.json({
      ...response,
      context_id: responseContextId,
    });
  } catch (error) {
    console.error('[a2a-proxy] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Agent card endpoint
app.get('/a2a/agent-card', async (_req: Request, res: Response) => {
  try {
    const response = await fetchWithCustomHeader(`${AGENT_URL}/.well-known/agent-card.json`);

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch agent card' });
      return;
    }

    const card = await response.json();
    res.json(card);
  } catch (error) {
    console.error('[a2a-proxy] Error fetching agent card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[a2a-proxy] Server running on http://localhost:${PORT}`);
  console.log(`[a2a-proxy] Proxying to agent at ${AGENT_URL}`);
});
