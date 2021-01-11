import { APIGatewayProxyHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import { evaluateWebPage, createCybozuRepository } from './api/cybozu';
import { calendarDriver, createGoogleCalendarRepository } from './api/googleCalendar';
import { syncUsecaseInteractor } from './usecase/cybozu2gcal';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  try {
    const cybozuRepository = createCybozuRepository(evaluateWebPage);
    const googleCalendarRepository = createGoogleCalendarRepository(calendarDriver);

    const sync = syncUsecaseInteractor(cybozuRepository, googleCalendarRepository);
    const { inserted, deleted } = await sync();

    return { statusCode: 200, body: `inserted: ${inserted.length}, deleted: ${deleted.length}` };
  } catch (error) {
    console.error(error);

    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
