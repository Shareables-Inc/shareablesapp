type Country = {
  name: string;
  country_code: string;
  country_code_alpha_3: string;
};

type Postcode = {
  id: string;
  name: string;
};

type Place = {
  id: string;
  name: string;
};

type Neighborhood = {
  id: string;
  name: string;
};

type Address = {
  name: string;
  address_number?: string;
  street_name: string;
};

type Street = {
  name: string;
};

type Context = {
  country: Country;
  postcode: Postcode;
  place: Place;
  neighborhood?: Neighborhood;
  address?: Address;
  street?: Street;
  region?: {
    name: string;
    region_code: string;
    region_code_full: string;
  };
  locality?: Locality;
};

type ExternalIds = {
  safegraph?: string;
  foursquare?: string;
  dataplor?: string;
};

export type Suggestion = {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address: string;
  full_address: string;
  city: string;
  country: string;
  place_formatted: string;
  context: Context;
  language: string;
  maki: string;
  poi_category: string[];
  poi_category_ids: string[];
  external_ids: ExternalIds;
  metadata: Record<string, unknown>;
  operational_status: string;
};

export type SuggestionsResponse = {
  suggestions: Suggestion[];
  attribution: string;
  response_id: string;
  url: string;
};

type Locality = {
  id: string;
  name: string;
};

type RoutablePoint = {
  name: string;
  latitude: number;
  longitude: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
  routable_points: RoutablePoint[];
};

type Properties = {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address: string;
  full_address: string;
  city: string;
  country: string;
  place_formatted: string;
  context: Context;
  coordinates: Coordinates;
  language: string;
  maki: string;
  poi_category: string[];
  poi_category_ids: string[];
  external_ids: ExternalIds;
  metadata: Record<string, unknown>;
  operational_status: string;
};

type Geometry = {
  type: string;
  coordinates: [number, number];
};

type Feature = {
  type: string;
  geometry: Geometry;
  properties: Properties;
};

export type RetrieveResponse = {
  type: string;
  features: Feature[];
  attribution: string;
  url: string;
};
