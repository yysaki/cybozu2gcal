import { ICybozuRepository, IGoogleCalendarRepository, SyncUsecaseOutputData } from './';

export type SyncUsecase = (
  cybozuRepository: ICybozuRepository,
  googleRepository: IGoogleCalendarRepository,
) => () => Promise<SyncUsecaseOutputData>;
