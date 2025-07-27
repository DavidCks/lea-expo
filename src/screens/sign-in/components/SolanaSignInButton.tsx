import { RNSB } from "@/src/controllers/supabase";
import { styles } from "@/src/styles/styles";
import { alertAndLog } from "@/src/utils/alertAndLog";
import { useMobileWallet } from "@/src/utils/useMobileWallet";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { TouchableOpacity, useColorScheme, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SignInController } from "../SignInController";
import { ellipsify } from "@/src/utils/ellipsify";
import { LogInPageType } from "@components/sign-in/auth-types";
import { useAuthorization } from "@/src/utils/useAuthorization";
import { signInConfig } from "../SignInConfig";
import { cn } from "@/src/utils/cn";

const SolanaSignInButton = ({
  initialType,
}: {
  initialType: LogInPageType;
}) => {
  const type = SignInController.use("type");
  const [isWalletLoginLoading, setIsWalletLoginLoading] = useState(false);
  const loading = SignInController.use("loading");
  const hasAcceptedTos = SignInController.use("hasAcceptedTos");
  const colorScheme = useColorScheme();
  const { selectedAccount } = useAuthorization();
  const [solAccount, setSolAccount] = useState<Awaited<
    ReturnType<typeof connectWallet>
  > | null>(selectedAccount);

  const navigation = useNavigation();
  const {
    connect: connectWallet,
    signMessage,
    disconnect: disconnectWallet,
  } = useMobileWallet();

  const handleSolanaSignIn = useCallback(async () => {
    setIsWalletLoginLoading(true);
    try {
      SignInController.loading.set(true);
      SignInController.message.set("");

      if (!solAccount) {
        try {
          const connection = await connectWallet();

          console.log("Connected to: " + connection.publicKey.toBase58());
          setSolAccount(connection);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          SignInController.message.set(e);
        } finally {
          SignInController.loading.set(false);
        }
        return;
      }

      const user = await RNSB.signInWithSolana(
        "https://lealabs.io",
        solAccount.publicKey,
        {
          messageSigner: signMessage,
        },
      );

      if (user.error) {
        alertAndLog("Solana Sign-In Failed", user.error);
        return;
      }
      console.log("User", JSON.stringify(user.value));
      SignInController.loading.set(false);
      SignInController.message.set("");
      signInConfig.afterSignIn(user.value!.user!, navigation.navigate);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("Something unexpected happened");
      alertAndLog("Solana Sign-In Failed", e.message);
    } finally {
      setIsWalletLoginLoading(false);
    }
  }, [connectWallet, navigation, signMessage, solAccount]);

  const isDisabled =
    ((type ?? initialType) === LogInPageType.SignUp && !hasAcceptedTos) ||
    isWalletLoginLoading ||
    loading;
  return (
    <>
      <Button
        mode="outlined"
        onPress={handleSolanaSignIn}
        icon="wallet"
        style={{
          opacity: isDisabled ? 0.8 : 1,
          marginInline: 48,
          backgroundColor: isDisabled ? "#444" : "black",
        }}
        loading={isWalletLoginLoading}
        disabled={isDisabled}
      >
        {solAccount ? (
          <Text
            style={{
              fontWeight: "bold",
              color: isDisabled ? "#99a1aa" : "white",
            }}
          >
            {`Sign in as ${ellipsify(solAccount.publicKey.toBase58())}`}
          </Text>
        ) : (
          <Text
            style={{
              fontWeight: "bold",
              color: isDisabled ? "#99a1aa" : "white",
            }}
          >
            Sign in with Solana
          </Text>
        )}
      </Button>
      {solAccount && (
        <TouchableOpacity
          onPress={async () => {
            await disconnectWallet();
            setSolAccount(null);
          }}
        >
          <Text
            style={{
              paddingBlock: 12,
              marginInline: 48,
              textAlign: "center",
              color: "lightblue",
              textDecorationLine: "underline",
            }}
          >
            {"Change wallet"}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

export default SolanaSignInButton;
