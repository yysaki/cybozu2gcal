import 'source-map-support/register';
import chromium from 'chrome-aws-lambda';
import { Browser, Page } from 'puppeteer';
import { CYBOZU_BASE_URL, CYBOZU_BASIC_AUTH, CYBOZU_USERNAME, CYBOZU_PASSWORD } from '../config';
import { Event } from '../entity';
import { tz } from '../lib';

import { CybozuRepository } from '../usecases';

export interface EvaluateResult {
  title: string;
  href: string;
  eventTime?: string;
}

const buildDateTime = ({ date, ...rest }: { date: string; hour: string; minute: string }) => {
  // 24:00 を 23:59 に読み替え
  const hour = rest.hour === '24' ? '23' : rest.hour;
  const minute = rest.hour === '24' ? '59' : rest.minute;

  return tz(`${date} ${hour}:${minute}`);
};

const parse = ({ title, href, eventTime }: EvaluateResult): Event | undefined => {
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
      const startedAt = buildDateTime({ date, hour: timeSpanMatch[1], minute: timeSpanMatch[2] });
      const endedAt = buildDateTime({ date, hour: timeSpanMatch[3], minute: timeSpanMatch[4] });

      return { id, type, title, startedAt, endedAt };
    } else if (timeMatch) {
      const dateTime = buildDateTime({ date, hour: timeMatch[1], minute: timeMatch[2] });

      return { id, type, title, startedAt: dateTime, endedAt: dateTime };
    }
  }

  const type: Event['type'] = 'date';
  const startedAt = tz(date);
  const endedAt = startedAt.add(1, 'day');

  return { id, type, title, startedAt, endedAt };
};

export const cybozuRepository: CybozuRepository = {
  list: async () => {
    let browser: Browser | null = null;
    try {
      browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: false,
        ignoreHTTPSErrors: true,
      });

      const page = await openSchedulePage(browser);
      const evaluated = await evaluate(page);

      return evaluated.map(parse).filter<Event>((e): e is Event => !!e);
    } finally {
      if (browser !== null) {
        await browser.close();
      }
    }
  },
};

const openSchedulePage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();

  await page.authenticate(CYBOZU_BASIC_AUTH);
  await page.goto(CYBOZU_BASE_URL);

  await page.type("input[name='_Account']", CYBOZU_USERNAME);
  await page.type("input[name='Password']", CYBOZU_PASSWORD);

  await Promise.all([page.click("input[name='Submit']"), page.waitForNavigation()]);

  await Promise.all([page.waitForNavigation(), page.goto(CYBOZU_BASE_URL + '?page=ScheduleUserMonth')]);

  return page;
};

export const evaluate = async (page: Page): Promise<EvaluateResult[]> => {
  return await page.evaluate(() => {
    const result: EvaluateResult[] = [];

    document.querySelectorAll('.eventLink').forEach((element) => {
      const event: HTMLAnchorElement | null = element.querySelector('a.event');
      if (!event) return;

      const eventTime: HTMLSpanElement | null = element.querySelector('span.eventDateTime');
      result.push({
        title: event.title,
        href: event.href,
        eventTime: eventTime?.innerText,
      });
    });

    return result;
  });
};
