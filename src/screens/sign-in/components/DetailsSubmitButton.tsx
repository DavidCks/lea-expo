import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { signInConfig } from "../SignInConfig";
import { cn } from "@/src/utils/cn";
import { DetailsSubmitController } from "./DetailsSubmitController";

const DetailsSubmitButton = () => {
  const navigation = useNavigation();
  const loading = DetailsSubmitController.use("loading");
  const name = DetailsSubmitController.use("name");
  const age = DetailsSubmitController.use("age");

  const handleSubmit = useCallback(async () => {
    const result = await DetailsSubmitController.submit();
    if (!result) {
      return;
    }
    signInConfig.afterSignIn(result, navigation.navigate);
  }, [navigation]);

  const isDisabled = loading || !name || !age;
  return (
    <View className="pt-8">
      <Button
        mode="contained"
        onPress={() => handleSubmit()}
        loading={loading}
        disabled={isDisabled}
        style={{
          marginInline: 48,
          opacity: isDisabled ? 0.8 : 1,
          backgroundColor: isDisabled ? "#444" : "black",
        }}
      >
        <Text
          className={cn(
            "font-bold",
            isDisabled ? "text-gray-400" : "text-white",
          )}
        >
          {loading ? "Submitting..." : "Done"}
        </Text>
      </Button>
    </View>
  );
};

export default DetailsSubmitButton;
