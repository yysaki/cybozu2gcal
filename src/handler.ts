import { APIGatewayProxyHandler } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import 'source-map-support/register';

import { authGoogleApi, cybozuRepository } from './apis';
import { fetchEventsFromCybozuUsecase, syncToGoogleCalendarUsecase } from './usecases';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  try {
    const fetch = fetchEventsFromCybozuUsecase(cybozuRepository);
    const events = await fetch();

    const googleCalendarRepository = authGoogleApi();

    const sync = syncToGoogleCalendarUsecase(googleCalendarRepository);
    const { inserted, deleted } = await sync(events);

    return { statusCode: 200, body: `inserted: ${inserted.length}, deleted: ${deleted.length}` };
  } catch (error) {
    console.error(error);

    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
