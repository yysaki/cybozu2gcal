import { CybozuRepository, GoogleCalendarRepository, SyncUsecaseOutputData } from './';

export type SyncUsecase = (
  cybozuRepository: CybozuRepository,
  googleRepository: GoogleCalendarRepository,
) => () => Promise<SyncUsecaseOutputData>;
