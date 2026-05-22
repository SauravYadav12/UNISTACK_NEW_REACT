/**
 * Static list of US locations the Job Boards search picker offers.
 *
 * Mirrors the server's `utils/usLocationWhitelist.ts`. Kept inline here
 * rather than fetched at runtime — the list rarely changes, and any
 * server round-trip would burn UX speed for no benefit.
 *
 * The picker shows: "Anywhere (US)" (empty string), "Remote (US)", every
 * state by name. Users can also free-type "City, ST" — the server still
 * validates against the same whitelist.
 */

export interface UsLocationOption {
  label: string;
  value: string;
}

const STATE_NAMES: string[] = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

export const US_LOCATION_OPTIONS: UsLocationOption[] = [
  { label: 'Anywhere (US)', value: '' },
  { label: 'Remote (US)', value: 'Remote' },
  ...STATE_NAMES.map((name) => ({ label: name, value: name })),
];
