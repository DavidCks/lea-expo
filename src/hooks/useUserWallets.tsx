import { useState, useEffect } from "react";
import { UserWalletsData } from "../lib/types/user_wallets";
import { RNSB } from "../controllers/supabase";

export function useUserWallets() {
  const [data, setData] = useState<UserWalletsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(false);
    const newDataSetter = (newData: UserWalletsData) => {
      setData(newData);
      setLoading(false);
    };
    RNSB.getCurrentUserWalletsData().then((d) => {
      if (!d?.ok) {
        console.error("Error fetching wallet");
        return;
      }
      newDataSetter(d.userWalletsData);
    });

    const newDataListener: Parameters<typeof RNSB.on>[0] = (_tables, data) => {
      console.log("Updaing user data...");
      if (data.userWalletsData) {
        newDataSetter(data.userWalletsData);
      }
    };
    RNSB.on(newDataListener);
  }, []);

  return { data, loading };
}
