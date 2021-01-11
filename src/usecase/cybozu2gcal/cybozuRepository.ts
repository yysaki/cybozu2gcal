import { Event } from '../../entity';

export interface CybozuRepository {
  list(): Promise<Event[]>;
}
