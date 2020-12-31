import 'source-map-support/register';
import { Page } from 'puppeteer';

import { Event } from './entity';

interface BuildDateParam {
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string
}

interface QueryResult {
  title: string,
  href: string,
  eventTime?: string,
}

const buildDate = ({ year, month, day, ...rest }: BuildDateParam) => {
  const pad = (num: string) => ('00' + num).slice(-2);

  // 24:00 を 23:59 に読み替え
  const hour = rest.hour === '24' ? '23' : rest.hour;
  const minute = rest.hour === '24' ? '59' : rest.minute;

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`; // Asia/Tokyo
}

const parseResult = ({ title, href, eventTime }: QueryResult): Event | undefined => {
  const regexp = /\Date=da\.([0-9]+)\.([0-9]+)\.([0-9]+)\&BDate=da\.([0-9]+)\.([0-9]+)\.([0-9]+)\&sEID=([0-9]+)/
  const match = href.match(regexp);
  if (!match) return;

  const eid = match[7];

  const startedDate = { year: match[1], month: match[2], day: match[3] };
  const endedDate = { year: match[4], month: match[5], day: match[6] };
  let startedTime = { hour: '0', minute: '0' };
  let endedTime = { hour: '23', minute: '59' };

  if (eventTime) {
    const timeSpanMatch = eventTime.match(/([0-9]+):([0-9]+)-([0-9]+):([0-9]+)/);
    const timeMatch = eventTime.match(/([0-9]+):([0-9]+)/);

    if (timeSpanMatch) {
      startedTime = { hour: timeSpanMatch[1], minute: timeSpanMatch[2] };
      startedTime = { hour: timeSpanMatch[3], minute: timeSpanMatch[4] };
    } else if (timeMatch) {
      startedTime = { hour: timeMatch[1], minute: timeMatch[2] };
      startedTime = { hour: timeMatch[1], minute: timeMatch[2] };
    }
  }

  const startedAt = buildDate({ ...startedDate, ...startedTime });
  const endedAt = buildDate({ ...endedDate, ...endedTime });

  return { title , eid, startedAt, endedAt };
}

export const fetchEventsFromCybozuUsecase = (schedulePage: Page) => {
  return async () => {
    const evaluated = await schedulePage.evaluate(() => {
      const result: QueryResult[] = [];

      document.querySelectorAll('.eventLink').forEach(element => {
        const event: HTMLAnchorElement | null = element.querySelector('a.event');
        if (!event) return;

        const eventTime: HTMLSpanElement | null = element.querySelector('span.eventDateTime');
        result.push({ title: event.title, href: event.href, eventTime: eventTime?.innerText });
      });

      return result;
    });

    return evaluated.map(parseResult).filter<Event>((e): e is Event => !!e);
  }
}
