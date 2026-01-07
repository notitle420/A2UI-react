import type { Artifact, Message, Part, SendMessageSuccessResponse, Task } from '@a2a-js/sdk';

const ADK_A2A_THOUGHT_KEY = 'adk_thought';

/**
 * Returns true if the part is a thought.
 */
export function isAgentThought(part: Part): boolean {
  return part.metadata?.[ADK_A2A_THOUGHT_KEY] === 'true';
}

/**
 * Extracts all A2A Parts from a SendMessageSuccessResponse.
 * If the response contains a Task, it flattens the parts from the task status message and any artifacts.
 * If the response contains a Message, it returns the parts from the message.
 */
export function extractA2aPartsFromResponse(response: SendMessageSuccessResponse): Part[] {
  if (response.result.kind === 'task') {
    const task: Task = response.result;
    return [
      ...(task.status.message?.parts ?? []),
      ...(task.artifacts ?? []).flatMap((artifact: Artifact) => artifact.parts),
    ];
  } else {
    const message: Message = response.result;
    return message.parts;
  }
}
