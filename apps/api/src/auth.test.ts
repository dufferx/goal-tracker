import { describe, expect, it } from 'vitest';

import { extractBearerToken } from './auth.js';

describe('extractBearerToken', () => {
  it('accepts one strict Bearer credential', () => {
    expect(
      extractBearerToken({
        headers: { authorization: 'Bearer access-token' },
      } as never),
    ).toBe('access-token');
  });

  it.each([
    'bearer access-token',
    'Basic access-token',
    'Bearer access token',
    'Bearer access-token,another',
  ])('rejects malformed authorization input: %s', (authorization) => {
    expect(extractBearerToken({ headers: { authorization } } as never)).toBeUndefined();
  });
});
