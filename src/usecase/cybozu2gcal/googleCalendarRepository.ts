import { Event } from '../../entity';

export interface GoogleCalendarRepository {
  list(timeMin: string, timeMax: string): Promise<Event[]>;
  addEvents(events: Event[]): Promise<void>;
  deleteEvents(events: Event[]): Promise<void>;
}
