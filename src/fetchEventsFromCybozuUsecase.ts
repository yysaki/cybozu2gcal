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

const fetchEvents = async (schedulePage: Page): Promise<Event[]> => {
  return await schedulePage.evaluate(() => {
    const result: Event[] = [];

    document.querySelectorAll('.eventLink').forEach(element => {
      const event: HTMLAnchorElement | null = element.querySelector('a.event');
      if (!event) return;

      const regexp = /\Date=da\.([0-9]+)\.([0-9]+)\.([0-9]+)\&BDate=da\.([0-9]+)\.([0-9]+)\.([0-9]+)\&sEID=([0-9]+)/
      const match = event.href.match(regexp);
      if (!match) return;

      const eid = match[7];

      const startedDate = { year: match[1], month: match[2], day: match[3] };
      const endedDate = { year: match[4], month: match[5], day: match[6] };
      let startedTime = { hour: '0', minute: '0' };
      let endedTime = { hour: '23', minute: '59' };

      const eventTime: HTMLSpanElement | null = element.querySelector('span.eventDateTime');
      if (eventTime?.innerText) {
        const timeSpanMatch = eventTime.innerText.match(/([0-9]+):([0-9]+)-([0-9]+):([0-9]+)/);
        const timeMatch = eventTime.innerText.match(/([0-9]+):([0-9]+)/);

        if (timeSpanMatch) {
          startedTime = { hour: timeSpanMatch[1], minute: timeSpanMatch[2] };
          startedTime = { hour: timeSpanMatch[3], minute: timeSpanMatch[4] };
        } else if (timeMatch) {
          startedTime = { hour: timeMatch[1], minute: timeMatch[2] };
          startedTime = { hour: timeMatch[1], minute: timeMatch[2] };
        }
      }

      const buildDate = (param: BuildDateParam) => {
        const pad = (num: string) => ('00' + num).slice(-2);

        // 24:00 を 23:59 に読み替え
        const hour = param.hour === '24' ? '23' : param.hour;
        const minute = param.hour === '24' ? '59' : param.minute;

        return `${param.year}-${pad(param.month)}-${pad(param.day)}T${pad(hour)}:${pad(minute)}:00+09:00`; // Asia/Tokyo
      }

      const startedAt = buildDate({ ...startedDate, ...startedTime });
      const endedAt = buildDate({ ...endedDate, ...endedTime });

      result.push({ title: event.title, eid, startedAt, endedAt });
    });

    return result;
  });
}

export const fetchEventsFromCybozuUsecase = (page: Page) => {
  return async () => {
    return await fetchEvents(page);
  }
}
