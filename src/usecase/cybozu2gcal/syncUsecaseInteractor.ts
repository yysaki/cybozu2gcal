import { equals, minMaxDateFrom } from '../../entity';
import { SyncUsecase } from './';

export const syncUsecaseInteractor: SyncUsecase = (cybozuRepository, googleRepository, { notify }) => {
  return async () => {
    try {
      const cybozuEvents = await cybozuRepository.list();
      const { timeMin, timeMax } = minMaxDateFrom(cybozuEvents);
      const googleEvents = await googleRepository.list(timeMin.format(), timeMax.add1Day().format());

      const deleteTargets = googleEvents.filter((g) => cybozuEvents.every((c) => !equals(g, c)));
      const addTargets = cybozuEvents.filter((c) => googleEvents.every((g) => !equals(c, g)));

      await googleRepository.deleteEvents(deleteTargets);
      await googleRepository.addEvents(addTargets);

      return { added: addTargets, deleted: deleteTargets };
    } catch (error) {
      await notify({ status: 'warning', message: error?.message || 'Unknown error was thrown.' });

      throw error;
    }
  };
};
