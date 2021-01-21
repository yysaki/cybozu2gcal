import { APIGatewayProxyHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import { WebPageDriver, CybozuRepository } from './api/cybozu';
import { CalendarDriver, GoogleCalendarRepository } from './api/googleCalendar';
import { slackNotify } from './lib';
import { syncUsecaseInteractor } from './usecase/cybozu2gcal';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  try {
    const webPageDriver = new WebPageDriver();
    const cybozuRepository = new CybozuRepository(webPageDriver);

    const calendarDriver = new CalendarDriver();
    const googleCalendarRepository = new GoogleCalendarRepository(calendarDriver);

    const sync = syncUsecaseInteractor(cybozuRepository, googleCalendarRepository);
    const { added, deleted } = await sync();
    const body = `added: ${added.length}, deleted: ${deleted.length}`;
    console.log(JSON.stringify({ added, deleted }));

    return { statusCode: 200, body };
  } catch (error) {
    console.error(error);

    await slackNotify({ status: 'warning', message: error?.message || 'Unknown error was thrown.' });
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
