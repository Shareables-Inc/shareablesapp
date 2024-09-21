import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard, // Add this import
} from "react-native";
import { Colors } from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { suggestedSearch } from "../../services/search.service";
import { dummyDataSuggestionResponse } from "./dummyData";
import { Search, X } from "lucide-react-native";
import { debounce } from "lodash";
import { Suggestion, SuggestionsResponse } from "../../types/mapbox.types";
import { useLocationStore } from "../../store/useLocationStore";

interface FeedSearchBoxProps {
  country: string;
  language: string;
  sessionToken: string;
  placeholder: string;
  onPlaceSelect: (suggestion: any) => void;
  refreshKey: number;
}

export default function FeedSearchBox({
  country,
  language,
  placeholder,
  sessionToken,
  onPlaceSelect,
  refreshKey,
}: FeedSearchBoxProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocationStore();

  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    if (location.location?.coords) {
      setOrigin(
        location.location.coords.longitude +
          "," +
          location.location.coords.latitude
      );
    }
  }, [location.location]);

  const handleOnChangeText = useCallback((text: string) => {
    setInput(text);
  }, []);

  const fetchResults = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const results = await suggestedSearch({
          query,
          sessionToken,
          country,
          language,
          proximity: origin ?? null,
        });
        setResults(results);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    },
    [sessionToken, country, language]
  );

  const debouncedFetchResults = useMemo(
    () => debounce(fetchResults, 1000),
    [fetchResults]
  );

  useEffect(() => {
    debouncedFetchResults(input);
    return () => debouncedFetchResults.cancel();
  }, [input, debouncedFetchResults]);

  useEffect(() => {
    setInput("");
    setResults(null);
    setIsLoading(false);
    Keyboard.dismiss(); // Dismiss the keyboard when refreshKey changes
  }, [refreshKey]);

  const handleClearInput = () => {
    setInput("");
    setResults(null);
    setIsLoading(false);
    Keyboard.dismiss(); // Dismiss the keyboard
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          placeholder={placeholder}
          style={styles.searchInput}
          placeholderTextColor={Colors.charcoal}
          onChangeText={handleOnChangeText}
        />
        <Search style={styles.searchIcon} color={Colors.charcoal} />
        {input.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearInput}
          >
            <X size={20} color={Colors.charcoal} />
          </TouchableOpacity>
        )}
      </View>
      {input.length >= 3 && (
        <View style={styles.container}>
          <View style={styles.suggestionListContainer}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.highlightText} />
              </View>
            )}
            {!isLoading && results?.suggestions && (
              <PlaceSuggestionList
                suggestions={results.suggestions}
                onPlaceSelect={onPlaceSelect}
              />
            )}
            {!isLoading &&
              Array.isArray(results?.suggestions) &&
              results.suggestions.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
          </View>
        </View>
      )}
    </View>
  );
}

const PlaceSuggestionList = ({ suggestions, onPlaceSelect }) => {
  const handleSuggestionPress = useCallback(
    (item: Suggestion) => {
      Keyboard.dismiss(); // Dismiss the keyboard
      onPlaceSelect(item);
    },
    [onPlaceSelect]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Suggestion; index: number }) => (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          index === suggestions.length - 1 && styles.lastSuggestionItem,
        ]}
        onPress={() => handleSuggestionPress(item)}
      >
        <Text style={styles.suggestionText}>
          {item.name || item.place_formatted || "Unknown location"}
        </Text>
        {item.address && (
          <Text style={styles.suggestionSubtext}>{item.address}</Text>
        )}
      </TouchableOpacity>
    ),
    [handleSuggestionPress, suggestions.length]
  );

  return (
    <FlatList
      data={suggestions}
      renderItem={renderItem}
      keyExtractor={(item) =>
        item.mapbox_id || item.name || Math.random().toString()
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 20, // Adjusted for a more rounded look
    paddingHorizontal: 12,
    paddingVertical: 10, // Slightly increased padding
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15, // Slightly increased opacity for better visibility
    shadowRadius: 5, // Increased for a softer shadow
    elevation: 3,
  },

  suggestionListContainer: {
    width: "100%",
    marginTop: 10, // Increased spacing between input and list
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        borderWidth: 0.5,
        borderColor: "#e5e7eb",
        zIndex: 1,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  suggestionItem: {
    paddingVertical: 12, // Increased padding for better touch interaction
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb", // Light border between items
  },
  lastSuggestionItem: {
    borderBottomWidth: 0, // Removing border for the last item
  },
  suggestionText: {
    color: "#374151",
    fontSize: 16, // Slightly increased font size for readability
    fontFamily: Fonts.Medium,
  },
  suggestionSubtext: {
    color: "#6B7280",
    fontSize: 13, // Adjusted font size for subtext
    fontFamily: Fonts.Regular,
    marginTop: 2,
  },
  searchInput: {
    height: 42,
    paddingLeft: 45,
    fontSize: 16,
    borderRadius: 18,
    width: "100%",
    alignSelf: "center",
    fontFamily: Fonts.Medium,
  },
  searchIcon: {
    position: "absolute",
    left: 12, // Adjusted position to align better with the input
    width: 20,
    height: 20,
  },
  clearButton: {
    position: "absolute",
    right: 12, // Adjusted position to match search icon
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsContainer: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    color: Colors.charcoal,
    fontFamily: Fonts.Regular,
    fontSize: 14,
  },
});
