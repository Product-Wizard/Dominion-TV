/**
 * Dominion TV — Programme Schedule
 * days: 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
 * Times are in Africa/Lagos (WAT, UTC+1)
 */

export const TIMEZONE = 'Africa/Lagos';

export const CHANNEL_ID: string =
  process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID ?? '';

export const API_KEY: string =
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

/**
 * Retry attempt offsets (minutes) measured from programme start time.
 * Attempt 1 → +1 min after start
 * Attempt 2 → +2 min after start
 * Attempt 3 → +5 min after start
 * After attempt 3 give up on that programme for the day.
 */
export const RETRY_OFFSETS_MINUTES = [1, 2, 5];

export interface Programme {
  id: string;
  name: string;
  days: number[];
  start: string;
  end: string;
  category: string;
}

export const PROGRAMMES: Programme[] = [
  {
    id: 'daybreak_live',
    name: 'Daybreak Live',
    days: [1, 2, 3, 4, 5, 6],
    start: '07:00',
    end: '08:50',
    category: 'morning_show',
  },
  {
    id: 'idan_ori_odan',
    name: 'Idan Ori Odan',
    days: [1, 3, 5],
    start: '09:00',
    end: '09:50',
    category: 'cultural',
  },
  {
    id: 'the_agenda',
    name: 'The Agenda',
    days: [2, 4],
    start: '09:00',
    end: '09:50',
    category: 'talk_show',
  },
  {
    id: 'big_conversation',
    name: 'The Big Conversation',
    days: [1, 2, 3, 4, 5],
    start: '10:00',
    end: '11:00',
    category: 'talk_show',
  },
  {
    id: 'dominion_sports',
    name: 'Dominion Sports',
    days: [1, 2, 3, 4, 5],
    start: '11:15',
    end: '11:50',
    category: 'sports',
  },
  {
    id: 'iroyin_lerefe',
    name: 'Iroyin Lerefe',
    days: [1, 2, 3, 4, 5],
    start: '12:00',
    end: '12:15',
    category: 'news',
  },
  {
    id: 'dominion_tv_news',
    name: 'Dominion TV News',
    days: [1, 2, 3, 4, 5],
    start: '12:15',
    end: '12:30',
    category: 'news',
  },
  {
    id: 'e_plus',
    name: 'E-Plus',
    days: [1, 3, 5],
    start: '13:00',
    end: '13:50',
    category: 'entertainment',
  },
  {
    id: 'lojude',
    name: 'Lojude',
    days: [1, 2, 4],
    start: '14:00',
    end: '14:50',
    category: 'cultural',
  },
  {
    id: 'okodoro_oselu',
    name: 'Okodoro Oselu',
    days: [1],
    start: '15:00',
    end: '15:50',
    category: 'political',
  },
  {
    id: 'iyo_aye',
    name: 'Iyo Aye',
    days: [2],
    start: '15:30',
    end: '16:25',
    category: 'talk_show',
  },
  {
    id: 'the_policescope',
    name: 'The Policescope',
    days: [3],
    start: '18:00',
    end: '18:50',
    category: 'documentary',
  },
  {
    id: 'oke_agba',
    name: 'Oke Agba',
    days: [4],
    start: '15:00',
    end: '15:50',
    category: 'cultural',
  },
];
