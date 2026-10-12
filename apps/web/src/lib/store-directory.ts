"use client";

import { useResource } from "./api";
import { useMemo } from "react";
import { storeLocations, type StoreLocation } from "./store-locations";

type StoredLocation = {
  id: number;
  name: string;
  address: string;
  short_address: string;
  city: string;
  latitude: number;
  longitude: number;
};
export function useStoreDirectory(): StoreLocation[] {
  const { data } = useResource<StoredLocation[]>("/stores");
  return useMemo(
    () =>
      data
        ? data.map((store) => ({ ...store, shortAddress: store.short_address }))
        : storeLocations,
    [data],
  );
}
