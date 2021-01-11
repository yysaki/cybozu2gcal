import { APIGatewayProxyHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import { evaluateWebPage, createCybozuRepository } from './api/cybozu';
import { calendarDriver, createGoogleCalendarRepository } from './api/googleCalendar';
import { slackNotify } from './lib';
import { syncUsecaseInteractor } from './usecase/cybozu2gcal';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  try {
    const cybozuRepository = createCybozuRepository(evaluateWebPage);
    const googleCalendarRepository = createGoogleCalendarRepository(calendarDriver);

    const sync = syncUsecaseInteractor(cybozuRepository, googleCalendarRepository);
    const { inserted, deleted } = await sync();
    const body = `inserted: ${inserted.length}, deleted: ${deleted.length}`;

    await slackNotify({ status: 'good', message: body });
    return { statusCode: 200, body };
  } catch (error) {
    console.error(error);

    await slackNotify({ status: 'warning', message: error?.message || 'Unknown error was thrown.' });
    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
