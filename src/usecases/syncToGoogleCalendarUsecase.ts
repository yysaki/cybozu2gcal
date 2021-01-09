import 'source-map-support/register';

import { Event, isUnique, minMaxDateFrom } from '../entity';

export interface GoogleCalendarRepository {
  list(timeMin: string, timeMax: string): Promise<Event[]>;
  insert(event: Event): Promise<void>;
  delete(event: Event): Promise<void>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const serialize = async (promises: (() => Promise<void>)[]) => {
  for (const promise of promises) {
    await wait(100); // 100 milli second.
    await promise();
  }
};

export const syncToGoogleCalendarUsecase = (repository: GoogleCalendarRepository) => {
  return async (events: Event[]): Promise<{ inserted: Event[]; deleted: Event[] }> => {
    const { timeMin, timeMax } = minMaxDateFrom(events);
    const existEvents = await repository.list(timeMin.format(), timeMax.format());

    const deleteTargets = existEvents.filter((e1) => events.every((e2) => !isUnique(e1, e2)));
    const insertTargets = events.filter((e1) => existEvents.every((e2) => !isUnique(e1, e2)));

    await serialize(deleteTargets.map((event) => () => repository.delete(event)));
    await serialize(insertTargets.map((event) => () => repository.insert(event)));

    return { inserted: insertTargets, deleted: deleteTargets };
  };
};
