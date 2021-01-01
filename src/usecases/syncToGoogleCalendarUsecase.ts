import 'source-map-support/register';

import { Event, isUnique, minMaxDateFrom } from '../entity';

export interface GoogleCalendarRepository {
  list(timeMin: string, timeMax: string): Promise<Event[]>;
  insert(event: Event): Promise<void>;
  delete(event: Event): Promise<void>;
}

export const syncToGoogleCalendarUsecase = (repository: GoogleCalendarRepository) => {
  return async (events: Event[]): Promise<string> => {
    const { timeMin, timeMax } = minMaxDateFrom(events);
    const existEvents = await repository.list(timeMin.toISOString(), timeMax.toISOString());

    const insertTargets = events.filter((e1) => existEvents.every((e2) => !isUnique(e1, e2)));
    const deleteTargets = existEvents.filter((e1) => events.every((e2) => !isUnique(e1, e2)));

    await Promise.all(insertTargets.map(async (event) => await repository.insert(event)));
    await Promise.all(deleteTargets.map(async (event) => await repository.delete(event)));

    return `inserted: ${insertTargets.length}, deleted: ${deleteTargets.length}`;
  };
};
