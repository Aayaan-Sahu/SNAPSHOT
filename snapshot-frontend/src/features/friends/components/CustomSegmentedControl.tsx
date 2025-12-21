import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";

interface CustomSegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const CustomSegmentedControl = ({
  values,
  selectedIndex,
  onChange,
}: CustomSegmentedControlProps) => {
  const translateX = useRef(new Animated.Value(selectedIndex)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: selectedIndex,
      stiffness: 150,
      damping: 20,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  const tabWidth = containerWidth / values.length;

  return (
    <View
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {/* THE SLIDING THUMB 
        - Absolute position
        - Moves based on translateX * tabWidth
      */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: tabWidth - 4, // Subtract padding
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, tabWidth], // Move by one tab width per index
                  }),
                },
              ],
            },
          ]}
        />
      )}

      {/* THE LABELS (Rendered on top of the thumb) */}
      {values.map((value, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={value}
            style={styles.tab}
            onPress={() => onChange(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isSelected && styles.activeText]}>
              {value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 40,
    backgroundColor: "#eeeff1", // Light Grey Background (Apple Style)
    borderRadius: 9,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 2, // Gap between thumb and edge
  },
  thumb: {
    position: "absolute",
    height: "100%",
    top: 2,
    backgroundColor: "white",
    borderRadius: 7,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    // Android Shadow
    elevation: 2,
  },
  tab: {
    flex: 1, // Distribute space equally
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // Ensure text is above the thumb
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeText: {
    fontWeight: "700",
    color: "#000",
  },
});