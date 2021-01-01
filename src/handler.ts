import { APIGatewayProxyHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import 'source-map-support/register';
import { Browser } from 'puppeteer';

import { setupCalendar, launchBrowserPage, openCybozuSchedulePage } from './apis';
import { fetchEventsFromCybozuUsecase, syncToGoogleCalendarUsecase } from './usecases';

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
};
