interface NotifyParams {
  status: 'good' | 'warning';
  message: string;
}

export interface ISlackRepository {
  notify: (params: NotifyParams) => Promise<void>;
}
