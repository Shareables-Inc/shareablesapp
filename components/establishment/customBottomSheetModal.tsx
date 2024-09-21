import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { forwardRef, useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import Colors from "../../utils/colors";

export type Ref = BottomSheetModal;

interface CustomBottomSheetModalProps {
  children: React.ReactNode;
}

export const CustomBottomSheetModal = forwardRef<
  Ref,
  CustomBottomSheetModalProps
>(({ children }, ref) => {
  const snapPoints = useMemo(() => ["60%", "90%"], []);

  return (
    <BottomSheetModal
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          opacity={0.5}
          enableTouchThrough={false}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          style={[
            { backgroundColor: "rgba(0, 0, 0, 1)" },
            StyleSheet.absoluteFillObject,
          ]}
        />
      )}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      ref={ref}
    >
      <View style={styles.container}>
        <View style={styles.contentContainer}>{children}</View>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
