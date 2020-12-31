import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import chromium from 'chrome-aws-lambda';
import { Browser, Page } from 'puppeteer';
import { google, calendar_v3 } from 'googleapis';

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
  googleId?: string;
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

      const buildDate = ({ year, month, day, ...rest }: BuildDateParam) => {
        const pad = (num: string) => ('00' + num).slice(-2);

        // 24:00 を 23:59 に読み替え
        const hour = rest.hour === '24' ? '23' : rest.hour;
        const minute = rest.hour === '24' ? '59' : rest.minute;

        return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`; // Asia/Tokyo
      }

      const startedAt = buildDate({ ...startedDate, ...startedTime });
      const endedAt = buildDate({ ...endedDate, ...endedTime });

      result.push({ title: event.title, eid, startedAt, endedAt });
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

const listEvents = async (calendar: calendar_v3.Calendar, timeMin: string, timeMax: string) => {
  const { data: { items } } = await calendar.events.list({
    calendarId: GOOGLE_CALENDAR_ID,
    timeMin,
    timeMax,
    maxResults: 250,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return items || [];
}

const buildEvent = (event: Event): calendar_v3.Schema$Event => {
  return {
    summary: event.title,
    description: event.eid,
    start: { dateTime: event.startedAt },
    end: { dateTime: event.endedAt},
  };
}

const insertEvent = async (calendar: calendar_v3.Calendar, event: Event) => {
  const requestBody = buildEvent(event);

  return await calendar.events.insert({
    calendarId: GOOGLE_CALENDAR_ID,
    requestBody
  });
}

const deleteEvent = async (calendar: calendar_v3.Calendar, { googleId }: Event) => {
  return await calendar.events.delete({
    calendarId: GOOGLE_CALENDAR_ID,
    eventId: googleId || '',
  });
}

const minMaxISOTime = (events: Event[]) => {
  const unixTimes = events
    .map(e => [e.startedAt, e.endedAt])
    .reduce((array, value) => array.concat(value))
    .map(d => new Date(d).getTime());

  const result: [string, string] = [
    new Date(Math.min(...unixTimes)).toISOString(),
    new Date(Math.max(...unixTimes)).toISOString()
  ]

  return result;
}

const eventFrom = (googleEvent: calendar_v3.Schema$Event): Event => {
  return {
    title: googleEvent.summary || '',
    eid: googleEvent.description || '',
    googleId: googleEvent.id || '',
    startedAt: googleEvent.start?.dateTime || '',
    endedAt: googleEvent.end?.dateTime || '',
  };
}

const isUnique = (lhs: Event, rhs: Event) => {
  return lhs.eid === rhs.eid && lhs.startedAt === rhs.startedAt && lhs.endedAt === rhs.endedAt;
};

const syncEvents = async (calendar: calendar_v3.Calendar, events: Event[], googleEvents: calendar_v3.Schema$Event[]) => {
  const existsEvents = googleEvents.map(eventFrom);
  const insertTargets = events.filter(e1 => existsEvents.every(e2 => !isUnique(e1, e2)));
  const deleteTargets = existsEvents.filter(e1 => events.every(e2 => !isUnique(e1, e2)));

  await Promise.all(insertTargets.map(async event => await insertEvent(calendar, event)));
  await Promise.all(deleteTargets.map(async event => await deleteEvent(calendar, event)));

  return `inserted: ${insertTargets.length}, deleted: ${deleteTargets.length}`;
}

const syncToGoogleCalendar = async (events: Event[]) => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI= 'urn:ietf:wg:oauth:2.0:oob';

  const oauth2client = new google.auth.OAuth2(
    GOOGLE_API_CLIENT_ID,
    GOOGLE_API_SECRET,
    REDIRECT_URI,
  );
  oauth2client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2client });
  const googleEvents = await listEvents(calendar, ...minMaxISOTime(events));

  const result = await syncEvents(calendar, events, googleEvents);
  return result;
}

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  const events = await fetchEventsFromCybozu();

  const message = await syncToGoogleCalendar(events);

  return {
    statusCode: 200,
    body: JSON.stringify({ message }),
  };
}
