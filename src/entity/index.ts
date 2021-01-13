import { dayjs, Dayjs } from '../lib';

export interface Event {
  id: string;
  type: 'date' | 'dateTime';
  googleEventId?: string;
  title: string;
  startedAt: Dayjs;
  endedAt: Dayjs;
}

export const isUnique = (lhs: Event, rhs: Event): boolean => {
  return (
    lhs.type === rhs.type &&
    lhs.id === rhs.id &&
    lhs.startedAt.valueOf() === rhs.startedAt.valueOf() &&
    lhs.endedAt.valueOf() === rhs.endedAt.valueOf()
  );
};

export const minMaxDateFrom = (events: Event[]): { timeMin: Dayjs; timeMax: Dayjs } => {
  const days = events.map((e) => [e.startedAt, e.endedAt]).reduce((array, value) => array.concat(value));

  return {
    timeMin: dayjs.min(days),
    timeMax: dayjs.max(days),
  };
};