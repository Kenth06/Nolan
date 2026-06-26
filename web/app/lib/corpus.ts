/** The 12 Christopher Nolan-directed films in scope. {film, year, dp} drive result filtering. */
export interface Film {
  slug: string;
  title: string;
  year: number;
  dp: string;
}

export const FILMS: Film[] = [
  { slug: "following", title: "Following", year: 1998, dp: "Wally Pfister" },
  { slug: "memento", title: "Memento", year: 2000, dp: "Wally Pfister" },
  { slug: "insomnia", title: "Insomnia", year: 2002, dp: "Wally Pfister" },
  { slug: "batman-begins", title: "Batman Begins", year: 2005, dp: "Wally Pfister" },
  { slug: "the-prestige", title: "The Prestige", year: 2006, dp: "Wally Pfister" },
  { slug: "the-dark-knight", title: "The Dark Knight", year: 2008, dp: "Wally Pfister" },
  { slug: "inception", title: "Inception", year: 2010, dp: "Wally Pfister" },
  { slug: "the-dark-knight-rises", title: "The Dark Knight Rises", year: 2012, dp: "Wally Pfister" },
  { slug: "interstellar", title: "Interstellar", year: 2014, dp: "Hoyte van Hoytema" },
  { slug: "dunkirk", title: "Dunkirk", year: 2017, dp: "Hoyte van Hoytema" },
  { slug: "tenet", title: "Tenet", year: 2020, dp: "Hoyte van Hoytema" },
  { slug: "oppenheimer", title: "Oppenheimer", year: 2023, dp: "Hoyte van Hoytema" },
];

export const FILM_BY_SLUG: Record<string, Film> = Object.fromEntries(
  FILMS.map((f) => [f.slug, f]),
);

export const DPS = ["Wally Pfister", "Hoyte van Hoytema"] as const;
