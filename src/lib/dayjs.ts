import dayjs from 'dayjs';
import utc from 'dayjs/plugin/timezone';
import timezone from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };
