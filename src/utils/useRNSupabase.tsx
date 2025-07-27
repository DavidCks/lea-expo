import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { useSupabase } from "@root/src/app/__supabase__/useSupabase";
import { supabaseConfig } from "@root/src/app/__supabase__/supabase-client";
import { useEffect } from "react";

// Create the React Native specific Supabase client
const supabase = createClient(
  supabaseConfig.creds.url,
  supabaseConfig.creds.key,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);

// Variable to track if the AppState listener has been added
let appStateListenerRegistered = false;

// This function registers the listener to manage session refresh.
const registerAppStateListener = () => {
  if (appStateListenerRegistered) return;

  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });

  appStateListenerRegistered = true;
};

export const useRNSupabase = () => {
  // Call the original hook to get the base Supabase object
  const ogSupabase = useSupabase();

  useEffect(() => {
    // Register the AppState listener for auth refresh, only once.
    registerAppStateListener();
  }, []);

  // Overwrite the client property on the original object
  if (ogSupabase) {
    ogSupabase.client = supabase;
  }

  return ogSupabase;
};
