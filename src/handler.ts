import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import chromium from 'chrome-aws-lambda';
import { Browser, Page } from 'puppeteer';
import { google } from 'googleapis';

import {
  CYBOZU_BASE_URL,
  CYBOZU_BASIC_AUTH,
  CYBOZU_USERNAME,
  CYBOZU_PASSWORD,
  GOOGLE_API_CLIENT_ID,
  GOOGLE_API_SECRET,
  GOOGLE_API_REFRESH_TOKEN,
  GOOGLE_CALENDAR_ID,
} from './config';

interface Event {
  title: string;
  eid: string;
  startedAt: string;
  endedAt: string;
};

interface BuildDateParam {
  year: string,
  month: string,
  day: string,
  hour: string,
  minute: string
}

const buildDate = ({ year, month, day, hour, minute }: BuildDateParam) => {
  return `${year}-${month}-${day}T${hour}:${minute}:0+09:00`;
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

      const startedAt = buildDate({ ...startedDate, ...startedTime });
      const endedAt = buildDate({ ...endedDate, ...endedTime });

      result.push({ title: event.title, eid, startedAt, endedAt});
    });

    return result;
  });
}

const fetchEventsFromCybozu = async () => {
  let browser: Browser | null = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: false,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    await page.authenticate(CYBOZU_BASIC_AUTH);
    await page.goto(CYBOZU_BASE_URL);
    const logged_in = await page.evaluate(() => {
      const elements = document.querySelectorAll('.vr_Loginbase');
      return !!elements.length;
    });

    if (!logged_in) {
      await page.type("input[name='_Account']", CYBOZU_USERNAME);
      await page.type("input[name='Password']", CYBOZU_PASSWORD);

      await Promise.all([
        page.click("input[name='Submit']"),
        page.waitForNavigation(),
      ]);
    }

    await Promise.all([
      page.waitForNavigation(),
      page.goto(CYBOZU_BASE_URL + '?page=ScheduleUserMonth'),
    ]);

    return await fetchEvents(page);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

const listCalendars = async () => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI= 'urn:ietf:wg:oauth:2.0:oob';

  const oauth2client = new google.auth.OAuth2(
    GOOGLE_API_CLIENT_ID,
    GOOGLE_API_SECRET,
    REDIRECT_URI,
  );
  oauth2client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2client });
  
  const response = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    timeMin: (new Date('2020/12/01 00:00')).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response;
}

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  /* const events = await fetchEventsFromCybozu(); */

  const result = await listCalendars();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: result }),
  };
}
