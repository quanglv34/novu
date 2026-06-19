import { ChannelTypeEnum, ISendMessageSuccessResponse, ISmsOptions, ISmsProvider } from '@novu/stateless';
import axios, { AxiosInstance } from 'axios';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';

export class ViettelSmsProvider extends BaseProvider implements ISmsProvider {
  id = 'viettel';
  channelType = ChannelTypeEnum.SMS as ChannelTypeEnum.SMS;
  protected casing: CasingEnum = CasingEnum.SNAKE_CASE;

  private readonly axiosClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(
    private config: {
      username: string;
      password: string;
      brandname: string;
      cpCode?: string; // CP Code for authentication
      serviceId?: string; // Service ID for Viettel
      commandCode?: string; // Command code for specific services
      baseUrl?: string; // Allow custom endpoint
    }
  ) {
    super();
    this.baseUrl = config.baseUrl || 'https://apismsbrandname.viettelai.vn:8000';
    this.axiosClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(
    options: ISmsOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    const phone = options.to;
    const message = options.content;

    if (!phone) {
      throw new Error('Phone number is required');
    }

    if (!message) {
      throw new Error('Message content is required');
    }

    // Viettel SMS API payload structure
    const payload = this.transform<any>(bridgeProviderData, {
      username: this.config.username,
      password: this.config.password,
      from: options.from || this.config.brandname,
      to: phone,
      message: message,
      type: options.customData?.unicode ? '1' : '0', // 1: Unicode, 0: ASCII
      cp_code: this.config.cpCode,
      service_id: this.config.serviceId,
      command_code: this.config.commandCode,
      request_id: options.customData?.requestId as string | undefined,
    }).body;

    const { data } = await this.axiosClient.post(`${this.baseUrl}/mt/send`, payload);

    // Viettel API typically returns: { error: 0, message: "Success", request_id: "..." }
    if (data.error !== 0 && data.error !== '0') {
      throw new Error(`Viettel SMS Error: ${data.message || 'Unknown error'} (code: ${data.error})`);
    }

    return {
      id: data.request_id || data.requestId || phone,
      date: new Date().toISOString(),
    };
  }

  /**
   * Get message delivery status from Viettel API
   */
  async getMessageStatus(requestId: string): Promise<any> {
    const payload = {
      username: this.config.username,
      password: this.config.password,
      request_id: requestId,
    };

    const { data } = await this.axiosClient.post(`${this.baseUrl}/mt/status`, payload);

    if (data.error !== 0 && data.error !== '0') {
      throw new Error(`Failed to get message status: ${data.message || 'Unknown error'}`);
    }

    return {
      status: data.status,
      delivery_status: data.delivery_status,
      message: data.message,
    };
  }
}
