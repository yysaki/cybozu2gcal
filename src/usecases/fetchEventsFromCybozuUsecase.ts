import 'source-map-support/register';

import { Event } from '../entity';
import { tz } from '../lib';

export interface EvaluateResult {
  title: string;
  href: string;
  eventTime?: string;
}

export type EvaluateCybozuPage = () => Promise<EvaluateResult[]>;

const buildDateTime = ({ date, ...rest }: { date: string; hour: string; minute: string }) => {
  // 24:00 を 23:59 に読み替え
  const hour = rest.hour === '24' ? '23' : rest.hour;
  const minute = rest.hour === '24' ? '59' : rest.minute;

  return tz(`${date} ${hour}:${minute}`);
};

const parse = ({ title, href, eventTime }: EvaluateResult): Event | undefined => {
  const regexp = /\Date=da\.([0-9]+)\.([0-9]+)\.([0-9]+)&BDate=da\.([0-9]+)\.([0-9]+)\.([0-9]+)&sEID=([0-9]+)/;
  const match = href.match(regexp);
  if (!match) return;

  const id = match[7];
  const date = `${match[1]}-${match[2]}-${match[3]}`;

  if (eventTime) {
    const timeSpanMatch = eventTime.match(/([0-9]+):([0-9]+)-([0-9]+):([0-9]+)/);
    const timeMatch = eventTime.match(/([0-9]+):([0-9]+)/);
    const type: Event['type'] = 'dateTime';

    if (timeSpanMatch) {
      const startedAt = buildDateTime({ date, hour: timeSpanMatch[1], minute: timeSpanMatch[2] });
      const endedAt = buildDateTime({ date, hour: timeSpanMatch[3], minute: timeSpanMatch[4] });

      return { id, type, title, startedAt, endedAt };
    } else if (timeMatch) {
      const dateTime = buildDateTime({ date, hour: timeMatch[1], minute: timeMatch[2] });

      return { id, type, title, startedAt: dateTime, endedAt: dateTime };
    }
  }

  const type: Event['type'] = 'date';
  const startedAt = tz(date);
  const endedAt = startedAt.add(1, 'day');

  return { id, type, title, startedAt, endedAt };
};

export const fetchEventsFromCybozuUsecase = (evaluate: EvaluateCybozuPage) => {
  return async (): Promise<Event[]> => {
    const evaluated = await evaluate();

    return evaluated.map(parse).filter<Event>((e): e is Event => !!e);
  };
};
