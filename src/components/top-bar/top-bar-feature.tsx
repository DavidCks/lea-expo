import { StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import { /*TopBarWalletButton,*/ TopBarWalletMenu } from "./top-bar-ui";

export function TopBar() {
  // const navigation = useNavigation();
  // const theme = useTheme();

  return (
    <Appbar.Header mode="small" style={styles.topBar}>
      <TopBarWalletMenu />

      {/* <Appbar.Action
        icon="cog"
        mode="contained-tonal"
        onPress={() => {
          navigation.navigate("Settings");
        }}
      /> */}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  topBar: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
