import { View, Text, TextInput, TextInputProps } from "react-native";

type LabeledInputProps = TextInputProps & {
  label: string;
};

const LabeledInput = ({ label, ...rest }: LabeledInputProps) => {
  return (
    <View>
      <Text className="text-white py-2 pt-4 mx-12">{label.toUpperCase()}</Text>
      <TextInput
        className="bg-white/20 rounded-3xl py-4 px-2 mx-12 text-white"
        {...rest}
      />
    </View>
  );
};

export default LabeledInput;
