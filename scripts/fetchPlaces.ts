import axios from 'axios';
import * as admin from 'firebase-admin';
import { initializeApp, credential, ServiceAccount } from 'firebase-admin';
import * as serviceAccount from './path/to/your-service-account-file.json'; // Update the path to your service account JSON file

// Initialize Firebase Admin SDK
initializeApp({
  credential: credential.cert(serviceAccount as ServiceAccount),
  databaseURL: "https://shareablesapp-b7366.firebaseio.com" // Replace with your Firebase database URL
});

const db = admin.firestore();

// Your Google Places API key
const API_KEY = 'AIzaSyBTF0pS16rwgqYYVBRiyq0rJ0mCUlbwYiI';

// The types of places you want to fetch
const types = ['restaurant', 'cafe', 'bar', 'bakery', 'night_club'];

// The cities you want to fetch places from
const cities = ['Toronto', 'Vancouver', 'Montreal', 'Edmonton', 'Ottawa', 'Calgary'];

interface Place {
  place_id: string;
  formatted_address: string;
  name: string;
  rating: number;
  price_level: number;
  business_status: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  }
  opening_hours?: {
    weekday_text: string[];
  }
  website?: string;
}

// Function to parse restaurant information
const parseRestaurantInfo = (description: string) => {
  const parts = description.split(',');
  const name = parts[0].trim();
  const city = parts.length > 2 ? parts[parts.length - 3].trim() : '';
  const country = parts[parts.length - 1].trim();
  return { name, city, country, address: description };
};

// Function to fetch places from the Google Places API
async function fetchPlaces(city: string, type: string, pagetoken: string = ''): Promise<void> {
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${type}+in+${city}&key=${API_KEY}`;
  if (pagetoken) {
    url += `&pagetoken=${pagetoken}`;
  }

  try {
    const response = await axios.get(url);
    const places: Place[] = response.data.results;
    const nextPageToken = response.data.next_page_token;

    // Store places in Firestore
    await storePlacesInFirestore(places, type, city);

    // If there's a next page, fetch it after a short delay to allow the token to become valid
    if (nextPageToken) {
      console.log(`Fetching next page for type: ${type} in ${city}`);
      setTimeout(() => fetchPlaces(city, type, nextPageToken), 2000);
    }
  } catch (error) {
    console.error(`Error fetching places for type ${type} in ${city}:`, error);
  }
}

// Function to store places in Firestore
async function storePlacesInFirestore(places: Place[], type: string, city: string): Promise<void> {
  const batch = db.batch();

  places.forEach((place) => {
    const parsedInfo = parseRestaurantInfo(place.formatted_address || '');
    const placeRef = db.collection('establishments').doc(place.place_id);
    batch.set(placeRef, {
      address: place.formatted_address || '',
      averageRating: place.rating || 0,
      city: parsedInfo.city || city,
      country: parsedInfo.country || 'Canada',
      hours: place.opening_hours ? place.opening_hours.weekday_text : [],
      name: place.name || '',
      postCount: 0, // Initialize postCount
      priceRange: place.price_level || 0,
      status: place.business_status || 'OPERATIONAL',
      sumRating: 0, // Initialize sumRating
      website: place.website || '',
      fetchedType: type,
      geolocation: place.geometry ? {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      } : null,
    });
  });

  await batch.commit();
  console.log(`Stored ${places.length} places of type ${type} in ${city} in Firestore`);
}

// Main function to initiate the fetching and storing process
async function main(): Promise<void> {
  for (const city of cities) {
    for (const type of types) {
      await fetchPlaces(city, type);
    }
  }
}

main().catch(console.error);
