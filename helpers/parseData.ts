import { serverTimestamp } from "firebase/firestore";
import { Establishment } from "../models/establishment";
import { RetrieveResponse } from "../types/mapbox.types";

export const mapRetrieveResponseToEstablishment = (
  retrievedSuggestion: RetrieveResponse
) => {
  // correctly map the retrieve response to an establishment
  const establishment: Establishment = {
    id: "",
    name: retrievedSuggestion.features[0].properties.name,
    address: retrievedSuggestion.features[0].properties.address,
    city: retrievedSuggestion.features[0].properties.context.place.name,
    country: retrievedSuggestion.features[0].properties.context.country.name,
    latitude: retrievedSuggestion.features[0].geometry.coordinates[1],
    longitude: retrievedSuggestion.features[0].geometry.coordinates[0],
    mapboxId: retrievedSuggestion.features[0].properties.mapbox_id,
    postal_code:
      retrievedSuggestion.features[0].properties.context.postcode.name,
    status: "",
    website: "",
    tags: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    averageRating: "0",
    postCount: 0,
  };

  return establishment;
};
