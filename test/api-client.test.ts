import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, setAccountRestrictionHandler } from '../src/api/client';

const expectedApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

describe('API error messages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccountRestrictionHandler(null);
  });

  it('keeps the backend rate-limit message for the login screen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'RATE_LIMITED',
            message: 'Too many requests. Try again in 10 minutes.',
          }),
          { status: 429 },
        ),
      ),
    );

    await expect(api.login('user@example.com', 'WrongPassword1!')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Try again in 10 minutes.',
      status: 429,
    });
  });

  it('replaces non-JSON server responses with a readable API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>Gateway error</body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    await expect(api.login('user@example.com', 'Password1!')).rejects.toMatchObject({
      code: 'REQUEST_FAILED',
      message: 'The Ruffl API returned an unexpected response. Please try again.',
      status: 502,
    });
  });

  it('replaces fetch failures with a readable network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(api.login('user@example.com', 'Password1!')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the Ruffl API. Check your connection and try again.',
      status: 0,
    });
  });

  it('notifies the session layer when an active token becomes suspended', async () => {
    const restrictionHandler = vi.fn();
    setAccountRestrictionHandler(restrictionHandler);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'ACCOUNT_SUSPENDED',
            message: 'Account suspended until 27 July 2026.',
          }),
          { status: 403 },
        ),
      ),
    );

    await expect(api.me('existing-token')).rejects.toMatchObject({
      code: 'ACCOUNT_SUSPENDED',
      status: 403,
    });
    expect(restrictionHandler).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ACCOUNT_SUSPENDED' }),
    );
  });

  it('notifies the session layer when a bearer session has expired', async () => {
    const sessionHandler = vi.fn();
    setAccountRestrictionHandler(sessionHandler);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'UNAUTHENTICATED',
            message: 'Your session has expired. Sign in again.',
          }),
          { status: 401 },
        ),
      ),
    );

    await expect(api.me('expired-token')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
    expect(sessionHandler).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'UNAUTHENTICATED' }),
    );
  });

  it('sends uploaded attachment metadata with a message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            id: 'message-one',
            conversationId: 'conversation-one',
            senderId: 'user-one',
            text: '',
            attachments: [
              {
                url: 'https://media.example.test/uploads/user-one/image.png',
                name: 'image.png',
                contentType: 'image/png',
              },
            ],
            createdAt: '2026-07-29T12:00:00.000Z',
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const attachments = [
      {
        url: 'https://media.example.test/uploads/user-one/image.png',
        name: 'image.png',
        contentType: 'image/png',
      },
    ];

    await api.sendMessage(
      'session-token',
      'conversation-one',
      '',
      attachments,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${expectedApiUrl}/conversations/conversation-one/messages`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: '', attachments }),
      }),
    );
  });

  it('sends an authenticated account-deletion request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ deleted: true }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.deleteMe('session-token');

    expect(fetchMock).toHaveBeenCalledWith(
      `${expectedApiUrl}/me`,
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({}),
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
        }),
      }),
    );
  });
});
