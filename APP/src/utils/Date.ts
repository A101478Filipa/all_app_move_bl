import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/pt';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);


export function calculateAge(birthdate: string | Date): number {
  return dayjs().diff(dayjs(birthdate), 'year');
}


export function formatDateLong(dateString: string | Date, locale = 'pt'): string {
  return dayjs(dateString).locale(locale).format('D [de] MMMM [de] YYYY');
}


export const formatDate = (dateString: string | Date, format = 'DD/MM'): string => {
  return dayjs(dateString).format(format);
};


export const formatFriendlyDate = (
  dateStr: string | Date, 
  t: (key: string) => string 
): string => {
  const date = dayjs(dateStr);
  const now = dayjs();
  const timeStr = date.format('HH:mm');

  if (date.isSame(now, 'day')) {
    return `${t('common.today')}, ${t('common.at')} ${timeStr}`;
  } 
  
  if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return `${t('common.yesterday')}, ${t('common.at')} ${timeStr}`;
  }

  return `${date.format('DD/MM')}, ${t('common.at')} ${timeStr}`;
};