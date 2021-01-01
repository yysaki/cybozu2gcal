import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'; // eslint-disable-line import/no-unresolved
import 'source-map-support/register';

import { setupCalendar, using } from './apis';
import { fetchEventsFromCybozuUsecase, syncToGoogleCalendarUsecase } from './usecases';

export const cybozu2gcal: APIGatewayProxyHandler = async () => {
  return await using<APIGatewayProxyResult>(async (evaluate) => {
    const fetch = fetchEventsFromCybozuUsecase(evaluate);
    const events = await fetch();

    const googleCalendar = setupCalendar();

    const sync = syncToGoogleCalendarUsecase(googleCalendar);
    const body = await sync(events);

    return { statusCode: 200, body };
  });
};
