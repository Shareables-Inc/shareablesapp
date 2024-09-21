import type {
  RetrieveResponse,
  SuggestionsResponse,
} from "../../types/mapbox.types";

export const dummyDataSuggestionResponse: SuggestionsResponse = {
  suggestions: [
    {
      name: "Pastable",
      mapbox_id:
        "dXJuOm1ieHBvaTphYmVjNTMxNC0yYzNkLTRjMjAtOTE1Mi1iZDA3NWIxZGY5ZmE",
      feature_type: "poi",
      address: "1927 Weston Rd",
      full_address: "1927 Weston Rd, York, M9N 1W7, Canada",
      place_formatted: "York, M9N 1W7, Canada",
      context: {
        country: {
          name: "Canada",
          country_code: "CA",
          country_code_alpha_3: "CAN",
        },
        postcode: {
          id: "dXJuOm1ieHBsYzpBUU1qVGlj",
          name: "M9N 1W7",
        },
        place: {
          id: "dXJuOm1ieHBsYzpCMzdvSnc",
          name: "York",
        },
        neighborhood: {
          id: "dXJuOm1ieHBsYzpBWmlNSnc",
          name: "Weston",
        },
        address: {
          name: "1927 Weston Rd",
          address_number: "1927",
          street_name: "weston rd",
        },
        street: {
          name: "weston rd",
        },
      },
      language: "en",
      maki: "restaurant",
      poi_category: [
        "food",
        "food and drink",
        "italian restaurant",
        "restaurant",
      ],
      poi_category_ids: [
        "food",
        "food_and_drink",
        "italian_restaurant",
        "restaurant",
      ],
      external_ids: {
        safegraph: "22x-223@665-z6r-yvz",
        foursquare: "62f7e8f9cbe3ef57334243e3",
      },
      metadata: {},
      operational_status: "active",
    },
    {
      name: "Pug's Passable Products",
      mapbox_id:
        "dXJuOm1ieHBvaTowMmQ3OWMwMS1iZDJlLTQ0ZDMtYjQ4OS1mMTRmMmU1ZWRmOTI",
      feature_type: "poi",
      address: "112 E Pecan St #360a",
      full_address:
        "112 E Pecan St #360a, San Antonio, Texas 78205, United States",
      place_formatted: "San Antonio, Texas 78205, United States",
      context: {
        country: {
          name: "United States",
          country_code: "US",
          country_code_alpha_3: "USA",
        },
        region: {
          name: "Texas",
          region_code: "TX",
          region_code_full: "US-TX",
        },
        postcode: {
          id: "dXJuOm1ieHBsYzpFQnl1N0E",
          name: "78205",
        },
        place: {
          id: "dXJuOm1ieHBsYzpFVndvN0E",
          name: "San Antonio",
        },
        neighborhood: {
          id: "dXJuOm1ieHBsYzpDZ2RNN0E",
          name: "Downtown",
        },
        address: {
          name: "112 E Pecan St #360a",
          address_number: "112",
          street_name: "e pecan st #360a",
        },
        street: {
          name: "e pecan st #360a",
        },
      },
      language: "en",
      maki: "marker",
      poi_category: ["stationery", "shopping"],
      poi_category_ids: ["paper_goods_store", "shopping"],
      external_ids: {
        dataplor: "42866db1-bcf6-46d7-a815-1f587d33941a",
      },
      metadata: {},
      operational_status: "active",
    },
    {
      name: "Pastaleria de Rita",
      mapbox_id:
        "dXJuOm1ieHBvaTpjY2Q3NmViNS1kZmM5LTRiYjUtYmU2My03MDdiMzhlNDhkNzI",
      feature_type: "poi",
      address: "Vanilla Dreams",
      full_address: "Vanilla Dreams, Toronto, M6K 1S3, Canada",
      place_formatted: "Toronto, M6K 1S3, Canada",
      context: {
        country: {
          name: "Canada",
          country_code: "CA",
          country_code_alpha_3: "CAN",
        },
        postcode: {
          id: "dXJuOm1ieHBsYzovZjFPSnc",
          name: "M6K 1S3",
        },
        place: {
          id: "dXJuOm1ieHBsYzpCTTlJSnc",
          name: "Toronto",
        },
        neighborhood: {
          id: "dXJuOm1ieHBsYzpMRXdu",
          name: "Brockton Village",
        },
      },
      language: "en",
      maki: "bakery",
      poi_category: ["confectionary", "food", "food and drink"],
      poi_category_ids: ["dessert_shop", "food", "food_and_drink"],
      external_ids: {
        foursquare: "4d25345e1d9fa1cd30253e09",
      },
      metadata: {},
      operational_status: "closed",
    },
    {
      name: "Plage de Passable",
      mapbox_id:
        "dXJuOm1ieHBvaTpmNmUxY2FmZC05ZGQ1LTQwMWQtODQxOS1iOGJkMjc1NjM3YTE",
      feature_type: "poi",
      address: "Chemin Passable",
      full_address: "Chemin Passable, 06230 Saint-Jean-Cap-Ferrat, France",
      place_formatted: "06230 Saint-Jean-Cap-Ferrat, France",
      context: {
        country: {
          name: "France",
          country_code: "FR",
          country_code_alpha_3: "FRA",
        },
        postcode: {
          id: "dXJuOm1ieHBsYzpJSTVO",
          name: "06230",
        },
        place: {
          id: "dXJuOm1ieHBsYzpEWEJvVFE",
          name: "Saint-Jean-Cap-Ferrat",
        },
        street: {
          name: "chemin passable",
        },
      },
      language: "en",
      maki: "cinema",
      poi_category: ["entertainment", "theme park"],
      poi_category_ids: ["entertainment", "theme_park"],
      external_ids: {
        foursquare: "4dd150f845ddbe15f8cd7001",
        safegraph: "zzy-222@7fb-8sy-835",
      },
      metadata: {},
      operational_status: "active",
    },
    {
      name: "Pastabella",
      mapbox_id:
        "dXJuOm1ieHBvaTpkNTA2ODI1OS1mNjViLTQxNWUtOGM1My0wOGJlMWRkYTMwNDk",
      feature_type: "poi",
      address: "Düvenciler Lisesi Karşısı",
      full_address: "Düvenciler Lisesi Karşısı, 39750 Lüleburgaz, Türkiye",
      place_formatted: "39750 Lüleburgaz, Türkiye",
      context: {
        country: {
          name: "Türkiye",
          country_code: "TR",
          country_code_alpha_3: "TUR",
        },
        postcode: {
          id: "dXJuOm1ieHBsYzp3bzdr",
          name: "39750",
        },
        place: {
          id: "dXJuOm1ieHBsYzpaRWpr",
          name: "Lüleburgaz",
        },
        street: {
          name: "karşısı",
        },
      },
      language: "en",
      maki: "bakery",
      poi_category: ["confectionary", "food", "food and drink"],
      poi_category_ids: ["dessert_shop", "food", "food_and_drink"],
      external_ids: {
        foursquare: "51b58ace498efdec35ea7dd0",
      },
      metadata: {},
      operational_status: "active",
    },
  ],
  attribution:
    "© 2024 Mapbox and its suppliers. All rights reserved. Use of this data...",
  response_id: "1234567890",
  url: "https://api.mapbox.com/search/searchbox/v1/suggestions?session_token=1234567890&access_token=1234567890&limit=5&types=poi&query=pastable",
};

