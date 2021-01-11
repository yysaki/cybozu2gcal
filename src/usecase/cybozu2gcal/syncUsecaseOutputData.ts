import { Event } from '../../entity';

export interface SyncUsecaseOutputData {
  inserted: Event[];
  deleted: Event[];
}
