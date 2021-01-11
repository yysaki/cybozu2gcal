import 'source-map-support/register';

import { CybozuRepository, fetchEventsFromCybozuUsecase } from '/src/usecases';
import { Event } from '/src/entity';
import { tz } from '/src/lib';

const results: Event[] = [
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
const repository: CybozuRepository = {
  list: jest.fn(async () => results),
};

describe('fetchEventsFromCybozuUsecase', () => {
  const subject = fetchEventsFromCybozuUsecase(repository);

  it('returns Event[]', async () => {
    const events = await subject();

    expect(events).toEqual(expect.arrayContaining(results));
  });
});
