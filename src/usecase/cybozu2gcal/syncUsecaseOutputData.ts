import { Event } from '../../entity';

export interface SyncUsecaseOutputData {
  added: Event[];
  deleted: Event[];
}
