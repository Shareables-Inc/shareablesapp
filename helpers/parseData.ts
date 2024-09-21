import { Establishment } from "../models/establishment";

{
    "attribution": "© 2024 Mapbox and its suppliers. All rights reserved. Use of this data is subject to the Mapbox Terms of Service. (https://www.mapbox.com/about/maps/)",
    "response_id": "dvCsu_xXi66rMTotPSVuv-BpZZ9hSm0IUTDrnXFEl9dA61bL3vZAXzZgZvc291lgoDdBeQv4RiSQz_iaaNO10zojr85c57-X_1wx",
    "suggestions": [
      {
        "address": "562 Lakeshore Rd E",
        "context": "[Object]",
        "external_ids": "[Object]",
        "feature_type": "poi",
        "full_address": "562 Lakeshore Rd E, Mississauga, L5G 1J3, Canada",
        "language": "en",
        "maki": "restaurant",
        "mapbox_id": "dXJuOm1ieHBvaTphYzMyMzY4YS0wMjMyLTQwN2YtYjgyMS0wMzMwNTliYzQ0OTY",
        "metadata": "[Object]",
        "name": "Pasta Night",
        "place_formatted": "Mississauga, L5G 1J3, Canada",
        "poi_category": "[Array]",
        "poi_category_ids": "[Array]"
      },
      {
        "address": "1 Benvenuto Pl",
        "context": "[Object]",
        "external_ids": "[Object]",
        "feature_type": "poi",
        "full_address": "1 Benvenuto Pl, Toronto, M4V 2L1, Canada",
        "language": "en",
        "maki": "restaurant",
        "mapbox_id": "dXJuOm1ieHBvaTo1NTFmMTM1MC0xNWZjLTQxYWUtODZhOS1hMjZhZGNkNGIzN2I",
        "metadata": "[Object]",
        "name": "Scaramouche Restaurant Pasta Bar & Grill",
        "place_formatted": "Toronto, M4V 2L1, Canada",
        "poi_category": "[Array]",
        "poi_category_ids": "[Array]"
      },
      {
        "address": "270 the Kingsway",
        "context": "[Object]",
        "external_ids": "[Object]",
        "feature_type": "poi",
        "full_address": "270 the Kingsway, Etobicoke, M9A 3A8, Canada",
        "language": "en",
        "maki": "restaurant",
        "mapbox_id": "dXJuOm1ieHBvaTpmNmRhMzZiMy03ZWY4LTQ1NTYtODE2Yy1jYzk2NTZiZGU3YjI",
        "metadata": "[Object]",
        "name": "Pasta International",
        "place_formatted": "Etobicoke, M9A 3A8, Canada",
        "poi_category": "[Array]",
        "poi_category_ids": "[Array]"
      },
      {
        "address": "595 College St",
        "context": "[Object]",
        "external_ids": "[Object]",
        "feature_type": "poi",
        "full_address": "595 College St, Toronto, M6G 1B2, Canada",
        "language": "en",
        "maki": "restaurant",
        "mapbox_id": "dXJuOm1ieHBvaToxNzViODc0ZC02MmVhLTRlZDQtODhhOS02ZWM0ZjE4NmU2MmQ",
        "metadata": "[Object]",
        "name": "Sottovoce Wine & Pasta Bar",
        "name_preferred": "Sotto Voce Wine & Pasta Bar",
        "place_formatted": "Toronto, M6G 1B2, Canada",
        "poi_category": "[Array]",
        "poi_category_ids": "[Array]"
      },
      {
        "context": "[Object]",
        "feature_type": "street",
        "language": "en",
        "maki": "marker",
        "mapbox_id": "dXJuOm1ieGFkci1zdHI6YTdmMDNlMTMtMDU0NS00ODY5LThkOTctNjY1MmQ3NjNjNjY0",
        "metadata": "[Object]",
        "name": "Asta Drive",
        "place_formatted": "Mississauga, Ontario L5A 2T6, Canada"
      }
    ]
  }


const parseMapboxSuggestion = (suggestion: MapboxSuggestionItem) => {
  // map suggestion item to establishment type
  const establishment: Establishment = {
    mapboxId: suggestion.mapbox_id,
    name: suggestion.name,
    address: suggestion.address,
    city: suggestion.city,
    country: suggestion.country,
    postal_code: suggestion.postal_code,
    province: suggestion.province,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,

  };

  return establishment;
};
