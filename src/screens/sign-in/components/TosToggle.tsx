import { LogInPageType } from "@components/sign-in/auth-types";
import { Linking, TouchableOpacity, useColorScheme, View } from "react-native";
import { Checkbox, Text } from "react-native-paper";
import { SignInController } from "../SignInController";

const TosToggle = ({ initialType }: { initialType: LogInPageType }) => {
  const type = SignInController.use("type");
  const hasAcceptedTos = SignInController.use("hasAcceptedTos");
  return (
    <View className="w-full">
      {(type ?? initialType) === LogInPageType.SignUp && (
        <View className="flex-row items-center gap-2 mx-12 mt-4">
          <Checkbox.Android
            status={hasAcceptedTos ? "checked" : "unchecked"}
            color="white"
            uncheckedColor="white"
            onPress={() => SignInController.hasAcceptedTos.set(!hasAcceptedTos)}
          />
          <TouchableOpacity
            className="flex-shrink flex-1"
            onPress={() =>
              Linking.openURL("https://lealabs.io/terms-and-conditions")
            }
          >
            <Text
              style={{
                color: "white",
              }}
            >
              {"I hereby agree to the terms and conditions"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TosToggle;
