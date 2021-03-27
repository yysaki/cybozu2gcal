import dayjs from 'dayjs';
import utc from 'dayjs/plugin/timezone';
import timezone from 'dayjs/plugin/utc';

const TIMEZONE = 'Asia/Tokyo';

dayjs.extend(utc);
dayjs.extend(timezone);

type Dayjs = dayjs.Dayjs;

const isISOString = (timestamp: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/.test(timestamp);

export class DateTime {
  #dateTime: Dayjs;

  constructor(timestamp: string) {
    this.#dateTime = isISOString(timestamp) ? dayjs(timestamp).tz(TIMEZONE) : dayjs.tz(timestamp, TIMEZONE);
  }

  add1Day = (): DateTime => new DateTime(this.#dateTime.add(1, 'day').format());
  format = (template?: string | undefined): string => this.#dateTime.format(template);
  toJSON = (): string => this.format();
  unix = (): number => this.#dateTime.unix();
}
