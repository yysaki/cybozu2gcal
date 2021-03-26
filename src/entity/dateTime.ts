import dayjs from 'dayjs';
import utc from 'dayjs/plugin/timezone';
import timezone from 'dayjs/plugin/utc';

const TIMEZONE = 'Asia/Tokyo';

dayjs.extend(utc);
dayjs.extend(timezone);

type Dayjs = dayjs.Dayjs;

export class DateTime {
  #dateTime: Dayjs;

  constructor(date: dayjs.ConfigType) {
    this.#dateTime = dayjs(date).tz(TIMEZONE);
  }

  add1Day = (): DateTime => new DateTime(this.#dateTime.add(1, 'day'));
  format = (template?: string | undefined): string => this.#dateTime.format(template);
  toJSON = (): string => this.format();
  unix = (): number => this.#dateTime.unix();
}
