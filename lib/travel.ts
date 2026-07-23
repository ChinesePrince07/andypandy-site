import { unstable_cache } from "next/cache";
import { r2GetText, r2Put } from "./r2-storage";

const TRAVEL_KEY = "content/travel.json";

/** A restaurant you ate at or a hotel you stayed in. */
export interface Place {
  name: string;
  /** For restaurants: the dish(es) you had. */
  dish?: string;
  /** Photo of the place (uploaded or pasted URL). */
  image?: string;
  /** Free-form note / quick rating. */
  note?: string;
  /** Maps or website link. */
  url?: string;
}

export interface TravelDay {
  id: string;
  /** ISO date, e.g. "2025-07-09". */
  date: string;
  /** Short headline for the day. */
  title?: string;
  /** What you did / where you went. */
  notes?: string;
  /** Where you stayed that night. */
  hotel?: Place;
  /** What you ate. */
  restaurants: Place[];
  /** Your own uploaded photos (URLs). */
  photos: string[];
}

export interface Trip {
  id: string;
  title: string;
  location: string;
  /** ISO date the trip started. */
  startDate: string;
  /** ISO date the trip ended (optional for single-day trips). */
  endDate?: string;
  /** Hero / cover image URL. */
  cover?: string;
  /** Short blurb about the trip. */
  summary?: string;
  days: TravelDay[];
}

export interface TravelData {
  trips: Trip[];
}

const defaultTravel: TravelData = {
  trips: [
    {
      id: "seoul-2026",
      title: "Seoul",
      location: "Seoul, South Korea",
      startDate: "2026-06-20",
      endDate: "2026-06-23",
      cover: "",
      summary:
        "Three and a half days based in Myeongdong — palace lanes, Seoul's design districts, Han River views, and a very deliberate amount of Korean barbecue.",
      days: [
        {
          id: "seoul-2026-06-20",
          date: "2026-06-20",
          title: "Arrival and the Seoul skyline",
          notes:
            "HX628 landed at Incheon at 13:35. After checking in, the plan runs through Shinsegae's Myeongdong flagship and the street-food lanes before taking the cable car up Namsan for sunset. Cheonggyecheon and Gwangjang Market are easy lower-key alternatives if arrival takes longer.",
          hotel: {
            name: "Lotte City Hotel Myeongdong",
            note: "Our base in central Seoul.",
          },
          restaurants: [
            {
              name: "Myeongdong street food",
              dish: "Gyeran-ppang, tteokbokki, and hotteok",
              note: "A first lap through the neighbourhood's food stalls.",
            },
            {
              name: "Myeongdong Kyoja",
              dish: "Kalguksu and mandu",
              note: "A fast, comforting first-night institution.",
            },
          ],
          photos: [],
        },
        {
          id: "seoul-2026-06-21",
          date: "2026-06-21",
          title: "Seongsu, Hannam, and hanwoo",
          notes:
            "Start slowly in Seoul Forest, then spend the day among Seongsu's cafés, fashion shops, pop-ups, and KWANGYA before moving to the quieter design courtyards of Hannam. Finish with sunset from Haebangchon and a charcoal-grilled hanwoo dinner overlooking the Han River.",
          hotel: {
            name: "Lotte City Hotel Myeongdong",
            note: "Second night in Myeongdong.",
          },
          restaurants: [
            {
              name: "lowide or Center Coffee",
              dish: "Coffee, salt bread, and cream pastries",
              note: "A Seongsu coffee stop after Seoul Forest.",
            },
            {
              name: "Myeongwolgwan",
              dish: "1++ hanwoo and marinated beef ribs",
              note: "Vista Walkerhill's garden-side charcoal grill.",
            },
          ],
          photos: [],
        },
        {
          id: "seoul-2026-06-22",
          date: "2026-06-22",
          title: "Old Seoul and the Golden Pig",
          notes:
            "Queue early in Sindang for lunch, then cross the hanok lanes of Bukchon and Samcheong-dong, browse the small shops of Seochon, and reach Gyeongbokgung in the late afternoon. The palace is deliberately on Monday because it closes on Tuesday. Cafés, galleries, and museums provide the rain plan.",
          hotel: {
            name: "Lotte City Hotel Myeongdong",
            note: "Final night in Seoul.",
          },
          restaurants: [
            {
              name: "Geumdwaeji Sikdang",
              dish: "Bone-in pork belly, pork neck, and kimchi stew",
              note: "A Michelin Bib Gourmand lunch; arrive early to join the queue.",
            },
            {
              name: "MishMash",
              dish: "Modern Korean tasting dishes",
              note: "A hanok dinner overlooking Changdeokgung.",
            },
          ],
          photos: [],
        },
        {
          id: "seoul-2026-06-23",
          date: "2026-06-23",
          title: "The Hyundai, then Seoul → Tokyo",
          notes:
            "Spend the last morning at The Hyundai Seoul in Yeouido, including its indoor garden, rotating pop-ups, and basement fashion floor. Collect the bags after lunch and leave for Gimpo around 17:00 for ANA NH868 to Haneda at 19:55.",
          restaurants: [
            {
              name: "The Hyundai Seoul food hall",
              dish: "A quick final lunch in the basement food hall",
              note: "Keeps the last shopping day relaxed before the airport.",
            },
          ],
          photos: [],
        },
      ],
    },
    {
      id: "tokyo-2026",
      title: "Tokyo",
      location: "Tokyo, Japan",
      startDate: "2026-06-23",
      endDate: "2026-06-26",
      cover: "",
      summary:
        "Three nights in Ginza — an in-room onsen, old Tokyo, barefoot digital art, Harajuku and Shibuya, then one last breakfast before the next flight.",
      days: [
        {
          id: "tokyo-2026-06-23",
          date: "2026-06-23",
          title: "Late arrival, onsen, sleep",
          notes:
            "NH868 reaches Haneda at 22:15. Go straight to Ginza, check in around 23:15, and let the room's Atami-fed onsen be the entire evening.",
          hotel: {
            name: "FUFU Tokyo Ginza",
            note: "A sky-high Ginza ryokan with a private onsen in every suite.",
          },
          restaurants: [],
          photos: [],
        },
        {
          id: "tokyo-2026-06-24",
          date: "2026-06-24",
          title: "Old Tokyo, then water and light",
          notes:
            "Walk Senso-ji and Nakamise before the crowds, continue to Tokyo Skytree and Solamachi, then return through Ginza for Itoya, Ginza Six, and the flagship stores. Rest at FUFU before an evening barefoot inside teamLab Planets in Toyosu. Tsukiji is the food-first morning alternative.",
          hotel: {
            name: "FUFU Tokyo Ginza",
            note: "Return for the room onsen or Yusora rooftop footbath.",
          },
          restaurants: [
            {
              name: "Asakusa or Toyosu lunch",
              dish: "Tempura, unagi, or market sushi",
              note: "Choose the stop that best fits the morning pace.",
            },
            {
              name: "Toyosu or Ginza dinner",
              dish: "Sushi or yakiniku",
              note: "Dinner after teamLab, either nearby or back by the hotel.",
            },
          ],
          photos: [],
        },
        {
          id: "tokyo-2026-06-25",
          date: "2026-06-25",
          title: "Harajuku, Shibuya, and the city above",
          notes:
            "Begin under the trees at Meiji Shrine, split an hour between Omotesando and Takeshita Street, then move through Shibuya Crossing, PARCO, and Miyashita Park. Time Shibuya Sky for sunset. Daikanyama is the quieter design-minded detour.",
          hotel: {
            name: "FUFU Tokyo Ginza",
            note: "Final night in Tokyo.",
          },
          restaurants: [
            {
              name: "Omotesando lunch",
              dish: "Tonkatsu or a modern café lunch",
              note: "A flexible stop between Harajuku and Shibuya.",
            },
            {
              name: "Sushi Ginga or Ginza Gayu",
              dish: "Eight-seat sushi or private kaiseki",
              note: "The quiet hotel dinner alternative to a lively Shibuya meal.",
            },
          ],
          photos: [],
        },
        {
          id: "tokyo-2026-06-26",
          date: "2026-06-26",
          title: "A final Ginza morning",
          notes:
            "Start with a slow breakfast at the hotel, browse the basement food halls at Matsuya, Mitsukoshi, or Ginza Six for snacks and gifts, then check out at 11:00. The Imperial Palace East Gardens are the quiet alternative if the flight leaves later.",
          restaurants: [
            {
              name: "Ginza Gayu",
              dish: "Kaiseki breakfast",
              note: "A final breakfast in FUFU's private dining room.",
            },
          ],
          photos: [],
        },
      ],
    },
  ],
};

