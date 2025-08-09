import { useState, useEffect, useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { Button, Text } from "react-native-paper";
import { RNSB } from "@/src/controllers/supabase";
import { ArrowLeft } from "lucide-react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import LeaStream from "./avatar/LeaStream";

export function LeaScreen() {
  return (
    <View className="h-full">
      <LeaStream />
    </View>
  );
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await RNSB.client.auth.getSession();
        setSession(session);
        if (!session) {
          setError("Authentication required to access this content");
        }
      } catch (err) {
        console.error("Session error:", err);
        setError("Failed to verify authentication");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = RNSB.client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setError(session ? null : "Session expired. Please log in again");
    });

    return () => subscription.unsubscribe();
  }, []);

  const authUrl = useMemo(() => {
    if (!session) return null;

    const params = new URLSearchParams();
    params.append("sb_access_token", session.access_token);
    params.append("sb_refresh_token", session.refresh_token);

    const url = RNSB.getBackendUrl(`lea?${params.toString()}`, {
      forceProd: false,
    });
    console.log("[LeaScreen] accessing ", url);
    return url;
  }, [session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-blue-500" />
        <Text className="mt-4 text-lg dark:text-white">Loading session...</Text>
      </View>
    );
  }

  if (error || !session || !authUrl) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-white dark:bg-gray-900">
        <Text className="mb-6 text-center text-lg text-red-500 dark:text-red-400">
          {error}
        </Text>

        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          icon={({ size, color }) => <ArrowLeft size={size} color={color} />}
          className="w-full max-w-xs"
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <>
      <Button
        onPress={() => {
          ExpoPip.enterPipMode({
            width: 9,
            height: 16,
          });
        }}
      >
        <Text>PiP</Text>
      </Button>
      <View className="flex-1 bg-white dark:bg-gray-900">
        <WebView
          webviewDebuggingEnabled={true}
          className="flex-1 w-full"
          source={{ uri: authUrl }}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" className="text-blue-500" />
            </View>
          )}
        />
      </View>
    </>
  );
}
