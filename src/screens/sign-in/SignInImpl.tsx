import {
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Card, Text } from "react-native-paper";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { LogInPageType } from "@components/sign-in/auth-types";

import EmailSignInForm from "./components/EmailSignInForm";
import TosToggle from "./components/TosToggle";
import EmailSignInSubmitButton from "./components/EmailSignInSubmitButton";
import GoogleSignInButton from "./components/GoogleSignInButton";
import { SignInController } from "./SignInController";
import SolanaSignInButton from "./components/SolanaSignInButton";
import { useState } from "react";
import { fonts } from "@/src/utils/fonts";
import DetailsForm from "./components/DetailsForm";
import DetailsSubmitButton from "./components/DetailsSubmitButton";
import { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID } from "@/src/env-vars";

// Configure Google Sign-In
GoogleSignin.configure({
  // scopes: ['https://www.googleapis.com/auth/drive.readonly'], // Add any scopes you need
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export function SignInImpl({ initialType }: { initialType: LogInPageType }) {
  const message = SignInController.use("message");
  const type = SignInController.use("type");

  const i18n = {
    [LogInPageType.LogIn]: {
      title: "Login",
      description: "Sign in to continue",
      has_account: "Don't have an account?",
      has_account_link: "Sign up !",
    },
    [LogInPageType.SignUp]: {
      title: "Create new Account",
      description: "",
      has_account: "Already have an account?",
      has_account_link: "Login !",
    },
    [LogInPageType.Details]: {
      title: "Let Lea know who you are",
      description: "",
    },
  }[type || initialType];

  return (
    <View className="flex-1">
      <ScrollView className="w-full p-4 ">
        <View className="w-full pt-12 mb-16">
          <Text
            style={{
              fontFamily: fonts.inter.fontFamily,
              textAlign: "center",
              color: "white",
            }}
            className="flex-1 self-center text-5xl font-bold"
          >
            {i18n.title}
          </Text>
          <Text
            className="self-center flex-wrap mb-6"
            style={{
              fontFamily: fonts.inter.fontFamily,
              textAlign: "center",
              color: "white",
            }}
          >
            {i18n.description}
          </Text>
          {(type ?? initialType) !== LogInPageType.Details ? (
            <EmailSignInForm />
          ) : (
            <DetailsForm />
          )}
          {message ? (
            <Text
              className="text-red-500 text-center my-4 mx-12"
              style={{
                color: "#ffdddd",
                textAlign: "center",
              }}
            >{`${message}`}</Text>
          ) : null}
          {(type || initialType) !== LogInPageType.Details ? (
            <>
              <TosToggle initialType={initialType} />
              <EmailSignInSubmitButton initialType={initialType} />

              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-gray-400" />
                <Text
                  className="mx-2"
                  style={{
                    color: "white",
                  }}
                >
                  OR
                </Text>
                <View className="flex-1 h-px bg-gray-400" />
              </View>
              <GoogleSignInButton initialType={initialType} />
              <SolanaSignInButton initialType={initialType} />

              <View className="flex-col justify-center items-center mt-4">
                <Text
                  style={{
                    color: "white",
                  }}
                >{`${i18n.has_account}`}</Text>
                <TouchableOpacity
                  onPress={() => {
                    SignInController.set({
                      loading: false,
                      message: "",
                      type:
                        (type ?? initialType) === LogInPageType.SignUp
                          ? LogInPageType.LogIn
                          : LogInPageType.SignUp,
                      hasAcceptedTos: false,
                    });
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                    }}
                    className="underline px-2"
                  >
                    {i18n.has_account_link}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <DetailsSubmitButton />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
