import 'source-map-support/register';

export interface Event {
  title: string;
  eid: string;
  googleId?: string;
  startedAt: string;
  endedAt: string;
};
