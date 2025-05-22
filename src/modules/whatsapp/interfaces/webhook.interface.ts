export interface WhatsappWebhookDto {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: Contact[];
    messages?: Message[];
    statuses?: MessageStatus[];
  };
  field: string;
}

export interface Contact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface Message {
  from: string;
  id: string;
  timestamp: string;
  type: MessageType;
  text?: {
    body: string;
  };
  image?: {
    mime_type: string;
    sha256: string;
    id: string;
    caption?: string;
  };
  document?: {
    filename: string;
    mime_type: string;
    sha256: string;
    id: string;
    caption?: string;
  };
  audio?: {
    mime_type: string;
    sha256: string;
    id: string;
    voice: boolean;
  };
  video?: {
    mime_type: string;
    sha256: string;
    id: string;
    caption?: string;
  };
  context?: {
    from: string;
    id: string;
  };
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    pricing_model: string;
    billable: boolean;
    category: string;
  };
}

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contacts'; 