import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import chromium from 'chrome-aws-lambda';
import { Browser } from 'puppeteer';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  let browser: Browser | null = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    await page.goto('https://www.google.com');

    const result = await page.title();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: result }),
    };
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
