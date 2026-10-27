// Location data for the Location filter. Postings list places as
// "City, ST", a full state name, or a short alias like "NYC" or "SF".

export const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

// Aliases the data uses instead of "City, ST".
const CITY_ALIASES = {
  NYC: "NY",
  SF: "CA",
  "South SF": "CA",
  LA: "CA",
};

export const METRO_AREAS = [
  {
    id: "bay-area",
    name: "San Francisco Bay Area",
    places: [
      "SF", "South SF", "San Francisco, CA", "San Jose, CA", "Palo Alto, CA", "Santa Clara, CA",
      "Mountain View, CA", "Sunnyvale, CA", "Menlo Park, CA", "Redwood City, CA", "San Mateo, CA",
      "Cupertino, CA", "Fremont, CA", "Milpitas, CA", "Oakland, CA", "Berkeley, CA",
      "Emeryville, CA", "Foster City, CA", "San Bruno, CA", "Los Gatos, CA", "Pleasanton, CA",
      "Burlingame, CA", "San Carlos, CA", "Newark, CA", "Hayward, CA",
    ],
  },
  {
    id: "nyc",
    name: "New York City area",
    places: ["NYC", "New York, NY", "Brooklyn, NY", "Jersey City, NJ", "Hoboken, NJ", "Newark, NJ", "Stamford, CT"],
  },
  {
    id: "chicagoland",
    name: "Chicagoland",
    places: [
      "Chicago, IL", "Evanston, IL", "Skokie, IL", "Niles, IL", "Glenview, IL", "Northbrook, IL",
      "Northfield, IL", "Deerfield, IL", "Lincolnshire, IL", "Libertyville, IL", "Waukegan, IL",
      "North Chicago, IL", "Rosemont, IL", "Schaumburg, IL", "Hoffman Estates, IL",
      "Rolling Meadows, IL", "Elgin, IL", "Cary, IL", "Addison, IL", "Oak Brook, IL",
      "Oakbrook Terrace, IL", "Lombard, IL", "Downers Grove, IL", "Lisle, IL", "Naperville, IL",
      "North Aurora, IL", "Aurora, IL", "Westchester, IL", "Lemont, IL", "Itasca, IL",
      "Des Plaines, IL", "Park Ridge, IL", "Oak Brook Terrace, IL", "Riverwoods, IL",
    ],
  },
  {
    id: "seattle",
    name: "Seattle area",
    places: ["Seattle, WA", "Bellevue, WA", "Redmond, WA", "Kirkland, WA", "Bothell, WA", "Everett, WA", "Tacoma, WA"],
  },
  {
    id: "boston",
    name: "Boston area",
    places: [
      "Boston, MA", "Cambridge, MA", "Somerville, MA", "Waltham, MA", "Burlington, MA",
      "Lexington, MA", "Bedford, MA", "Woburn, MA", "Needham, MA", "Quincy, MA", "Marlborough, MA",
    ],
  },
  {
    id: "los-angeles",
    name: "Los Angeles area",
    places: [
      "LA", "Los Angeles, CA", "Santa Monica, CA", "Culver City, CA", "El Segundo, CA",
      "Pasadena, CA", "Burbank, CA", "Long Beach, CA", "Torrance, CA", "Hawthorne, CA",
      "Irvine, CA", "Costa Mesa, CA", "Playa Vista, CA",
    ],
  },
  {
    id: "austin",
    name: "Austin area",
    places: ["Austin, TX", "Round Rock, TX"],
  },
  {
    id: "dallas",
    name: "Dallas–Fort Worth",
    places: [
      "Dallas, TX", "Fort Worth, TX", "Richardson, TX", "Plano, TX", "Irving, TX", "Frisco, TX",
      "Addison, TX", "Arlington, TX",
    ],
  },
  {
    id: "dc",
    name: "Washington, DC area",
    places: [
      "Washington, DC", "Arlington, VA", "Alexandria, VA", "McLean, VA", "Reston, VA",
      "Herndon, VA", "Tysons, VA", "Chantilly, VA", "Fairfax, VA", "Bethesda, MD", "Rockville, MD",
    ],
  },
  {
    id: "atlanta",
    name: "Atlanta area",
    places: ["Atlanta, GA", "Alpharetta, GA", "Marietta, GA", "Duluth, GA"],
  },
];

const STATE_CODES_BY_NAME = Object.fromEntries(Object.entries(STATE_NAMES).map(([code, name]) => [name, code]));
const METRO_IDS_BY_PLACE = new Map(
  METRO_AREAS.flatMap((metro) => metro.places.map((place) => [place, metro.id])),
);

/** Returns the two-letter US state code for a location string, or null if it isn't in a US state. */
export function stateCodeOf(location) {
  const code = location.match(/, ([A-Z]{2})$/)?.[1];
  if (code && code in STATE_NAMES) return code;
  return CITY_ALIASES[location] ?? STATE_CODES_BY_NAME[location] ?? null;
}

/** Returns the metro area id for a location string, or null if it isn't in one of METRO_AREAS. */
export function metroIdOf(location) {
  return METRO_IDS_BY_PLACE.get(location) ?? null;
}

export function isRemoteUs(location) {
  return /^Remote in (USA|US)$/.test(location);
}
