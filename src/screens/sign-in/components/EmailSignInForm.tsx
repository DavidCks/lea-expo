import { TextInput, View, Text } from "react-native";
import { EmailSignInController } from "./EmailSignInController";
import LabeledInput from "@components/ui/labeled-input";

const EmailSignInForm = () => {
  const email = EmailSignInController.use("email");
  const password = EmailSignInController.use("password");

  return (
    <View>
      <LabeledInput
        label="EMAIL"
        value={email}
        onChangeText={(newEmail) => {
          EmailSignInController.email.set(newEmail);
        }}
        autoCapitalize="none"
        keyboardType="email-address"
      ></LabeledInput>
      <View>
        <LabeledInput
          label="PASSWORD"
          value={password}
          onChangeText={(newPassword) => {
            EmailSignInController.password.set(newPassword);
          }}
          secureTextEntry
        ></LabeledInput>
      </View>
    </View>
  );
};

export default EmailSignInForm;
