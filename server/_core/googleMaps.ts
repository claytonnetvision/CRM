import axios from "axios";
import { ENV } from "./env";

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  types: string[];
}

export interface SearchPlacesParams {
  query: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // in meters
  type?: string;
}

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api";

// Dados de teste para uso local quando API key não está configurada
const MOCK_ESTABLISHMENTS: PlaceSearchResult[] = [
  {
    id: "mock-1",
    name: "Iron Cross CrossFit",
    address: "Av. Mem de Sá, 797 - Santa Efigênia, Belo Horizonte",
    latitude: -19.9191,
    longitude: -43.9386,
    phone: "(31) 98343-2246",
    website: "https://ironcrosscrossfit.com.br",
    rating: 4.8,
    reviewCount: 125,
    types: ["gym", "health"],
  },
  {
    id: "mock-2",
    name: "CT 031 BH Studio",
    address: "R. Min. Oliveira Salazar, 980 - Santa Mônica, Belo Horizonte",
    latitude: -19.9250,
    longitude: -43.9450,
    phone: "(31) 3199936-1296",
    website: "https://ct031bh.com.br",
    rating: 4.6,
    reviewCount: 98,
    types: ["gym", "health"],
  },
  {
    id: "mock-3",
    name: "Lutyano Funcional",
    address: "Av. Dom Pedro I, 2077 - São Bento, Belo Horizonte",
    latitude: -19.9100,
    longitude: -43.9300,
    phone: "(31) 3333-4444",
    website: "https://lutyano-funcional.com.br",
    rating: 4.5,
    reviewCount: 87,
    types: ["gym", "health"],
  },
  {
    id: "mock-4",
    name: "Brenda Fitness Studio",
    address: "Rua Bahia, 1500 - Centro, Belo Horizonte",
    latitude: -19.9280,
    longitude: -43.9320,
    phone: "(31) 2555-6666",
    website: "https://brenda-fitness.com.br",
    rating: 4.7,
    reviewCount: 156,
    types: ["gym", "health"],
  },
  {
    id: "mock-5",
    name: "Daniel CrossFit Box",
    address: "Av. Getúlio Vargas, 1000 - Funcionários, Belo Horizonte",
    latitude: -19.9350,
    longitude: -43.9500,
    phone: "(31) 9999-8888",
    website: "https://daniel-crossfit.com.br",
    rating: 4.9,
    reviewCount: 203,
    types: ["gym", "health"],
  },
];

/**
 * Search for places using Google Places API (Nearby Search)
 * This uses the server-side API key for backend searches
 * 
 * Se GOOGLE_MAPS_API_KEY não está configurada, retorna dados de teste
 */
export async function searchPlaces(params: SearchPlacesParams): Promise<PlaceSearchResult[]> {
  // Se não há API key, retorna dados de teste (modo local)
  if (!ENV.googleMapsApiKey) {
    console.warn("[Google Maps] API key not configured - using mock data for local development");
    // Filtra dados de teste por query
    return MOCK_ESTABLISHMENTS.filter(place =>
      place.name.toLowerCase().includes(params.query.toLowerCase()) ||
      place.address.toLowerCase().includes(params.query.toLowerCase())
    );
  }

  try {
    // Use Nearby Search endpoint
    const response = await axios.get(`${PLACES_API_BASE}/place/nearbysearch/json`, {
      params: {
        location: `${params.location.latitude},${params.location.longitude}`,
        radius: params.radius || 15000, // Default 15km
        keyword: params.query,
        key: ENV.googleMapsApiKey,
      },
    });

    if (response.data.status === "ZERO_RESULTS") {
      return [];
    }

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // Transform results to our format
    const results: PlaceSearchResult[] = (response.data.results || []).map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || "",
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      types: place.types || [],
    }));

    return results;
  } catch (error: any) {
    console.error("[Google Maps API] Search error:", error.message);
    throw new Error(`Failed to search places: ${error.message}`);
  }
}

/**
 * Get detailed information about a place using Place Details API
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceSearchResult> {
  // Se não há API key, retorna dados de teste
  if (!ENV.googleMapsApiKey) {
    const mockPlace = MOCK_ESTABLISHMENTS.find(p => p.id === placeId);
    if (mockPlace) {
      return mockPlace;
    }
    throw new Error(`Place ${placeId} not found in mock data`);
  }

  try {
    const response = await axios.get(`${PLACES_API_BASE}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: "name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,types",
        key: ENV.googleMapsApiKey,
      },
    });

    if (response.data.status !== "OK") {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const place = response.data.result;
    return {
      id: placeId,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      types: place.types || [],
    };
  } catch (error: any) {
    console.error("[Google Maps API] Details error:", error.message);
    throw new Error(`Failed to get place details: ${error.message}`);
  }
}

/**
 * Search for specific types of fitness establishments in Belo Horizonte
 */
export async function searchFitnessEstablishments(type: "crossfit" | "studio" | "funcional"): Promise<PlaceSearchResult[]> {
  const queries: Record<string, string> = {
    crossfit: "CrossFit",
    studio: "Studio de Fitness",
    funcional: "Funcional Belo Horizonte",
  };

  const query = queries[type] || queries.crossfit;

  // Belo Horizonte coordinates
  const bhLocation = {
    latitude: -19.9191,
    longitude: -43.9386,
  };

  return searchPlaces({
    query,
    location: bhLocation,
    radius: 15000, // 15km radius
  });
}

/**
 * Batch search for all types of fitness establishments
 */
export async function searchAllFitnessEstablishments(): Promise<{
  crossfit: PlaceSearchResult[];
  studio: PlaceSearchResult[];
  funcional: PlaceSearchResult[];
}> {
  try {
    const [crossfit, studio, funcional] = await Promise.all([
      searchFitnessEstablishments("crossfit"),
      searchFitnessEstablishments("studio"),
      searchFitnessEstablishments("funcional"),
    ]);

    return { crossfit, studio, funcional };
  } catch (error: any) {
    console.error("[Google Maps API] Batch search error:", error.message);
    throw error;
  }
}
