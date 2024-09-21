import React from "react";
import { CustomBottomSheetModal } from "../../components/establishment/customBottomSheetModal";
import RestaurantActionCard from "../../components/establishment/restautrantCard";
import { EstablishmentCard } from "../../models/establishment";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { Post } from "../../models/post";

interface CustomBottomSheetModalContentProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  selectedRestaurant: EstablishmentCard | null;
  userLocation: Location.LocationObject | null;
  onOpenReviewPost: (post: Post) => void;
}

const CustomBottomSheetModalContent: React.FC<
  CustomBottomSheetModalContentProps
> = ({
  bottomSheetRef,
  selectedRestaurant,
  userLocation,
  onOpenReviewPost,
}) => (
  <CustomBottomSheetModal ref={bottomSheetRef}>
    {selectedRestaurant && (
      <RestaurantActionCard
        restaurant={selectedRestaurant}
        userLocation={
          userLocation
            ? {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }
            : null
        }
        onOpenReviewPost={onOpenReviewPost}
      />
    )}
  </CustomBottomSheetModal>
);

export default CustomBottomSheetModalContent;
