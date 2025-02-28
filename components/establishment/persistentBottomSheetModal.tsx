import React, { forwardRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import BottomSheet from "@gorhom/bottom-sheet";
import Colors from "../../utils/colors";

export type Ref = BottomSheet;

interface PersistentBottomSheetModalProps {
  children: React.ReactNode;
}

export const PersistentBottomSheetModal = forwardRef<Ref, PersistentBottomSheetModalProps>(
  ({ children }, ref) => {
    const snapPoints = useMemo(() => ["10%"], []); 

    return (
      <BottomSheet
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            opacity={0.5}
            enableTouchThrough={true}
            appearsOnIndex={0}
            disappearsOnIndex={0}
            style={[
              { backgroundColor: "rgba(0, 0, 0, 1)" },
              StyleSheet.absoluteFillObject,
            ]}
          />
        )}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false} 
        enableHandlePanningGesture={false}
        handleComponent={null}
        onChange={(index) => {
          if (index < 0 && ref && 'current' in ref && ref.current) {
            ref.current.snapToIndex(0);
          }
        }}
        ref={ref}
      >
        <View style={styles.container}>
          <View style={styles.contentContainer}>{children}</View>
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    marginTop: 20
  },
  contentContainer: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
