import 'source-map-support/register';
import chromium from 'chrome-aws-lambda';
import { Browser, Page } from 'puppeteer';
import { CYBOZU_BASE_URL, CYBOZU_BASIC_AUTH, CYBOZU_USERNAME, CYBOZU_PASSWORD } from '../config';

type Callback<T> = (page: Page) => Promise<T>;

export const using = async <T>(callback: Callback<T>): Promise<T> => {
  let browser: Browser | null = null;
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: false,
      ignoreHTTPSErrors: true,
    });

    const page = await openCybozuSchedulePage(browser);

    return await callback(page);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const openCybozuSchedulePage = async (browser: Browser): Promise<Page> => {
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

    await Promise.all([page.click("input[name='Submit']"), page.waitForNavigation()]);
  }

  await Promise.all([page.waitForNavigation(), page.goto(CYBOZU_BASE_URL + '?page=ScheduleUserMonth')]);

  return page;
};
