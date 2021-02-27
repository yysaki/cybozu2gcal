import { Event } from '../entity';
import { IWebDriver, EvaluateOutputData } from '../infra';
import { tz } from '../lib';
import { ICybozuRepository } from '../usecase/cybozu2gcal';

export class CybozuRepository implements ICybozuRepository {
  private driver: IWebDriver;

  constructor(webPageDriver: IWebDriver) {
    this.driver = webPageDriver;
  }

  async list(): Promise<Event[]> {
    const evaluated = await this.driver.evaluate();

    return evaluated.map((e) => this.eventFrom(e)).filter<Event>((e): e is Event => !!e);
  }

  private buildDateTime({ date, ...rest }: { date: string; hour: string; minute: string }) {
    // 24:00 を 23:59 に読み替え
    const hour = rest.hour === '24' ? '23' : rest.hour;
    const minute = rest.hour === '24' ? '59' : rest.minute;

    return tz(`${date} ${hour}:${minute}`);
  }

  private eventFrom({ title, href, eventTime }: EvaluateOutputData): Event | undefined {
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
        const startedAt = this.buildDateTime({ date, hour: timeSpanMatch[1], minute: timeSpanMatch[2] });
        const endedAt = this.buildDateTime({ date, hour: timeSpanMatch[3], minute: timeSpanMatch[4] });

        return { id, type, title, startedAt, endedAt };
      } else if (timeMatch) {
        const dateTime = this.buildDateTime({ date, hour: timeMatch[1], minute: timeMatch[2] });

        return { id, type, title, startedAt: dateTime, endedAt: dateTime };
      }
    }

    const type: Event['type'] = 'date';
    const startedAt = tz(date);
    const endedAt = startedAt.add(1, 'day');

    return { id, type, title, startedAt, endedAt };
  }
}
