import 'source-map-support/register';

import { GoogleCalendarRepository, syncToGoogleCalendarUsecase } from '/src/usecases/';
import { Event } from '/src/entity';

const events: Event[] = [
  {
    id: '1234567',
    title: 'event X',
    startedAt: '2021-01-01T12:30:00+09:00',
    endedAt: '2021-01-01T13:30:00+09:00',
  },
  {
    id: '1234568',
    title: 'event Y',
    startedAt: '2021-01-02T12:30:00+09:00',
    endedAt: '2021-01-02T13:30:00+09:00',
  },
  {
    id: '1234569',
    title: 'event Z',
    startedAt: '2021-01-03T12:30:00+09:00',
    endedAt: '2021-01-03T13:30:00+09:00',
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
