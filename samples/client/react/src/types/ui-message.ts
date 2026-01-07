import type { Artifact, Part } from '@a2a-js/sdk';

/**
 * Represents a single message in the UI, either from the user or the agent.
 */
export interface UiMessage {
  readonly type: 'ui_message';
  readonly id: string;
  readonly contextId: string;
  readonly role: Role;
  readonly contents: UiMessageContent[];
  readonly status: UiMessageStatus;
  readonly created: string;
  readonly lastUpdated: string;
}

/**
 * Represents the sender of a message, either an agent or a user.
 */
export type Role = UiAgent | UiUser;

/**
 * Represents an agent sender.
 */
export interface UiAgent {
  readonly type: 'ui_agent';
  readonly name: string;
  readonly iconUrl: string;
  readonly subagentName?: string;
  readonly subagentIconUrl?: string;
}

/**
 * Represents a user sender.
 */
export interface UiUser {
  readonly type: 'ui_user';
}

/**
 * Represents a single piece of content within a UiMessage.
 */
export interface UiMessageContent {
  readonly type: 'ui_message_content';
  readonly id: string;
  readonly data: Part | Artifact;
  readonly variant: string;
}

/**
 * Possible statuses for a UiMessage.
 */
export type UiMessageStatus = 'completed' | 'pending' | 'cancelled';
