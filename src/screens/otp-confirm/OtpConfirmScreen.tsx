import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigators/AppNavigator";
import { styles } from "@/src/styles/styles";
import { RNSB } from "@/src/controllers/supabase";
import { signInConfig } from "@screens/sign-in/SignInConfig";
import LabeledInput from "@components/ui/labeled-input";
import LEAGradient from "@components/styled-container/LEAGradient";
import { Button } from "react-native-paper";

type OtpConfirmScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "OtpConfirm"
>;

export const OtpConfirmScreen: React.FC<OtpConfirmScreenProps> = ({
  route,
}) => {
  const { email, password } = route.params;
  const [token, setToken] = useState("");
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const handleVerifyOtp = useCallback(async () => {
    if (!token) {
      Alert.alert("Error", "Please enter the confirmation code.");
      return;
    }
    try {
      const { value, error } = await RNSB.verifySignUpOtp(
        email,
        password,
        token,
      );

      if (error) {
        Alert.alert("Error", error);
      } else if (!value) {
        Alert.alert(
          "Error",
          "Something went wrong during authentication. Please try again",
        );
      } else {
        console.log(value);
        Alert.alert("Success", "Your email has been verified!");
        signInConfig.afterSignIn(value.user, navigation.navigate);
      }
    } catch (error) {
      Alert.alert("Error", `An unexpected error occurred: ${error}`);
    }
  }, [token]);

  return (
    <LEAGradient
      style={{
        flex: 1,
        padding: 16,
        borderTopLeftRadius: 48,
        borderTopRightRadius: 48,
        marginTop: 192,
        gap: 12,
      }}
    >
      <View className="mt-8">
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "white",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Enter Confirmation Code
        </Text>
        <Text
          style={{
            color: "white",
            textAlign: "center",
          }}
        >
          A 6-digit code was sent to {email}
        </Text>
      </View>
      <LabeledInput
        label="CODE"
        onChangeText={(t) => {
          setToken(t);
        }}
      />
      <Button
        mode="contained"
        onPress={() => handleVerifyOtp()}
        style={{
          marginInline: 48,
          backgroundColor: "black",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "white",
          }}
        >
          Verify
        </Text>
      </Button>
    </LEAGradient>
  );
};
