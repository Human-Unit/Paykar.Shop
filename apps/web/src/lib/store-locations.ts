export type StoreLocation = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

/**
 * Storefront network snapshot based on the supermarkets published by Paykar Shop.
 * Keep addresses and map positions in one canonical frontend dataset so the
 * homepage network map and future store-directory UI cannot drift apart.
 */
export const storeLocations: StoreLocation[] = [
  {
    id: 1,
    name: "Пайкар 1",
    address: "ул. Айни 16б",
    latitude: 38.562512,
    longitude: 68.791511,
  },
  {
    id: 2,
    name: "Пайкар 2",
    address: "ул. Бухоро 27",
    latitude: 38.56845,
    longitude: 68.786229,
  },
  {
    id: 3,
    name: "Пайкар 3",
    address: "ул. Яккачинор 148",
    latitude: 38.567245,
    longitude: 68.755381,
  },
  {
    id: 4,
    name: "Пайкар 4",
    address: "ул. Айни 57",
    latitude: 38.563584,
    longitude: 68.80999,
  },
  {
    id: 5,
    name: "Пайкар 5",
    address: "пр. Рудаки 66",
    latitude: 38.579079,
    longitude: 68.78781,
  },
  {
    id: 6,
    name: "Пайкар 6",
    address: "ул. Бободжон Гафуров 10/б, 112 мкр.",
    latitude: 38.589605,
    longitude: 68.740783,
  },
  {
    id: 7,
    name: "Пайкар 7",
    address: "ул. Борбад 101",
    latitude: 38.5263,
    longitude: 68.748033,
  },
  {
    id: 8,
    name: "Пайкар 8",
    address: "ул. С. Носира 25",
    latitude: 38.594824,
    longitude: 68.782061,
  },
];
