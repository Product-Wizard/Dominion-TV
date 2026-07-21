/**
 * Dominion TV — Programme Schedule
 * days: 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
 * Times are in Africa/Lagos (WAT, UTC+1)
 */

export const TIMEZONE = 'Africa/Lagos';

export const CHANNEL_ID = 'YOUR_CHANNEL_ID'; // e.g. UCxxxxxxxxxxxxxxxxxxxxxx
export const API_KEY    = 'YOUR_API_KEY';     // YouTube Data API v3 key

/**
 * Retry attempt offsets (in minutes) measured from programme start time.
 * Attempt 1 → +1 min after start
 * Attempt 2 → +2 min after start  (1 min after attempt 1)
 * Attempt 3 → +5 min after start  (3 mins after attempt 2)
 * After attempt 3, give up on that programme for the day.
 */
export const RETRY_OFFSETS_MINUTES = [1, 2, 5];

export const PROGRAMMES = [
  {
    id:       'daybreak_live',
    name:     'Daybreak Live',
    days:     [1, 2, 3, 4, 5, 6],   // Mon–Sat
    start:    '07:00',
    end:      '08:50',
    category: 'morning_show',
    icon:     '🌅',
  },
  {
    id:       'idan_ori_odan',
    name:     'Idan Ori Odan',
    days:     [1, 3, 5],             // Mon, Wed, Fri
    start:    '09:00',
    end:      '09:50',
    category: 'cultural',
    icon:     '🎭',
  },
  {
    id:       'the_agenda',
    name:     'The Agenda',
    days:     [2, 4],                // Tue, Thu
    start:    '09:00',
    end:      '09:50',
    category: 'talk_show',
    icon:     '🎙️',
  },
  {
    id:       'big_conversation',
    name:     'The Big Conversation',
    days:     [1, 2, 3, 4, 5],      // Mon–Fri
    start:    '10:00',
    end:      '11:00',
    category: 'talk_show',
    icon:     '🎙️',
  },
  {
    id:       'dominion_sports',
    name:     'Dominion Sports',
    days:     [1, 2, 3, 4, 5],      // Mon–Fri
    start:    '11:15',
    end:      '11:50',
    category: 'sports',
    icon:     '⚽',
  },
  {
    id:       'iroyin_lerefe',
    name:     'Iroyin Lerefe',
    days:     [1, 2, 3, 4, 5],      // Mon–Fri
    start:    '12:00',
    end:      '12:15',
    category: 'news',
    icon:     '📰',
  },
  {
    id:       'dominion_tv_news',
    name:     'Dominion TV News',
    days:     [1, 2, 3, 4, 5],      // Mon–Fri
    start:    '12:15',
    end:      '12:30',
    category: 'news',
    icon:     '📰',
  },
  {
    id:       'e_plus',
    name:     'E-Plus',
    days:     [1, 3, 5],             // Mon, Wed, Fri
    start:    '13:00',
    end:      '13:50',
    category: 'entertainment',
    icon:     '🎬',
  },
  {
    id:       'lojude',
    name:     'Lojude',
    days:     [1, 2, 4],             // Mon, Tue, Thu
    start:    '14:00',
    end:      '14:50',
    category: 'cultural',
    icon:     '🎭',
  },
  {
    id:       'okodoro_oselu',
    name:     'Okodoro Oselu',
    days:     [1],                   // Mon only
    start:    '15:00',
    end:      '15:50',
    category: 'political',
    icon:     '🗳️',
  },
  {
    id:       'iyo_aye',
    name:     'Iyo Aye',
    days:     [2],                   // Tue only
    start:    '15:30',
    end:      '16:25',
    category: 'talk_show',
    icon:     '🎙️',
  },
  {
    id:       'the_policescope',
    name:     'The Policescope',
    days:     [3],                   // Wed only
    start:    '18:00',
    end:      '18:50',
    category: 'documentary',
    icon:     '🔍',
  },
  {
    id:       'oke_agba',
    name:     'Oke Agba',
    days:     [4],                   // Thu only
    start:    '15:00',
    end:      '15:50',
    category: 'cultural',
    icon:     '🎭',
  },
];
