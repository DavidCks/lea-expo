import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import LeaStream from "./avatar/LeaStream";

export function LeaScreen() {
  return (
    <>
      <View
        style={{
          height: "100%",
        }}
      >
        <LeaStream />
      </View>
    </>
  );
}
