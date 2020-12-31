import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { google } from 'googleapis';
import { Browser } from 'puppeteer';
import chromium from 'chrome-aws-lambda';

import { fetchEventsFromCybozuUsecase } from './fetchEventsFromCybozuUsecase';
import { syncToGoogleCalendarUsecase } from './syncToGoogleCalendarUsecase';

import {
  CYBOZU_BASE_URL,
  CYBOZU_BASIC_AUTH,
  CYBOZU_USERNAME,
  CYBOZU_PASSWORD,
  GOOGLE_API_CLIENT_ID,
  GOOGLE_API_SECRET,
  GOOGLE_API_REFRESH_TOKEN,
} from './config';

const setupCalendar = () => {
  /* const SCOPES = ['https://www.googleapis.com/auth/calendar.events']; */
  const REDIRECT_URI= 'urn:ietf:wg:oauth:2.0:oob';

  const oauth2client = new google.auth.OAuth2(
    GOOGLE_API_CLIENT_ID,
    GOOGLE_API_SECRET,
    REDIRECT_URI,
  );
  oauth2client.setCredentials({ refresh_token: GOOGLE_API_REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2client });
  return calendar;
}

const launchBrowserPage = async () => {
  return await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: false,
    ignoreHTTPSErrors: true,
  });
}

const openCybozuSchedulePage = async (browser: Browser) => {
  const page = await browser.newPage();

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

  return page;
}

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowserPage();
    const page = await openCybozuSchedulePage(browser);

    const fetch = fetchEventsFromCybozuUsecase(page);
    const events = await fetch();

    const googleCalendar = setupCalendar();

    const sync = syncToGoogleCalendarUsecase(googleCalendar);
    const body = await sync(events);

    return { statusCode: 200, body };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
