import { ref } from "firebase/storage";
import { Search } from "lucide-react-native";
import { useRef } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import ActionSheet, { useSheetRef } from "react-native-actions-sheet";
import { Colors } from "../../utils/colors";
import { Fonts } from "../../utils/fonts";

const SearchActionSheet = () => {
  const ref = useSheetRef();

  return (
    <ActionSheet
      id="search-action-sheet"
      isModal={false}
      backgroundInteractionEnabled
      gestureEnabled
      closable={false}
      disableDragBeyondMinimumSnapPoint
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search discover..."
          placeholderTextColor={Colors.charcoal}
        />
        <Search style={styles.searchIcon} color={Colors.charcoal} />
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchInput: {
    height: 40,
    paddingLeft: 45,
    backgroundColor: Colors.inputBackground,
    fontSize: 16,
    borderRadius: 18,
    width: "88%",
    alignSelf: "center",
    fontFamily: Fonts.Medium,
  },
  searchIcon: {
    position: "absolute",
    left: "10%",
    width: 20,
    height: 20,
  },
});

export default SearchActionSheet;
