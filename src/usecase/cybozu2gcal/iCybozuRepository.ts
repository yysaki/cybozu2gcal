import { Event } from '../../entity';

export interface ICybozuRepository {
  list(): Promise<Event[]>;
}
