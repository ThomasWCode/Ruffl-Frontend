import type {
  Commission,
  CommissionDetail,
  Conversation,
  MakerResult,
  MediaAttachment,
  Message,
  Notification,
  User,
} from '../types';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!configuredApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error('EXPO_PUBLIC_API_URL is required in production builds.');
}
const apiUrl = (configuredApiUrl ?? 'http://localhost:3000').replace(/\/$/, '');
let accountRestrictionHandler: ((error: ApiError) => void) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface VerificationRequired {
  requiresEmailVerification: true;
  message: string;
  developmentVerificationUrl?: string;
}

export interface AuthenticationResult {
  token: string;
  user: User;
}

export interface UploadSlot {
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
  method: 'PUT';
  headers: Record<string, string>;
}

export function setAccountRestrictionHandler(
  handler: ((error: ApiError) => void) | null,
): void {
  accountRestrictionHandler = handler;
}

function parseJson<T>(text: string): (T & { message?: string; code?: string }) | null {
  try {
    return JSON.parse(text) as T & { message?: string; code?: string };
  } catch {
    return null;
  }
}

// Centralizes auth and error parsing so screens only handle product states.
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      'Could not reach the Ruffl API. Check your connection and try again.',
      'NETWORK_ERROR',
      0,
    );
  }

  const payload = parseJson<T>(await response.text());
  if (!response.ok) {
    const error = new ApiError(
      payload?.message ?? 'The Ruffl API returned an unexpected response. Please try again.',
      payload?.code ?? 'REQUEST_FAILED',
      response.status,
    );
    if (
      token &&
      (response.status === 401 ||
        ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(error.code))
    ) {
      accountRestrictionHandler?.(error);
    }
    throw error;
  }
  if (!payload) {
    throw new ApiError(
      'The Ruffl API returned an unexpected response. Please try again.',
      'INVALID_RESPONSE',
      response.status,
    );
  }
  return payload;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthenticationResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (input: {
    email: string;
    password: string;
    displayName: string;
    role: 'commissioner' | 'maker';
  }) =>
    request<AuthenticationResult | VerificationRequired>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  resendVerification: (email: string) =>
    request<{ message: string; developmentVerificationUrl?: string }>(
      '/auth/resend-verification',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    ),
  forgotPassword: (email: string) =>
    request<{ message: string; developmentResetUrl?: string }>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    ),
  me: (token: string) =>
    request<{ user: User; makerProfile: unknown; warnings: { id: string; message: string }[] }>(
      '/me',
      {},
      token,
    ),
  updateMe: (
    token: string,
    input: { displayName?: string; bio?: string; avatarUrl?: string; pushToken?: string },
  ) =>
    request<{ user: User }>(
      '/me',
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
    ),
  deleteMe: (token: string) =>
    request<{ deleted: true }>(
      '/me',
      { method: 'DELETE', body: JSON.stringify({}) },
      token,
    ),
  makers: (token: string, search = '', openOnly = false) =>
    request<MakerResult[]>(
      `/makers?search=${encodeURIComponent(search)}&openOnly=${openOnly}`,
      {},
      token,
    ),
  maker: (token: string, makerId: string) =>
    request<MakerResult>(`/makers/${makerId}`, {}, token),
  joinWaitlist: (token: string, makerId: string, message: string) =>
    request(`/makers/${makerId}/waitlist`, { method: 'POST', body: JSON.stringify({ message }) }, token),
  commissions: (token: string) =>
    request<{ commissions: Commission[] }>('/commissions', {}, token),
  commission: (token: string, id: string) =>
    request<CommissionDetail>(`/commissions/${id}`, {}, token),
  createCommission: (
    token: string,
    input: {
      makerId: string;
      title: string;
      suitType: Commission['suitType'];
      species: string;
      description: string;
      referenceNotes: string;
      budget: number;
    },
  ) =>
    request<{ commission: Commission }>(
      '/commissions',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  commissionAction: <T>(
    token: string,
    commissionId: string,
    action: string,
    body: Record<string, unknown> = {},
  ) =>
    request<T>(
      `/commissions/${commissionId}/${action}`,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),
  milestoneAction: <T>(
    token: string,
    commissionId: string,
    milestoneId: string,
    action: 'updates' | 'approve',
    body: Record<string, unknown> = {},
  ) =>
    request<T>(
      `/commissions/${commissionId}/milestones/${milestoneId}/${action}`,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    ),
  conversations: (token: string) =>
    request<{ conversations: Conversation[] }>('/conversations', {}, token),
  directConversation: (token: string, participantId: string) =>
    request<{ conversation: Conversation }>(
      '/conversations/direct',
      { method: 'POST', body: JSON.stringify({ participantId }) },
      token,
    ),
  supportConversation: (token: string) =>
    request<{ conversation: Conversation }>(
      '/support/conversation',
      { method: 'POST', body: JSON.stringify({}) },
      token,
    ),
  messages: (token: string, conversationId: string) =>
    request<{ messages: Message[] }>(`/conversations/${conversationId}/messages`, {}, token),
  sendMessage: (
    token: string,
    conversationId: string,
    text: string,
    attachments: MediaAttachment[] = [],
  ) =>
    request<{ message: Message }>(
      `/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify({ text, attachments }) },
      token,
    ),
  uploadSlot: (
    token: string,
    input: {
      fileName: string;
      contentType: string;
      size: number;
      category: 'image' | 'video' | 'document' | 'avatar' | 'banner';
    },
  ) =>
    request<{ slot: UploadSlot }>(
      '/uploads/slot',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    ),
  notifications: (token: string) =>
    request<{ notifications: Notification[] }>('/notifications', {}, token),
  readNotification: (token: string, notificationId: string) =>
    request<{ notification: Notification }>(
      `/notifications/${notificationId}/read`,
      { method: 'POST', body: JSON.stringify({}) },
      token,
    ),
  readWarning: (token: string, warningId: string) =>
    request<{ warning: { id: string; message: string; read: boolean } }>(
      `/warnings/${warningId}/read`,
      { method: 'POST', body: JSON.stringify({}) },
      token,
    ),
};
