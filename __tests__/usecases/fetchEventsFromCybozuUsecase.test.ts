import 'source-map-support/register';

import { EvaluateCybozuPage, fetchEventsFromCybozuUsecase } from '/src/usecases/';
import { tz } from '/src/lib';

const id = '1234567';
const title = 'event X';
const result = {
  title,
  href: `ag.cgi?page=ScheduleView&UID=1234&GID=1234&Date=da.2021.1.1&BDate=da.2021.1.1&sEID=${id}&CP=sg`,
  eventTime: '12:30-13:30 ',
};
const evaluate: EvaluateCybozuPage = jest.fn(async () => [result]);

describe('fetchEventsFromCybozuUsecase', () => {
  const subject = fetchEventsFromCybozuUsecase(evaluate);

  const expected = { id, title, startedAt: tz('2021-01-01 12:30'), endedAt: tz('2021-01-01 13:30') };

  it('returns Event[]', async () => {
    const events = await subject();

    expect(events).toEqual(expect.arrayContaining([expected]));
  });
});
