import { Button, Icon, IconButton, Menu } from "react-native-paper";
import { Account, useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { useNavigation } from "@react-navigation/native";
import { ellipsify } from "../../utils/ellipsify";
import { useCallback, useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Linking, View } from "react-native";
import { useCluster } from "../cluster/cluster-data-access";
import { RNSB } from "@/src/controllers/supabase";
import { PublicKey } from "@solana/web3.js";
import { WalletInfoModal } from "./wallet-info-modal";
import { UserWalletsData } from "@/src/lib/types/user_wallets";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // or whichever icon set you're using
import { RootStackParamList } from "@/src/navigators/AppNavigator";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export function TopBarWalletButton({
  selectedAccount,
  openMenu,
  loading,
}: {
  selectedAccount: Account | null;
  openMenu: () => void;
  loading: boolean;
}) {
  const { connect } = useMobileWallet();
  return (
    <Button
      icon="wallet"
      mode="contained-tonal"
      loading={loading}
      disabled={loading}
      style={{ alignSelf: "center" }}
      onPress={selectedAccount ? openMenu : connect}
    >
      {selectedAccount
        ? ellipsify(selectedAccount.publicKey.toBase58())
        : "Connect"}
    </Button>
  );
}

export function TopBarSettingsButton() {
  const navigation = useNavigation();
  return (
    <IconButton
      icon="cog"
      mode="contained-tonal"
      onPress={() => {
        navigation.navigate("Settings");
      }}
    />
  );
}

export function TopBarWalletMenu({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const { selectedAccount } = useAuthorization();
  const { getExplorerUrl } = useCluster();
  const [visible, setVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [walletData, setWalletData] = useState<UserWalletsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { disconnect } = useMobileWallet();

  const copyAddressToClipboard = async () => {
    if (selectedAccount) {
      await Clipboard.setStringAsync(selectedAccount.publicKey.toBase58());
    }
    closeMenu();
  };

  const viewExplorer = () => {
    if (selectedAccount) {
      const explorerUrl = getExplorerUrl(
        `account/${selectedAccount.publicKey.toBase58()}`,
      );
      Linking.openURL(explorerUrl);
    }
    closeMenu();
  };

  const displayWalletInfo = async () => {
    if (!selectedAccount) return;
    const data = await RNSB.getCurrentUserWalletsData();
    if (data) {
      setWalletData(data.userWalletsData);
      setIsModalVisible(true);
    }
    closeMenu();
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    const walletData = await RNSB.updateWallet("");
    setWalletData(walletData);
    await disconnect();
    setIsLoading(false);
    closeMenu();
  };

  const updateWalletData = useCallback(async () => {
    if (!selectedAccount?.publicKey) {
      return;
    }

    setIsLoading(true);
    const connectListener = async (publicKey: PublicKey) => {
      setIsLoading(true);
      const newAddress = publicKey.toBase58();
      await RNSB.updateWallet(newAddress);
      setIsLoading(false);
    };
    await connectListener(selectedAccount.publicKey);
  }, [selectedAccount]);

  useEffect(() => {
    setTimeout(() => {
      updateWalletData();
    }, 100);
  }, [updateWalletData]);

  return (
    <>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <View className="flex flex-row self-end gap-1">
            <TopBarWalletButton
              selectedAccount={selectedAccount}
              openMenu={openMenu}
              loading={isLoading}
            />
            {/* <View
              style={{
                transform: "scale(0.7)",
              }}
            >
              <Button
                // icon="logout"
                mode="outlined"
                onPress={async () => {
                  await RNSB.signOut();
                  navigation.navigate("Home");
                }}
                compact
              >
                <MaterialCommunityIcons name="logout" size={20} />
              </Button>
            </View> */}
          </View>
        }
      >
        <Menu.Item
          onPress={copyAddressToClipboard}
          title="Copy address"
          leadingIcon="content-copy"
        />
        <Menu.Item
          onPress={viewExplorer}
          title="View Explorer"
          leadingIcon="open-in-new"
        />
        <Menu.Item
          onPress={disconnectWallet}
          title="Disconnect"
          leadingIcon="link-off"
        />
        <Menu.Item
          onPress={displayWalletInfo}
          title="Wallet Info"
          leadingIcon="information-outline"
        />
      </Menu>
      <WalletInfoModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        walletData={walletData}
      />
    </>
  );
}
