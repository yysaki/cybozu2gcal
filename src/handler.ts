import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import 'source-map-support/register';

import { authGoogleApi, usingPuppeteer } from './apis';
import { fetchEventsFromCybozuUsecase, syncToGoogleCalendarUsecase } from './usecases';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  try {
    return await usingPuppeteer<APIGatewayProxyResult>(async (evaluate) => {
      const fetch = fetchEventsFromCybozuUsecase(evaluate);
      const events = await fetch();

      const googleCalendarRepository = authGoogleApi();

      const sync = syncToGoogleCalendarUsecase(googleCalendarRepository);
      const body = await sync(events);

      return { statusCode: 200, body };
    });
  } catch (error) {
    console.error(error);

    return { statusCode: 500, body: JSON.stringify(error) };
  }
};
