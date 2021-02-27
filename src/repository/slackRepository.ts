import { IncomingWebhook } from '@slack/webhook';
import { SLACK_WEBHOOK_URL } from '../config';
import { ISlackRepository } from '../usecase/cybozu2gcal';

const webhook = new IncomingWebhook(SLACK_WEBHOOK_URL);

export const SlackRepository = (): ISlackRepository => {
  return {
    notify: async ({ status, message: text }) => {
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
    },
  };
};
