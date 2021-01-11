import 'source-map-support/register';

import { Event, isUnique, minMaxDateFrom } from '../../entity';

export interface CybozuRepository {
  list(): Promise<Event[]>;
}

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

export type SyncUsecase = (
  cybozuRepository: CybozuRepository,
  googleRepository: GoogleCalendarRepository,
) => () => Promise<{ inserted: Event[]; deleted: Event[] }>;

export const syncUsecaseInteractor: SyncUsecase = (
  cybozuRepository: CybozuRepository,
  googleRepository: GoogleCalendarRepository,
) => {
  return async () => {
    const cybozuEvents = await cybozuRepository.list();
    const { timeMin, timeMax } = minMaxDateFrom(cybozuEvents);
    const googleEvents = await googleRepository.list(timeMin.format(), timeMax.format());

    const deleteTargets = googleEvents.filter((e1) => cybozuEvents.every((e2) => !isUnique(e1, e2)));
    const insertTargets = cybozuEvents.filter((e1) => googleEvents.every((e2) => !isUnique(e1, e2)));

    await serialize(deleteTargets.map((event) => () => googleRepository.delete(event)));
    await serialize(insertTargets.map((event) => () => googleRepository.insert(event)));

    return { inserted: insertTargets, deleted: deleteTargets };
  };
};