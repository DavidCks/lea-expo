import React from "react";
import { View } from "react-native";
import { cn } from "../../utils/cn";

interface PagerIndicatorProps {
  currentPage: number;
  pageCount: number;
}

const PagerIndicator: React.FC<PagerIndicatorProps> = ({
  currentPage,
  pageCount,
}) => {
  return (
    <View className="flex-row flex-shrink h-1.5 space-x-1">
      {Array.from({ length: pageCount }).map((_, index) => (
        <View
          key={index}
          className={cn(
            "flex-1 h-full rounded-full",
            currentPage === index ? "bg-primary-indicator" : "bg-gray-300",
          )}
        />
      ))}
    </View>
  );
};

export default PagerIndicator;
