import 'source-map-support/register';

import { GoogleCalendarRepository, syncToGoogleCalendarUsecase } from '/src/usecases/';
import { Event } from '/src/entity';
import { tz } from '/src/lib';

const events: Event[] = [
  {
    id: '1234567',
    type: 'dateTime',
    title: 'event X',
    startedAt: tz('2021-01-01 12:30'),
    endedAt: tz('2021-01-01 13:30'),
  },
  {
    id: '1234568',
    type: 'dateTime',
    title: 'event Y',
    startedAt: tz('2021-01-02 12:30'),
    endedAt: tz('2021-01-02 13:30'),
  },
  {
    id: '1234569',
    type: 'dateTime',
    title: 'event Z',
    startedAt: tz('2021-01-03 12:30'),
    endedAt: tz('2021-01-03 13:30'),
  },
];
const repository: GoogleCalendarRepository = {
  list: jest.fn(async (_timeMin, _timeMax) => [events[0], events[1]]),
  insert: jest.fn(async (_event) => {}),
  delete: jest.fn(async (_event) => {}),
};

describe('syncToGoogleCalendarUsecase', () => {
  const subject = syncToGoogleCalendarUsecase(repository);

  const param = [events[1], events[2]];

  it('returns inserted and deleted events', async () => {
    const result = await subject(param);

    expect(result).toEqual(expect.objectContaining({ inserted: [events[2]], deleted: [events[0]] }));
  });
});
