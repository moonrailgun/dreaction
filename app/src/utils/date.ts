import dayjs from 'dayjs';

export function renderDeviceLogsDate(date: Date) {
  return dayjs(date).format('HH:mm:ss.SSS');
}