export const dummyDataRetrieveResponse: RetrieveResponse = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        coordinates: [-79.517206, 43.700542],
        type: "Point",
      },
      properties: {
        name: "Pastable",
        mapbox_id:
          "dXJuOm1ieHBvaTphYmVjNTMxNC0yYzNkLTRjMjAtOTE1Mi1iZDA3NWIxZGY5ZmE",
        feature_type: "poi",
        address: "1927 Weston Rd",
        full_address: "1927 Weston Rd, York, M9N 1W7, Canada",
        place_formatted: "York, M9N 1W7, Canada",
        context: {
          country: {
            name: "Canada",
            country_code: "CA",
            country_code_alpha_3: "CAN",
          },
          postcode: {
            id: "dXJuOm1ieHBsYzpBUU1qVGlj",
            name: "M9N 1W7",
          },
          place: {
            id: "dXJuOm1ieHBsYzpCMzdvSnc",
            name: "York",
          },
          locality: {
            id: "dXJuOm1ieHBsYzpCbmZxSnc",
            name: "York - Crosstown",
          },
          neighborhood: {
            id: "dXJuOm1ieHBsYzpBWmlNSnc",
            name: "Weston",
          },
          address: {
            name: "1927 Weston Rd",
            address_number: "1927",
            street_name: "weston rd",
          },
          street: {
            name: "weston rd",
          },
        },
        coordinates: {
          latitude: 43.700542,
          longitude: -79.517206,
          routable_points: [
            {
              name: "default",
              latitude: 43.700463312926175,
              longitude: -79.51722778342722,
            },
          ],
        },
        language: "en",
        maki: "restaurant",
        poi_category: [
          "food",
          "food and drink",
          "italian restaurant",
          "restaurant",
        ],
        poi_category_ids: [
          "food",
          "food_and_drink",
          "italian_restaurant",
          "restaurant",
        ],
        external_ids: {
          foursquare: "62f7e8f9cbe3ef57334243e3",
          safegraph: "22x-223@665-z6r-yvz",
        },
        metadata: {},
        operational_status: "active",
      },
    },
  ],
  attribution:
    "© 2024 Mapbox and its suppliers. All rights reserved. Use of this data...",
  url: "https://api.mapbox.com/search/searchbox/v1/retrieve/dXJuOm1ieHBv...",
};
