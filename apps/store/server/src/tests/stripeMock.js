import { vi } from 'vitest';

let counter = 0;

export const VALID_SIGNATURE = 'valid-signature';

export const stripeMock = {
  paymentIntents: {
    create: vi.fn(async ({ amount }) => {
      counter += 1;
      return { id: `pi_test_${counter}`, client_secret: `pi_test_${counter}_secret_abc`, amount };
    }),
  },
  refunds: { create: vi.fn(async () => ({ id: 're_test_1' })) },
  webhooks: {
    constructEvent: vi.fn((payload, signature) => {
      if (signature !== VALID_SIGNATURE) throw new Error('Invalid signature');
      return JSON.parse(payload.toString('utf8'));
    }),
  },
};
