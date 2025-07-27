import { TextInput, View, Text } from "react-native";
import { EmailSignInController } from "./EmailSignInController";
import LabeledInput from "@components/ui/labeled-input";
import { DetailsSubmitController } from "./DetailsSubmitController";
import { SignInController } from "../SignInController";

const DetailsForm = () => {
  const name = DetailsSubmitController.use("name");
  const age = DetailsSubmitController.use("age");
  const hobbys = DetailsSubmitController.use("hobbys");
  const personality = DetailsSubmitController.use("personality");

  return (
    <View>
      <LabeledInput
        label="NAME"
        value={name}
        onChangeText={(newName) => {
          DetailsSubmitController.state.name.set(newName);
        }}
        autoCapitalize="none"
      ></LabeledInput>
      <LabeledInput
        label="AGE"
        value={`${age ?? ""}`}
        onChangeText={(newAge) => {
          if (newAge === "") {
            DetailsSubmitController.state.age.set(null);
            return;
          }
          const newAgeInt = parseInt(newAge);
          if (isNaN(newAgeInt)) {
            SignInController.state.message.set(
              `"${isNaN(newAgeInt) ? newAge + '" ? ' : ""}That's not a number, silly! Put a number as your age!`,
            );
            return;
          }

          if (newAgeInt <= 0) {
            SignInController.state.message.set(
              `"${newAge + '" ? '}I doubt you are that young. Try a realistic number.`,
            );
            return;
          }
          DetailsSubmitController.state.age.set(newAgeInt);
        }}
        keyboardType="number-pad"
        autoCapitalize="none"
      ></LabeledInput>
      <LabeledInput
        label="HOBBYS"
        value={hobbys}
        onChangeText={(newHobbys) => {
          DetailsSubmitController.state.hobbys.set(newHobbys);
        }}
        autoCapitalize="none"
      ></LabeledInput>
      <LabeledInput
        label="PERSONALITY AND MORE"
        value={personality}
        onChangeText={(newPersonality) => {
          DetailsSubmitController.state.personality.set(newPersonality);
        }}
        autoCapitalize="none"
        multiline
      ></LabeledInput>
    </View>
  );
};

export default DetailsForm;
