import 'source-map-support/register';

import { Event } from '../entity';

export interface EvaluateResult {
  title: string;
  href: string;
  eventTime?: string;
}

export interface CybozuRepository {
  list(): Promise<Event[]>;
}

export const fetchEventsFromCybozuUsecase = (repository: CybozuRepository) => {
  return async (): Promise<Event[]> => {
    return await repository.list();
  };
};
