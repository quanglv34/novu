import { ENDPOINT_TYPES, IChatOptions } from '@novu/stateless';
import { expect, test } from 'vitest';
import { axiosSpy } from '../../../utils/test/spy-axios';
import { ZaloOneSmsChatProvider } from './zalo-one-sms.provider';

const mockProviderConfig = {
  username: 'my-username',
  password: 'my-password',
  brandname: 'MY_BRAND',
};

const buildResponse = (phone: string) => ({
  data: {
    code: '0',
    message: 'Success',
    phone,
  },
});

test('should trigger zalo-one-sms library correctly', async () => {
  const phoneNumber = '+84383425888';
  const { mockPost, axiosMockSpy } = axiosSpy(buildResponse(phoneNumber));

  const provider = new ZaloOneSmsChatProvider(mockProviderConfig);

  const options: IChatOptions = {
    content: 'Hello from ZNS',
    channelData: {
      identifier: '-',
      type: ENDPOINT_TYPES.PHONE,
      endpoint: { phoneNumber },
    },
    customData: {
      templateId: 'template-123',
      templateData: { name: 'John' },
    },
  };

  const res = await provider.sendMessage(options);

  expect(axiosMockSpy).toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledWith(
    'https://zaloapi.conek.vn/SendSMSZalo',
    expect.objectContaining({
      username: mockProviderConfig.username,
      password: mockProviderConfig.password,
      brandname: mockProviderConfig.brandname,
      phone: phoneNumber,
      template_id: 'template-123',
      template_data: { name: 'John' },
      message_sms: options.content,
      type_send: 2,
      resend_sms: 0,
      brandname_sms: mockProviderConfig.brandname,
    })
  );

  expect(res.id).toBe(phoneNumber);
});

test('should throw when channel data is not a phone endpoint', async () => {
  axiosSpy(buildResponse('+84383425888'));
  const provider = new ZaloOneSmsChatProvider(mockProviderConfig);

  const options: IChatOptions = {
    content: 'Hello',
    channelData: {
      identifier: '-',
      type: ENDPOINT_TYPES.WEBHOOK,
      endpoint: { url: 'https://example.com' },
    },
    customData: { templateId: 'template-123' },
  };

  await expect(provider.sendMessage(options)).rejects.toThrow('Invalid channel data for ZaloOneSms provider');
});

test('should throw when template id is missing', async () => {
  axiosSpy(buildResponse('+84383425888'));
  const provider = new ZaloOneSmsChatProvider(mockProviderConfig);

  const options: IChatOptions = {
    content: 'Hello',
    channelData: {
      identifier: '-',
      type: ENDPOINT_TYPES.PHONE,
      endpoint: { phoneNumber: '+84383425888' },
    },
  };

  await expect(provider.sendMessage(options)).rejects.toThrow('Template ID is required');
});

test('should throw on a non-zero response code', async () => {
  const { mockPost } = axiosSpy({ data: { code: '1', message: 'Invalid template' } });
  void mockPost;
  const provider = new ZaloOneSmsChatProvider(mockProviderConfig);

  const options: IChatOptions = {
    content: 'Hello',
    channelData: {
      identifier: '-',
      type: ENDPOINT_TYPES.PHONE,
      endpoint: { phoneNumber: '+84383425888' },
    },
    customData: { templateId: 'template-123' },
  };

  await expect(provider.sendMessage(options)).rejects.toThrow('Zalo OneSMS Error: Invalid template (code: 1)');
});
