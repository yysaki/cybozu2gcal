import { DateTime } from './dateTime';

export interface Event {
  id: string;
  type: 'date' | 'dateTime';
  googleEventId?: string;
  title: string;
  startedAt: DateTime;
  endedAt: DateTime;
}

export const equals = (lhs: Event, rhs: Event): boolean => {
  return (
    lhs.id === rhs.id &&
    lhs.type === rhs.type &&
    lhs.title === rhs.title &&
    lhs.startedAt.format() === rhs.startedAt.format() &&
    lhs.endedAt.format() === rhs.endedAt.format()
  );
};

export const minMaxDateFrom = (events: Event[]): { timeMin: DateTime; timeMax: DateTime } => {
  const dateTimes = events.map((e) => [e.startedAt, e.endedAt]).reduce((array, value) => array.concat(value));

  const timeMin = dateTimes.sort((a, b) => a.unix() - b.unix())[0];
  const timeMax = dateTimes.sort((a, b) => b.unix() - a.unix())[0];

  return { timeMin, timeMax };
};
