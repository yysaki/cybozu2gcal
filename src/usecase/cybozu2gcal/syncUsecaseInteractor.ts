import { isUnique, minMaxDateFrom } from '../../entity';
import { SyncUsecase } from './';

export const syncUsecaseInteractor: SyncUsecase = (cybozuRepository, googleRepository, { notify }) => {
  return async () => {
    try {
      const cybozuEvents = await cybozuRepository.list();
      const { timeMin, timeMax } = minMaxDateFrom(cybozuEvents);
      const googleEvents = await googleRepository.list(timeMin.format(), timeMax.format());

      const deleteTargets = googleEvents.filter((e1) => cybozuEvents.every((e2) => !isUnique(e1, e2)));
      const addTargets = cybozuEvents.filter((e1) => googleEvents.every((e2) => !isUnique(e1, e2)));

      await googleRepository.deleteEvents(deleteTargets);
      await googleRepository.addEvents(addTargets);

      return { added: addTargets, deleted: deleteTargets };
    } catch (error) {
      notify({ status: 'warning', message: error?.message || 'Unknown error was thrown.' });

      throw error;
    }
  };
};
