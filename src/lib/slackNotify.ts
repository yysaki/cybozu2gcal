import { IncomingWebhook } from '@slack/webhook';
import { SLACK_WEBHOOK_URL } from '../config';

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

interface NotifyParams {
  status: 'good' | 'warning';
  message: string;
}

export const slackNotify = async ({ status, message: text }: NotifyParams): Promise<void> => {
  const title = status === 'good' ? 'カレンダー連携に成功しました' : 'カレンダー連携に失敗しました';
  const attachments = [
    {
      fallback: title,
      title,
      color: status,
      text,
    },
  ];

  await webhook.send({ attachments });
};
