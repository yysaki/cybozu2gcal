import { isUnique, minMaxDateFrom } from '../../entity';
import { ICybozuRepository, IGoogleCalendarRepository, SyncUsecase } from './';

export const syncUsecaseInteractor: SyncUsecase = (
  cybozuRepository: ICybozuRepository,
  googleRepository: IGoogleCalendarRepository,
) => {
  return async () => {
    const cybozuEvents = await cybozuRepository.list();
    const { timeMin, timeMax } = minMaxDateFrom(cybozuEvents);
    const googleEvents = await googleRepository.list(timeMin.format(), timeMax.format());

    const deleteTargets = googleEvents.filter((e1) => cybozuEvents.every((e2) => !isUnique(e1, e2)));
    const addTargets = cybozuEvents.filter((e1) => googleEvents.every((e2) => !isUnique(e1, e2)));

    await googleRepository.deleteEvents(deleteTargets);
    await googleRepository.addEvents(addTargets);

    return { added: addTargets, deleted: deleteTargets };
  };
};
