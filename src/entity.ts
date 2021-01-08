import 'source-map-support/register';

import { dayjs, Dayjs, tz } from './lib';

interface BuildDateTimeParam {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

export const buildDateTime = ({ year, month, day, ...rest }: BuildDateTimeParam): Dayjs => {
  // 24:00 を 23:59 に読み替え
  const hour = rest.hour === '24' ? '23' : rest.hour;
  const minute = rest.hour === '24' ? '59' : rest.minute;

  return tz(`${year}-${month}-${day} ${hour}:${minute}`);
};

export interface Event {
  id: string;
  type: 'date' | 'dateTime';
  googleEventId?: string;
  title: string;
  startedAt: Dayjs;
  endedAt: Dayjs;
}

export const isUnique = (lhs: Event, rhs: Event): boolean => {
  return lhs.id === rhs.id && lhs.startedAt === rhs.startedAt && lhs.endedAt === rhs.endedAt;
};

export const minMaxDateFrom = (events: Event[]): { timeMin: Dayjs; timeMax: Dayjs } => {
  const days = events.map((e) => [e.startedAt, e.endedAt]).reduce((array, value) => array.concat(value));

  return {
    timeMin: dayjs.min(days),
    timeMax: dayjs.max(days),
  };
};
