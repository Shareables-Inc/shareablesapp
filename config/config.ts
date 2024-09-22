const SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1/suggest";

const ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

const RETRIEVE_URL = "https://api.mapbox.com/search/searchbox/v1/retrieve";

const PERMANENT_GEOCODING_URL =
  "https://api.mapbox.com/search/geocode/v6/reverse";

export { SEARCH_URL, ACCESS_TOKEN, RETRIEVE_URL, PERMANENT_GEOCODING_URL };
