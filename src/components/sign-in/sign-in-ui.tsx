import { useNavigation } from "@react-navigation/native";
import { Button } from "react-native-paper";

export function ConnectButton() {
  // This button is not currently used, so I'll leave it as is.
  return (
    <Button mode="contained" style={{ flex: 1 }}>
      Connect
    </Button>
  );
}

export function SignInButton() {
  const navigation = useNavigation();
  return (
    <Button
      mode="contained"
      onPress={() => navigation.navigate("SignIn")}
      style={{ marginLeft: 4, flex: 1 }}
    >
      Sign in
    </Button>
  );
}
