import {
  SEARCH_URL,
  ACCESS_TOKEN,
  RETRIEVE_URL,
  PERMANENT_GEOCODING_URL,
} from "../config/config";
import { SuggestionsResponse, RetrieveResponse } from "../types/mapbox.types";
interface SuggestedSearchParams {
  query: string;
  sessionToken: string;
  language?: string;
  city?: string;
  country?: string;
  poiCategory?: string[];
  origin?: string;
  types?: string[];
  limit?: number;
  proximity: string | null;
}

export const suggestedSearch = async ({
  query,
  sessionToken,
  language = "en",
  country = "ca",
  poiCategory = ["food_and_drink", "restaurant", "bar"],
  types = ["place", "poi"],
  origin,
  limit = 5,
  proximity,
}: SuggestedSearchParams): Promise<SuggestionsResponse> => {
  const params = new URLSearchParams({
    q: query,
    language,
    country,
    poi_category: poiCategory.join(","),
    types: types.join(","),
    session_token: sessionToken,
    access_token: ACCESS_TOKEN ?? "",
    limit: limit.toString(),
  });

  if (proximity !== null) {
    params.append("proximity", proximity);
  }

  const response = await fetch(`${SEARCH_URL}?${params}`);
  const data = await response.json();
  return data;
};

export const retrieveSearchResults = async (
  mapBoxId: string,
  sessionToken: string
) => {
  const response = await fetch(
    `${SEARCH_URL}${mapBoxId}?access_token=${ACCESS_TOKEN}&session_token=${sessionToken}`
  );
  const data = await response.json();

  return data;
};

export const retrieveSearchResult = async (
  mapboxId: string,
  sessionToken: string
): Promise<RetrieveResponse> => {
  const params = new URLSearchParams({
    session_token: sessionToken,
    access_token: ACCESS_TOKEN ?? "",
  });

  const response = await fetch(`${RETRIEVE_URL}/${mapboxId}?${params}`);
  if (!response.ok) throw new Error("Failed to retrieve search result");
  return response.json();
};

export const permanentGeocodingSearch = async (
  longitude: number,
  latitude: number,
  permanent: boolean
) => {
  const params = new URLSearchParams({
    access_token: ACCESS_TOKEN ?? "",
    longitude: longitude.toString(),
    latitude: latitude.toString(),
    permanent: permanent.toString(),
  });

  const response = await fetch(`${PERMANENT_GEOCODING_URL}?${params}`);
  const data = await response.json();
  return data;
};
