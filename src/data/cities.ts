export interface City {
  id: number
  slug: string
  name_en: string
  name_me: string
}

export const MONTENEGRO_CITIES: City[] = [
  { id: 1, slug: 'podgorica', name_en: 'Podgorica', name_me: 'Podgorica' },
  { id: 2, slug: 'niksic', name_en: 'Nikšić', name_me: 'Nikšić' },
  { id: 3, slug: 'bar', name_en: 'Bar', name_me: 'Bar' },
  { id: 4, slug: 'budva', name_en: 'Budva', name_me: 'Budva' },
  { id: 5, slug: 'herceg-novi', name_en: 'Herceg Novi', name_me: 'Herceg Novi' },
  { id: 6, slug: 'kotor', name_en: 'Kotor', name_me: 'Kotor' },
  { id: 7, slug: 'tivat', name_en: 'Tivat', name_me: 'Tivat' },
  { id: 8, slug: 'cetinje', name_en: 'Cetinje', name_me: 'Cetinje' },
  { id: 9, slug: 'berane', name_en: 'Berane', name_me: 'Berane' },
  { id: 10, slug: 'bijelo-polje', name_en: 'Bijelo Polje', name_me: 'Bijelo Polje' },
  { id: 11, slug: 'pljevlja', name_en: 'Pljevlja', name_me: 'Pljevlja' },
  { id: 12, slug: 'ulcinj', name_en: 'Ulcinj', name_me: 'Ulcinj' },
  { id: 13, slug: 'kolasin', name_en: 'Kolašin', name_me: 'Kolašin' },
  { id: 14, slug: 'mojkovac', name_en: 'Mojkovac', name_me: 'Mojkovac' },
  { id: 15, slug: 'rozaje', name_en: 'Rožaje', name_me: 'Rožaje' },
  { id: 16, slug: 'plav', name_en: 'Plav', name_me: 'Plav' },
  { id: 17, slug: 'zabljak', name_en: 'Žabljak', name_me: 'Žabljak' },
  { id: 18, slug: 'andrijevica', name_en: 'Andrijevica', name_me: 'Andrijevica' },
  { id: 19, slug: 'danilovgrad', name_en: 'Danilovgrad', name_me: 'Danilovgrad' },
  { id: 20, slug: 'golubovci', name_en: 'Golubovci', name_me: 'Golubovci' },
  { id: 21, slug: 'tuzi', name_en: 'Tuzi', name_me: 'Tuzi' },
  { id: 22, slug: 'petnjica', name_en: 'Petnjica', name_me: 'Petnjica' },
  { id: 23, slug: 'gusinje', name_en: 'Gusinje', name_me: 'Gusinje' },
  { id: 24, slug: 'pluzine', name_en: 'Plužine', name_me: 'Plužine' },
  { id: 25, slug: 'savnik', name_en: 'Šavnik', name_me: 'Šavnik' }
]

export const getCityBySlug = (slug: string): City | undefined => {
  return MONTENEGRO_CITIES.find(city => city.slug === slug)
}

export const getCityById = (id: number): City | undefined => {
  return MONTENEGRO_CITIES.find(city => city.id === id)
}