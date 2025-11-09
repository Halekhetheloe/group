const { hashPassword, comparePassword } = require('../../../server/utils/authUtils');

describe('Auth Utils - Unit Tests', () => {
  test('hashPassword returns a hashed string', async () => {
    const password = 'mypassword123';
    const hash = await hashPassword(password);
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(password);
  });

  test('comparePassword returns true for correct password', async () => {
    const password = 'mypassword123';
    const hash = await hashPassword(password);
    const result = await comparePassword(password, hash);
    expect(result).toBe(true);
  });
});