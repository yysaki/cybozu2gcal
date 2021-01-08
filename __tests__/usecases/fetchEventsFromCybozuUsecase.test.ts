import 'source-map-support/register';

import { EvaluateCybozuPage, fetchEventsFromCybozuUsecase } from '/src/usecases/';
import { tz } from '/src/lib';

const results = [
  {
    title: 'event X',
    href: `ag.cgi?page=ScheduleView&UID=1234&GID=1234&Date=da.2021.1.1&BDate=da.2021.1.1&sEID=1234567&CP=sg`,
    eventTime: '12:30-13:30 ',
  },
  {
    title: 'event Y',
    href: `ag.cgi?page=ScheduleView&UID=1234&GID=1234&Date=da.2021.1.2&BDate=da.2021.1.2&sEID=1234568&CP=sg`,
  },
];
const evaluate: EvaluateCybozuPage = jest.fn(async () => results);

describe('fetchEventsFromCybozuUsecase', () => {
  const subject = fetchEventsFromCybozuUsecase(evaluate);

  const expected = [
    {
      id: '1234567',
      type: 'dateTime',
      title: 'event X',
      startedAt: tz('2021-01-01 12:30'),
      endedAt: tz('2021-01-01 13:30'),
    },
    {
      id: '1234568',
      type: 'date',
      title: 'event Y',
      startedAt: tz('2021-01-02'),
      endedAt: tz('2021-01-03'),
    },
  ];

  it('returns Event[]', async () => {
    const events = await subject();

    expect(events).toEqual(expect.arrayContaining(expected));
  });
});
