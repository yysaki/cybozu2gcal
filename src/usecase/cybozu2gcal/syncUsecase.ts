import { ICybozuRepository, IGoogleCalendarRepository, ISlackRepository, SyncUsecaseOutputData } from './';

export type SyncUsecase = (
  cybozuRepository: ICybozuRepository,
  googleRepository: IGoogleCalendarRepository,
  slackRepository: ISlackRepository,
) => () => Promise<SyncUsecaseOutputData>;