const loadTravel = unstable_cache(
  async (): Promise<TravelData> => {
    try {
      const text = await r2GetText(TRAVEL_KEY);
      if (!text) return defaultTravel;
      const parsed = JSON.parse(text) as TravelData;
      // Be tolerant of partially-shaped data saved by older editors.
      return { trips: Array.isArray(parsed.trips) ? parsed.trips : [] };
    } catch {
      return defaultTravel;
    }
  },
  ["travel-data"],
  { tags: ["travel"], revalidate: 60 },
);

export async function getTravelData(): Promise<TravelData> {
  return loadTravel();
}

export async function saveTravelData(data: TravelData): Promise<void> {
  await r2Put(
    TRAVEL_KEY,
    JSON.stringify(data, null, 2),
    "application/json; charset=utf-8",
  );
}

/** Newest-trip-first, for display. Sorts on a copy. */
export function sortedTrips(data: TravelData): Trip[] {
  return [...data.trips].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  );
}

/** Aggregate stats for the page header. */
export function travelStats(data: TravelData) {
  let restaurants = 0;
  let photos = 0;
  let days = 0;
  const places = new Set<string>();
  for (const trip of data.trips) {
    if (trip.location) places.add(trip.location.trim().toLowerCase());
    for (const day of trip.days) {
      days += 1;
      restaurants += day.restaurants?.length ?? 0;
      photos += day.photos?.length ?? 0;
    }
  }
  return {
    trips: data.trips.length,
    days,
    restaurants,
    photos,
    places: places.size,
  };
}
