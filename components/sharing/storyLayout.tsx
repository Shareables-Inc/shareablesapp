import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Sparkle, Utensils, ConciergeBell } from "lucide-react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";

const { width } = Dimensions.get("window");

interface StoryLayoutProps {
  imageUrl?: string;
  restaurantName: string;
  ratingAmbiance: number;
  ratingFoodQuality: number;
  ratingService: number;
  userHandle?: string;
  /** When true, use compact styling for previews (e.g. in a modal) */
  isPreview?: boolean;
}

const StoryLayout: React.FC<StoryLayoutProps> = ({
  imageUrl,
  restaurantName,
  ratingAmbiance,
  ratingFoodQuality,
  ratingService,
  userHandle,
  isPreview = false,
}) => {
  return (
    <View style={[styles.container, isPreview && styles.previewContainer]}>
      <Image 
        source={require("../../assets/images/logoText.png")} 
        style={[styles.brandLogo, isPreview && styles.brandLogoPreview]} 
        resizeMode="contain" 
      />

      <View style={[styles.imageContainer, isPreview && styles.imageContainerPreview]}>
        {imageUrl ? (
          <>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <LinearGradient
              colors={["transparent", "rgba(0, 0, 0, 0.2)"]}
              style={styles.gradient}
            />
          </>
        ) : (
          <Text style={{ textAlign: "center", padding: 20 }}>No Image</Text>
        )}
      </View>

      <View style={styles.loveRow}>
        <Text style={[styles.loveText, { marginRight: 8 }]}>I</Text>
        <Heart
          color={Colors.tags}
          fill={Colors.tags}
          style={styles.heartIcon}
          strokeWidth={1.5}
        />
        <Text style={[styles.loveText, { marginLeft: 8 }]}>{restaurantName}</Text>
      </View>

      <View style={styles.ratingsRow}>
        {/* Ambiance */}
        <View style={styles.ratingBlock}>
          <View style={styles.ratingLabelRow}>
            <Sparkle color={Colors.text} strokeWidth={1.5} style={styles.ratingIcon} />
            <Text style={styles.ratingLabel}>Ambiance</Text>
          </View>
          <Text style={styles.ratingValueAmbiance}>{ratingAmbiance.toFixed(1)}</Text>
        </View>

        {/* Food */}
        <View style={styles.ratingBlock}>
          <View style={styles.ratingLabelRow}>
            <Utensils color={Colors.text} strokeWidth={1.5} style={styles.ratingIcon} />
            <Text style={styles.ratingLabel}>Food Quality</Text>
          </View>
          <Text style={styles.ratingValueFood}>{ratingFoodQuality.toFixed(1)}</Text>
        </View>

        {/* Service */}
        <View style={styles.ratingBlock}>
          <View style={styles.ratingLabelRow}>
            <ConciergeBell color={Colors.text} strokeWidth={1.5} style={styles.ratingIcon} />
            <Text style={styles.ratingLabel}>Service</Text>
          </View>
          <Text style={styles.ratingValueService}>{ratingService.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
};

export default StoryLayout;

const styles = StyleSheet.create({
  container: {
    width,
    height: width * 1.8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  // When in preview mode, reduce the height
  previewContainer: {
    height: width * 1.4,
  },
  brandLogo: {
    width: width * 0.5,
    height: width * 0.15,
    marginTop: width * 0.1,
    marginBottom: width * 0.07,
  },
  // In preview, reduce top/bottom margins for the logo
  brandLogoPreview: {
    marginTop: width * 0.05,
    marginBottom: width * 0.04,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 1.1,
    borderRadius: 40,
    backgroundColor: Colors.background,
    shadowColor: Colors.placeholderText,
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  // Reduce image container height slightly in preview
  imageContainerPreview: {
    height: width * 1.1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 40,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "90%",
    borderRadius: 40,
  },
  loveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: width * 0.08,
  },
  loveText: {
    fontSize: width * 0.06,
    color: Colors.tags,
    fontFamily: Fonts.SemiBold,
  },
  heartIcon: {
    width: 28,
    height: 28,
  },
  ratingsRow: {
    flexDirection: "row",
    marginTop: width * 0.05,
    width: "90%",
    justifyContent: "space-around",
  },
  ratingBlock: {
    alignItems: "center",
  },
  ratingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    fontFamily: Fonts.Medium,
  },
  ratingLabel: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Bold,
  },
  ratingValueAmbiance: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Bold,
    marginLeft: width * -0.02,
  },
  ratingValueFood: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Bold,
    marginLeft: width * -0.08,
  },
  ratingValueService: {
    fontSize: width * 0.04,
    color: Colors.text,
    fontFamily: Fonts.Bold,
    marginLeft: width * 0.01,
  },
});
