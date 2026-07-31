/**
 * Client-side mirrors of the Quo integration server models. Match
 * models/quo*Model.ts in UNISTACK_NEW_SERVER — keep in sync.
 */

export interface QuoPhoneNumber {
  _id: string;
  quoId: string;
  e164: string;
  label?: string;
  assignedUserId?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoCall {
  _id: string;
  quoCallId: string;
  phoneNumberId: string;
  quoPhoneNumberId: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  participants: string[];
  initiatedBy?: string;
  answeredBy?: string;
  userId?: string;
  createdAt: string;
  answeredAt?: string;
  completedAt?: string;
  duration?: number;
  forwardedFrom?: string;
  forwardedTo?: string;
  aiHandled: boolean;
  hasRecording: boolean;
  hasVoicemail: boolean;
  recordingIds: string[];
  summary?: string;
  transcript?: QuoCallTranscriptSegment[];
  updatedAt: string;
}

export interface QuoCallTranscriptSegment {
  identifier: string;
  content: string;
  start: number;
  end: number;
  userId?: string;
}

export interface QuoMessage {
  _id: string;
  quoMessageId: string;
  phoneNumberId: string;
  quoPhoneNumberId: string;
  conversationId: string;
  direction: 'incoming' | 'outgoing';
  from: string;
  to: string[];
  text: string;
  status: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoVoicemail {
  _id: string;
  quoCallId: string;
  phoneNumberId: string;
  quoPhoneNumberId: string;
  from: string;
  to: string;
  status: 'in-progress' | 'completed';
  transcript?: string;
  durationSec?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rolled-up conversation card — one row per counterparty in the
 * timeline, wrapping the whole SMS thread so we don't render one
 * card per message.
 */
export interface QuoConversationRollup {
  _id: string; // conversationId
  phoneNumberId: string;
  quoPhoneNumberId: string;
  latestAt: string;
  latestText: string;
  latestDirection: 'incoming' | 'outgoing';
  counterparties: string[];
  counterpartiesTo: string[][];
  count: number;
}

/**
 * Union of the three event shapes the unified timeline endpoint
 * returns. Card renderers branch on `kind`.
 */
export type QuoActivityEvent =
  | { kind: 'call'; at: string; data: QuoCall }
  | { kind: 'voicemail'; at: string; data: QuoVoicemail }
  | { kind: 'conversation'; at: string; data: QuoConversationRollup };
