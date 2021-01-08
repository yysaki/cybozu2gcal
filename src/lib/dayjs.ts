import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import utc from 'dayjs/plugin/timezone';
import timezone from 'dayjs/plugin/utc';

const TIMEZONE = 'Asia/Tokyo';

dayjs.extend(minMax);

dayjs.extend(utc);
dayjs.extend(timezone);

type Dayjs = dayjs.Dayjs;
const tz = (date: dayjs.ConfigType): Dayjs => dayjs.tz(date, TIMEZONE);

export { dayjs, Dayjs, tz };
