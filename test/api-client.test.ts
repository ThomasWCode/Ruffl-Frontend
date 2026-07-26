import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, setAccountRestrictionHandler } from '../src/api/client';

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
});
