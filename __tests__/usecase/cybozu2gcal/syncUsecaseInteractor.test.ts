import {
  ICybozuRepository,
  IGoogleCalendarRepository,
  ISlackRepository,
  syncUsecaseInteractor,
} from '/src/usecase/cybozu2gcal';
import { DateTime, Event } from '/src/entity';

const events: Event[] = [
  {
    id: '1234567',
    type: 'dateTime',
    title: 'event X',
    startedAt: new DateTime('2021-01-01 12:30'),
    endedAt: new DateTime('2021-01-01 13:30'),
  },
  {
    id: '1234568',
    type: 'dateTime',
    title: 'event Y',
    startedAt: new DateTime('2021-01-02 12:30'),
    endedAt: new DateTime('2021-01-02 13:30'),
  },
  {
    id: '1234569',
    type: 'dateTime',
    title: 'event Z',
    startedAt: new DateTime('2021-01-03 12:30'),
    endedAt: new DateTime('2021-01-03 13:30'),
  },
];
const googleRepository: IGoogleCalendarRepository = {
  list: jest.fn(async (_timeMin, _timeMax) => [events[0], events[1]]),
  addEvents: jest.fn(async (_events) => {
    return;
  }),
  deleteEvents: jest.fn(async (_events) => {
    return;
  }),
};

const cybozuRepository: ICybozuRepository = {
  list: jest.fn(async () => [events[1], events[2]]),
};

const slackRepository: ISlackRepository = {
  notify: jest.fn(async (_params) => {
    return;
  }),
};

describe('syncUsecaseInteractor', () => {
  const subject = syncUsecaseInteractor(cybozuRepository, googleRepository, slackRepository);

  it('returns added and deleted events', async () => {
    const result = await subject();

    expect(result).toEqual(expect.objectContaining({ added: [events[2]], deleted: [events[0]] }));
  });
});
