import { useUserWallets } from "@/src/hooks/useUserWallets";
import { UserWalletsData } from "@/src/lib/types/user_wallets";
import { Info } from "lucide-react-native";
import { FC, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { WalletInfoModal } from "./wallet-info-modal";

const Credits: FC = () => {
  const userWallets = useUserWallets();
  return !userWallets.data || userWallets.loading ? null : (
    <CreditsMobile userWallets={userWallets.data} />
  );
};

interface CreditsVariantProps {
  userWallets: UserWalletsData;
}

const CreditsMobile: FC<CreditsVariantProps> = ({ userWallets }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <View className="flex flex-wrap gap-4 text-center ml-auto z-50">
        <Pressable
          onPress={() => {
            setIsModalVisible(true);
          }}
        >
          <View className="flex flex-row gap-3 items-center bg-gray-200 rounded-full px-3">
            <Text className="font-bold bg-clip-text bg-gradient-to-r text-black text-lg">
              {parseInt(userWallets.credits) <= 0
                ? "0"
                : parseInt(userWallets.credits)}
            </Text>
            <Info size={16} />
          </View>
        </Pressable>
      </View>
      <WalletInfoModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
        walletData={userWallets}
      />
    </>
  );
};

export default Credits;
