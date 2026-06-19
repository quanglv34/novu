import { ViettelSmsProvider } from '@novu/providers';
import { ChannelTypeEnum, ICredentials, SmsProviderIdEnum } from '@novu/shared';
import { BaseSmsHandler } from './base.handler';

export class ViettelHandler extends BaseSmsHandler {
  constructor() {
    super(SmsProviderIdEnum.Viettel, ChannelTypeEnum.SMS);
  }

  buildProvider(credentials: ICredentials) {
    this.provider = new ViettelSmsProvider({
      baseUrl: credentials.baseUrl,
      username: credentials.user,
      password: credentials.password,
      brandname: credentials.from,
    });
  }
}
