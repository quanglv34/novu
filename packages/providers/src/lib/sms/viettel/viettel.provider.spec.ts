import { expect, test } from 'vitest';
import { axiosSpy } from '../../../utils/test/spy-axios';
import { ViettelSmsProvider } from './viettel.provider';

const baseUrl = 'https://apismsbrandname.viettelai.vn:8000';
const providerOptions = {
  username: 'SBR_00000_00000',
  password: 'my-password',
  brandname: 'MY_BRAND',
  baseUrl,
};

const buildResponse = (requestId: string) => ({
  data: {
    error: 0,
    message: 'Success',
    request_id: requestId,
  },
});

test('should trigger viettel library correctly', async () => {
  const requestId = 'req-123';
  const { mockPost, axiosMockSpy } = axiosSpy(buildResponse(requestId));

  const provider = new ViettelSmsProvider(providerOptions);

  const res = await provider.sendMessage({
    to: '+84383425888',
    from: 'MY_BRAND',
    content: 'Hello from Viettel',
  });

  expect(axiosMockSpy).toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledWith(
    `${baseUrl}/mt/send`,
    expect.objectContaining({
      username: providerOptions.username,
      password: providerOptions.password,
      from: 'MY_BRAND',
      to: '+84383425888',
      message: 'Hello from Viettel',
      type: '0',
    })
  );

  expect(res.id).toBe(requestId);
});

test('should fall back to the configured brandname when no "from" is provided', async () => {
  const { mockPost } = axiosSpy(buildResponse('req-456'));

  const provider = new ViettelSmsProvider(providerOptions);

  await provider.sendMessage({
    to: '+84383425888',
    content: 'Hello',
  });

  expect(mockPost).toHaveBeenCalledWith(
    `${baseUrl}/mt/send`,
    expect.objectContaining({ from: providerOptions.brandname })
  );
});

test('should throw on an error response', async () => {
  axiosSpy({ data: { error: 1, message: 'Invalid credentials' } });

  const provider = new ViettelSmsProvider(providerOptions);

  await expect(
    provider.sendMessage({ to: '+84383425888', content: 'Hello' })
  ).rejects.toThrow('Viettel SMS Error: Invalid credentials (code: 1)');
});
