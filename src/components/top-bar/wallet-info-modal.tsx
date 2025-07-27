import React from "react";
import { Modal, Portal, Card, Text, Button } from "react-native-paper";
import { StyleSheet, View } from "react-native";
import { UserWalletsData } from "@/src/lib/types/user_wallets";

interface WalletInfoModalProps {
  visible: boolean;
  onDismiss: () => void;
  walletData: UserWalletsData | null;
}

export function WalletInfoModal({
  visible,
  onDismiss,
  walletData,
}: WalletInfoModalProps) {
  if (!walletData) {
    return null;
  }

  const formattedBalance = (
    parseInt(walletData.wallet_balance, 10) / 1_000_000
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card>
          <Card.Title title="Wallet Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.label}>LEA Balance:</Text>
              <Text style={styles.value}>{formattedBalance}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Credits:</Text>
              <Text style={styles.value}>{walletData.credits}</Text>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              labelStyle={{
                color: "white",
              }}
              style={{
                backgroundColor: "black",
              }}
              onPress={onDismiss}
            >
              Close
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  value: {
    fontSize: 16,
  },
});
