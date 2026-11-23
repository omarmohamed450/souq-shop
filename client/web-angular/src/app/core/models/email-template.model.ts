export interface EmailTemplate {
  _id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateList {
  templates: EmailTemplate[];
  placeholders: string[];
}

export interface EmailTemplatePayload {
  key: string;
  name: string;
  subject: string;
  body: string;
  description: string;
}

export interface SendManagerEmailPayload {
  to: string;
  templateId?: string;
  orderId?: string;
  subject?: string;
  body?: string;
}

export interface SendManagerEmailResult {
  mode: 'smtp' | 'development' | 'test';
  messageId: string;
  accepted: string[];
  rejected: string[];
}
