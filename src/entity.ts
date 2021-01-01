import 'source-map-support/register';

interface BuildDateTimeParam {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

export const buildDateTime = ({ year, month, day, ...rest }: BuildDateTimeParam): string => {
  const pad = (num: string) => ('00' + num).slice(-2);

  // 24:00 を 23:59 に読み替え
  const hour = rest.hour === '24' ? '23' : rest.hour;
  const minute = rest.hour === '24' ? '59' : rest.minute;

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`; // Asia/Tokyo
};

export interface Event {
  id: string;
  googleEventId?: string;
  title: string;
  startedAt: string;
  endedAt: string;
}

export const isUnique = (lhs: Event, rhs: Event): boolean => {
  return lhs.id === rhs.id && lhs.startedAt === rhs.startedAt && lhs.endedAt === rhs.endedAt;
};

export const minMaxDateFrom = (events: Event[]): { timeMin: Date; timeMax: Date } => {
  const unixTimes = events
    .map((e) => [e.startedAt, e.endedAt])
    .reduce((array, value) => array.concat(value))
    .map((d) => new Date(d).getTime());

  return {
    timeMin: new Date(Math.min(...unixTimes)),
    timeMax: new Date(Math.max(...unixTimes)),
  };
};
