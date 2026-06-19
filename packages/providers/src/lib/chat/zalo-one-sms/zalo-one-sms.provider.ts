import {
  ChannelTypeEnum,
  ISendMessageSuccessResponse,
  IChatOptions,
  IChatProvider,
  isChannelDataOfType,
} from "@novu/stateless";
import { BaseProvider, CasingEnum } from "../../../base.provider";
import { WithPassthrough } from "../../../utils/types";
import axios, { AxiosInstance } from 'axios';
import { ENDPOINT_TYPES } from "@novu/shared";

export class ZaloOneSmsChatProvider
  extends BaseProvider
  implements IChatProvider
{
  id = "zalo-one-sms";
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  protected casing: CasingEnum = CasingEnum.SNAKE_CASE;

  private readonly axiosClient: AxiosInstance;
  private readonly baseUrl = 'https://zaloapi.conek.vn';

constructor(
    private config: {
      username: string;
      password: string;
      brandname: string;
      from?: string; // Optional fallback SMS sender
    }
  ) {
    super();
    this.axiosClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(
    options: IChatOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {},
  ): Promise<ISendMessageSuccessResponse> {
    const templateId = options.customData?.templateId as string | undefined;
    const templateData = options.customData?.templateData as Record<string, string | number | boolean> | undefined;
    if (!isChannelDataOfType(options.channelData, ENDPOINT_TYPES.PHONE)) {
      throw new Error('Invalid channel data for ZaloOneSms provider');
    }
    
    const { phoneNumber } = options.channelData.endpoint;

    if (!templateId) {
      throw new Error('Template ID is required. Provide it via customData.templateId');
    }

    if (!phoneNumber) {
      throw new Error('Phone number is required in the "to" field');
    }

    const payload = this.transform<any>(bridgeProviderData, {
      id: options.customData?.requestId as string | undefined,
      username: this.config.username,
      password: this.config.password,
      brandname: this.config.brandname,
      message_sms: options.customData?.messageSms || options.content,
      phone: phoneNumber,
      template_id: templateId,
      template_data: templateData,
      type_send: (options.customData?.typeSend as number) ?? 2, // Default: ZNS only
      resend_sms: (options.customData?.resendSms as number) ?? 0, // Default: no SMS fallback
      brandname_sms: options.customData?.brandnameSms || this.config.brandname,
      unicode: options.customData?.unicode as number | undefined,
    }).body;

    const { data } = await this.axiosClient.post(`${this.baseUrl}/SendSMSZalo`, payload);

    if (data.code !== '0') {
      throw new Error(`Zalo OneSMS Error: ${data.message} (code: ${data.code})`);
    }

    return {
      id: data.phone || phoneNumber,
      date: new Date().toISOString(),
    };
  }

  /**
   * Get available templates for the account
   */
  async getTemplates(): Promise<any> {
    const payload = {
      username: this.config.username,
      password: this.config.password,
    };

    const { data } = await this.axiosClient.post(`${this.baseUrl}/GetTemplateZalo`, payload);

    if (data.code !== '0') {
      throw new Error(`Failed to get templates: ${data.message}`);
    }

    return data.data;
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(referentId: string): Promise<any> {
    const payload = {
      username: this.config.username,
      password: this.config.password,
      referentid: referentId,
    };

    const { data } = await this.axiosClient.post(`${this.baseUrl}/ReceiveMessageZalo`, payload);

    if (data.errcode !== '0') {
      throw new Error(`Failed to get message status: ${data.message}`);
    }

    return data.status;
  }

}
