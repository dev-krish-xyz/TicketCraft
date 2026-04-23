export interface SentryWebhookPayload {
  action: string;
  data: {
    issue: {
      id: string;
      title: string;
      culprit?: string;
      metadata?: {
        type?: string;
        value?: string;
        filename?: string;
      };
      platform?: string;
      level?: string;
    };
  };
}

export function parseSentryPayload(payload: SentryWebhookPayload) {
  const issue = payload.data.issue;
  const metadata = issue.metadata ?? {};

  const title = issue.title || `${metadata.type}: ${metadata.value}`;
  const content = [
    title,
    issue.culprit && `in ${issue.culprit}`,
    metadata.filename && `file: ${metadata.filename}`,
    issue.platform && `platform: ${issue.platform}`,
    issue.level && `level: ${issue.level}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { title, content, rawPayload: payload as unknown as Record<string, unknown> };
}
