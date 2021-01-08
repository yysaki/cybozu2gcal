import 'source-map-support/register';

import { EvaluateCybozuPage, fetchEventsFromCybozuUsecase } from '/src/usecases/';

const result = {
  title: 'event X',
  href: 'ag.cgi?page=ScheduleView&UID=1234&GID=1234&Date=da.2021.1.1&BDate=da.2021.1.1&sEID=1234567&CP=sg',
  eventTime: '12:30-13:30 ',
};
const evaluate: EvaluateCybozuPage = jest.fn(async () => [result]);

describe('fetchEventsFromCybozuUsecase', () => {
  const subject = fetchEventsFromCybozuUsecase(evaluate);

  const expected = {
    id: '1234567',
    title: 'event X',
    startedAt: '2021-01-01T12:30:00+09:00',
    endedAt: '2021-01-01T13:30:00+09:00',
  };

  it('returns Event[]', async () => {
    const events = await subject();

    expect(events[0]).toEqual(expect.objectContaining(expected));
  });
});
