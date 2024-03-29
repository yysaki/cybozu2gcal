import chromium from 'chrome-aws-lambda';
import { Browser, Page } from 'puppeteer-core';
import { CYBOZU_BASE_URL, CYBOZU_BASIC_AUTH, CYBOZU_USERNAME, CYBOZU_PASSWORD } from '../config';
import { EvaluateOutputData, IWebDriver } from '../repository';

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

const evaluateWebPage = async (page: Page): Promise<EvaluateOutputData[]> => {
  return await page.evaluate(() => {
    const result: EvaluateOutputData[] = [];

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

export class CybozuWebDriver implements IWebDriver {
  evaluate = async (): Promise<EvaluateOutputData[]> => {
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
      return await evaluateWebPage(page);
    } finally {
      if (browser !== null) {
        await browser.close();
      }
    }
  };
}
