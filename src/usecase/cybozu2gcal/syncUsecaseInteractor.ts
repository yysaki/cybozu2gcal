import { isUnique, minMaxDateFrom } from '../../entity';
import { CybozuRepository, GoogleCalendarRepository, SyncUsecase } from './';

export const syncUsecaseInteractor: SyncUsecase = (
  cybozuRepository: CybozuRepository,
  googleRepository: GoogleCalendarRepository,
) => {
  return async () => {
    const cybozuEvents = await cybozuRepository.list();
    const { timeMin, timeMax } = minMaxDateFrom(cybozuEvents);
    const googleEvents = await googleRepository.list(timeMin.format(), timeMax.format());

    const deleteTargets = googleEvents.filter((e1) => cybozuEvents.every((e2) => !isUnique(e1, e2)));
    const addTargets = cybozuEvents.filter((e1) => googleEvents.every((e2) => !isUnique(e1, e2)));
    console.log(JSON.stringify({ cybozuEvents, googleEvents, addTargets, deleteTargets }));

    await googleRepository.deleteEvents(deleteTargets);
    await googleRepository.addEvents(addTargets);

    return { inserted: addTargets, deleted: deleteTargets };
  };
};
