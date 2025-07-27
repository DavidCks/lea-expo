import { View, TouchableOpacity, useColorScheme } from "react-native";
import { Card, Text } from "react-native-paper";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { LogInPageType } from "@components/sign-in/auth-types";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigators/AppNavigator";
import EmailSignInForm from "./components/EmailSignInForm";
import TosToggle from "./components/TosToggle";
import EmailSignInSubmitButton from "./components/EmailSignInSubmitButton";
import GoogleSignInButton from "./components/GoogleSignInButton";
import { SignInController } from "./SignInController";
import SolanaSignInButton from "./components/SolanaSignInButton";
import { styles } from "@/src/styles/styles";
import { SignInImpl } from "./SignInImpl";

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, "SignIn">;

export function SignInScreen({ route }: SignInScreenProps) {
  const { type = LogInPageType.LogIn } = route.params || {};

  return <SignInImpl type={type} />;
}
