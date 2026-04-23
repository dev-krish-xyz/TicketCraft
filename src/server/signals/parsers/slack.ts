export interface SlackEventPayload {
  type: string;
  event: {
    type: string;
    text: string;
    user?: string;
    channel?: string;
    ts?: string;
  };
  challenge?: string;
}

export function parseSlackPayload(payload: SlackEventPayload) {
  const event = payload.event;
  const title =
    event.text.length > 100
      ? event.text.substring(0, 97) + "..."
      : event.text;

  return {
    title,
    content: event.text,
    rawPayload: payload as unknown as Record<string, unknown>,
  };
}
