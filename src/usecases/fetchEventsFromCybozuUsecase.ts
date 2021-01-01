import 'source-map-support/register';

import { buildDateTime, Event } from '../entity';

export interface EvaluateResult {
  title: string;
  href: string;
  eventTime?: string;
}

export type EvaluateCybozuPage = () => Promise<EvaluateResult[]>;

const parse = ({ title, href, eventTime }: EvaluateResult): Event | undefined => {
  const regexp = /\Date=da\.([0-9]+)\.([0-9]+)\.([0-9]+)&BDate=da\.([0-9]+)\.([0-9]+)\.([0-9]+)&sEID=([0-9]+)/;
  const match = href.match(regexp);
  if (!match) return;

  const eid = match[7];

  const startedDate = { year: match[1], month: match[2], day: match[3] };
  const endedDate = { year: match[4], month: match[5], day: match[6] };
  let startedTime = { hour: '0', minute: '0' };
  let endedTime = { hour: '23', minute: '59' };

  if (eventTime) {
    const timeSpanMatch = eventTime.match(/([0-9]+):([0-9]+)-([0-9]+):([0-9]+)/);
    const timeMatch = eventTime.match(/([0-9]+):([0-9]+)/);

    if (timeSpanMatch) {
      startedTime = { hour: timeSpanMatch[1], minute: timeSpanMatch[2] };
      endedTime = { hour: timeSpanMatch[3], minute: timeSpanMatch[4] };
    } else if (timeMatch) {
      startedTime = { hour: timeMatch[1], minute: timeMatch[2] };
      endedTime = { hour: timeMatch[1], minute: timeMatch[2] };
    }
  }

  const startedAt = buildDateTime({ ...startedDate, ...startedTime });
  const endedAt = buildDateTime({ ...endedDate, ...endedTime });

  return { title, eid, startedAt, endedAt };
};

export const fetchEventsFromCybozuUsecase = (evaluate: EvaluateCybozuPage) => {
  return async (): Promise<Event[]> => {
    const evaluated = await evaluate();

    return evaluated.map(parse).filter<Event>((e): e is Event => !!e);
  };
};
