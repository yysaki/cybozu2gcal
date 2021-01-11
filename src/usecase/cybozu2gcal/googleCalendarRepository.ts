import { Event } from '../../entity';

export interface GoogleCalendarRepository {
  list(timeMin: string, timeMax: string): Promise<Event[]>;
  insert(event: Event): Promise<void>;
  delete(event: Event): Promise<void>;
}
