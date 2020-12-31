import 'source-map-support/register';

interface BuildDateTimeParam {
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string
}

export const buildDateTime = ({ year, month, day, ...rest }: BuildDateTimeParam) => {
  const pad = (num: string) => ('00' + num).slice(-2);

  // 24:00 を 23:59 に読み替え
  const hour = rest.hour === '24' ? '23' : rest.hour;
  const minute = rest.hour === '24' ? '59' : rest.minute;

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`; // Asia/Tokyo
}

export interface Event {
  title: string;
  eid: string;
  googleId?: string;
  startedAt: string;
  endedAt: string;
};

export const isUnique = (lhs: Event, rhs: Event) => {
  return lhs.eid === rhs.eid && lhs.startedAt === rhs.startedAt && lhs.endedAt === rhs.endedAt;
};
