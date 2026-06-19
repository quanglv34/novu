import { ZaloOneSmsChatProvider } from '@novu/providers';
import { ChannelTypeEnum, ChatProviderIdEnum, ICredentials } from '@novu/shared';
import { BaseChatHandler } from './base.handler';

export class ZaloOneSmsHandler extends BaseChatHandler {
  constructor() {
    super(ChatProviderIdEnum.ZaloOneSms, ChannelTypeEnum.CHAT);
  }

  buildProvider(credentials: ICredentials) {
    this.provider = new ZaloOneSmsChatProvider({
      username: credentials.user,
      password: credentials.password,
      brandname: credentials.senderName,
    });
  }
}
