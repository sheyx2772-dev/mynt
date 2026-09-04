// The shape of a notification, and of anything that can deliver one.
//
// Kept apart from both the database and the channels so neither depends on the
// other: a channel knows how to send, the store knows how to record, and adding
// push when the phone app ships means writing one more Channel and nothing else.

export type NotificationKind =
  | "lead"
  | "plan_expiring"
  | "plan_expired"
  | "transfer"
  | "venue_request"
  | "device_order"
  | "tag_message";

export type Notice = {
  userId: string;
  kind: NotificationKind;
  /** The number it concerns, when it concerns one. */
  handle?: string | null;
  title: string;
  body?: string | null;
  /** Where it points inside the site. Always a path, never an address. */
  href?: string | null;
};

/**
 * Somewhere a notice can be delivered.
 *
 * `send` returns whether it went. It must not throw: a channel that is down has
 * to leave the recorded notice alone rather than losing the event with it, and
 * whoever triggers a notification is always in the middle of doing something
 * more important than notifying.
 */
export type Channel = {
  name: string;
  send(notice: Notice, target: ChannelTarget): Promise<boolean>;
};

export type ChannelTarget = {
  telegramChatId: number | null;
  email: string | null;
};
