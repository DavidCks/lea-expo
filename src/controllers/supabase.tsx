import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthError,
  createClient,
  processLock,
  Subscription,
  User,
} from "@supabase/supabase-js";
import { UserWalletsData } from "../lib/types/user_wallets";
import { UserSettingsData } from "../lib/types/user_settings";
import { SolanaSignInInput } from "@solana/wallet-standard-features";
import { TableNames } from "../lib/types/api";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { PublicKey } from "@solana/web3.js";
import { SOL } from "../lib/solana/client";
import Constants from "expo-constants";
import {
  EXPO_PUBLIC_ENVIRONMENT,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_PROD_BACKEND_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_URL,
} from "../env-vars";

export class RNSB {
  private static client: ReturnType<typeof createClient>;
  private static _authSubscription: Subscription | null = null;
  public static config = {
    creds: {
      url: "https://vnuzcehmzxilepfasyvl.supabase.co",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXpjZWhtenhpbGVwZmFzeXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1OTgxMTgsImV4cCI6MjA2MDE3NDExOH0.P5aD2OcN02GcJK-8l4ZXDmUR6ZVV05aOsxPqj1A8-wE",
    } as const,
    credits: {
      perLea: 0.000_000_04, //1 LEA equals 0.000_001
      perSession: -100,
      perMS: -0.001,
      updateIntervalMS: 5000,
    },
    voiceChatProvider: "openai" as const,
    system: {
      disableDailyMinimumCredits: false,
      enableCaptcha:
        process.env.NEXT_PUBLIC_PLATFORM === "mobile" ? false : true,
    },
    features: {
      transferCredits: {
        adminOnly: true,
      },
    },
    admins: [
      "38b9ad04-2625-43ee-861f-e3fce730d4a0",
      "157da423-7ca0-4728-8d21-d62a4ee3c423",
      "e0684ca1-ae88-4ed3-be64-fd414e70dde5",
      "94c57856-ee54-477f-91a5-5fc81fc66b1c",
    ] as string[],
  };

  // getters
  get client() {
    return RNSB.client;
  }
  get _authSubscription(): typeof RNSB._authSubscription {
    return RNSB._authSubscription;
  }

  // setters
  set client(client: typeof RNSB.client) {
    RNSB.client = client;
  }
  set _authSubscription(subscription: Subscription | null) {
    RNSB._authSubscription = subscription;
  }
  constructor() {}

  public static getBackendUrl(path: string) {
    let base: string = "";
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (
      (process.env.EXPO_PUBLIC_ENVIRONMENT ?? EXPO_PUBLIC_ENVIRONMENT) ===
        "local" &&
      debuggerHost
    ) {
      const ipAddress = debuggerHost.split(":")[0];
      base = `http://${ipAddress}:3000`;
      console.log("[Supabase] using local backend with ip:", base);
    } else if (
      process.env.EXPO_PUBLIC_PROD_BACKEND_URL ??
      EXPO_PUBLIC_PROD_BACKEND_URL
    ) {
      base =
        process.env.EXPO_PUBLIC_PROD_BACKEND_URL ??
        EXPO_PUBLIC_PROD_BACKEND_URL;
      console.log("[Supabase] using remote backend with ip:", base);
    } else {
      console.error(
        '[Supabase] No backend found. Set EXPO_PUBLIC_PROD_BACKEND_URL to the backend api or run the server locally and set EXPO_PUBLIC_ENVIRONMENT to "local"',
      );
    }
    const url = new URL(path, base);
    return url.href;
  }

  private static ensureInitialized() {
    if (RNSB.client) {
      return;
    }
    GoogleSignin.configure({
      // scopes: ['https://www.googleapis.com/auth/drive.readonly'], // Add any scopes you need
      webClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
    RNSB.client = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? EXPO_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        EXPO_PUBLIC_SUPABASE_ANON_KEY,
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
    RNSB._subscribeToAuthStateChange();
  }

  static _subscribeToAuthStateChange() {
    const { data } = RNSB.client.auth.onAuthStateChange((event, session) => {
      console.log(event, session);

      if (event === "INITIAL_SESSION") {
        // handle initial session
      } else if (event === "SIGNED_IN") {
        // handle sign in event
      } else if (event === "SIGNED_OUT") {
        // handle sign out event
      } else if (event === "PASSWORD_RECOVERY") {
        // handle password recovery event
      } else if (event === "TOKEN_REFRESHED") {
        // handle token refreshed event
      } else if (event === "USER_UPDATED") {
        // handle user updated event
      }
    });
    RNSB._authSubscription = data.subscription;
  }

  static _unsubscribeFromAuthStateChange() {
    RNSB._authSubscription?.unsubscribe();
  }
  static async addNewsletterSubscription(
    email: string,
  ): Promise<{ success: boolean; error: string | null }> {
    RNSB.ensureInitialized();
    // Check if email is valid
    if (!/\S+@\S+\.\S+/.test(email)) {
      console.error("Invalid email format");
      return { success: false, error: "Invalid email format" };
    }

    // Insert email into Supabase
    const result = await RNSB.client.from("newsletter").insert([{ email }]);

    if (result.error) {
      console.error(
        "Error inserting email:",
        result.error,
        "Status:",
        result.status,
      );
      if (result.error.code === "23505") {
        return { success: false, error: "You are already subscribed" };
      } else {
        return { success: false, error: result.error.message };
      }
    } else {
      console.log("Email inserted successfully");
      return { success: true, error: null };
    }
  }

  static async isSignedIn() {
    RNSB.ensureInitialized();
    const result = await RNSB.client.auth.getUser();
    if (result.error) {
      // console.error("Error getting user:", result.error.message);
      return false;
    } else {
      return true;
    }
  }

  static async fetchWithAuth(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = 30000, // optional timeout in milliseconds
  ): Promise<Response> {
    RNSB.ensureInitialized();

    const {
      data: { session },
    } = await RNSB.client.auth.getSession();

    const headers = new Headers(options.headers);
    if (session) {
      headers.append("Authorization", `Bearer ${session.access_token}`);
    }

    const controller = new AbortController();
    const timeout =
      timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as any).name === "AbortError") {
        console.error(
          `[fetchWithAuth] Request to ${url} timed out after ${timeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  static async getActiveUsers(): Promise<number> {
    try {
      const url = RNSB.getBackendUrl("/api/active-users");
      console.log("Sending request to", url);
      const res = await RNSB.fetchWithAuth(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch active users: ${res.status}`);
      }

      const data = await res.json();
      return data.activeSessions;
    } catch (error) {
      console.error("Error in getActiveUsers:", error);
      return 0;
    }
  }

  static async setCurrentUserWalletsData(data: {
    user_wallets: UserWalletsData;
  }): Promise<{ ok: boolean }> {
    RNSB.ensureInitialized();
    const userResult = await RNSB.client.auth.getUser();
    if (userResult.error) {
      console.error("Error getting user:", userResult.error.message);
      return { ok: false };
    }
    const user_wallets = await RNSB.client
      .from("user_wallets")
      .update(data.user_wallets)
      .eq("user_uid", userResult.data.user.id)
      .select("*");
    if (user_wallets.error) {
      console.error("Error updating session data:", user_wallets.error.message);
      return { ok: false };
    }
    RNSB._notifyListeners({
      userWalletsData: user_wallets.data[0] as UserWalletsData,
    });
    return { ok: true };
  }

  static async getCurrentUserWalletsData(): Promise<
    | (User & {
        userWalletsData: UserWalletsData;
      } & {
        ok: boolean;
      })
    | null
  > {
    RNSB.ensureInitialized();
    const userReslt = await RNSB.client.auth.getUser();
    if (userReslt.error) {
      console.error("Error getting user:", userReslt.error.message);
      return null;
    }
    const session_data = await RNSB.client.from("user_wallets").select();
    if (session_data.error) {
      console.error("Error getting wallets data:", session_data.error.message);
      return null;
    }

    return {
      ...userReslt.data.user,
      userWalletsData: session_data.data[0]! as UserWalletsData,
      ok: true,
    };
  }

  private static async _updateCredits(updater: (credits: number) => number) {
    const current = await RNSB.getCurrentUserWalletsData();
    if (!current?.ok) {
      return false;
    }
    const newCredits = updater(parseInt(current.userWalletsData.credits));
    const newData: UserWalletsData = {
      ...current.userWalletsData,
      credits: `${newCredits}`,
      updated_at: new Date().toISOString(),
    };
    const update = await RNSB.setCurrentUserWalletsData({
      user_wallets: newData,
    });
    return update.ok;
  }

  private static async _updateWallet(
    walletAddress: UserWalletsData["wallet_address"],
  ) {
    const user = await RNSB.getCurrentUser();
    if (!user) {
      return null;
    }

    try {
      const url = RNSB.getBackendUrl("/api/update-wallet");
      console.log("Sending request to", url);
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update wallet: ${res.status}`);
      }

      const data = (await res.json()) as UserWalletsData;
      RNSB._notifyListeners({
        userWalletsData: data,
      });
      return data;
    } catch (error) {
      console.error("Error in updateWallet:", error);
      return null;
    }
  }

  private static _prevUpdateFuture: Promise<unknown> = Promise.resolve(true);

  static async updateCredits(
    updater: (credits: number) => number,
  ): Promise<boolean> {
    const runAfter = RNSB._prevUpdateFuture;
    const nextUpdate = runAfter.then(async () => {
      try {
        const update = await RNSB._updateCredits(updater);
        return update;
      } catch (err) {
        console.error("Failed to update credits", err);
        return false; // or rethrow if you want to bubble it up
      }
    });
    RNSB._prevUpdateFuture = nextUpdate;
    return nextUpdate;
  }

  static async setWalletEmail(email: string): Promise<{
    ok: boolean;
    value: null;
    error: string | null;
  }> {
    const user = await RNSB.getCurrentUser();
    if (!user) {
      return {
        value: null,
        ok: false,
        error: "Not logged in",
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    if (!isValidEmail) {
      return {
        value: null,
        ok: false,
        error: "Invalid email format",
      };
    }

    try {
      const { error } = await RNSB.client.auth.updateUser({
        data: {
          wallet_email: email,
        },
      });

      if (error) {
        throw new Error(`Failed to update wallet email: ${error.message}`);
      }

      return {
        value: null,
        ok: true,
        error: null,
      };
    } catch (error) {
      console.error("Error in setWalletEmail:", error);
      return {
        value: null,
        ok: false,
        error: `${error}`,
      };
    }
  }

  static async sendCredits(
    emailOrWallet: string,
    amount: string,
  ): Promise<{
    value: UserWalletsData | null;
    ok: boolean;
    error: string | null;
  }> {
    const user = await RNSB.getCurrentUser();
    if (!user) {
      return {
        value: null,
        ok: false,
        error: "Not logged in",
      };
    }

    try {
      const url = RNSB.getBackendUrl("/api/send-credits");
      console.log("Sending request to", url);
      const res = await RNSB.fetchWithAuth(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: user.id,
          to: emailOrWallet,
          amount,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send credits: (${res.status})`);
      }

      const data = (await res.json()) as UserWalletsData;
      RNSB._notifyListeners({
        userWalletsData: data,
      });
      return {
        ok: true,
        value: data,
        error: null,
      };
    } catch (error) {
      console.error("Error in updateWallet:", error);
      return {
        value: null,
        ok: false,
        error: `${error}`,
      };
    }
  }

  static async updateWallet(walletAddress: UserWalletsData["wallet_address"]) {
    const runAfter = RNSB._prevUpdateFuture;
    const nextUpdate = runAfter.then(async () => {
      try {
        const update = await RNSB._updateWallet(walletAddress);
        return update;
      } catch (err) {
        console.error("Failed to update wallet", err);
        return null; // or rethrow if you want to bubble it up
      }
    });

    RNSB._prevUpdateFuture = nextUpdate;
    return nextUpdate;
  }

  static async getCurrentUser() {
    const result = await RNSB.getCurrentUserWalletsData();
    return result;
  }

  static async verifySignUpOtp(email: string, password: string, token: string) {
    const { error } = await RNSB.client.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      return {
        value: null,
        error: error.message,
      };
    }

    const updateRes = await RNSB.client.auth.updateUser({
      password: password,
    });

    if (updateRes.error) {
      return {
        value: null,
        error: updateRes.error.message,
      };
    }

    return {
      value: updateRes.data,
      error: null,
    };
  }

  static async signOut() {
    RNSB.ensureInitialized();
    const result = await RNSB.client.auth.signOut();
    if (result.error) {
      console.error("Error signing out:", result.error.message);
    } else {
      console.log("User signed out");
    }
    return result;
  }

  static async getCurrentUserWithSettings() {
    const result = await RNSB.getCurrentUserWalletsData();
    if (!result?.ok) {
      console.error("Error getting user:", `${result}`);
      return null;
    }
    const user = result as User & { userWalletsData: UserWalletsData };
    const userSettings = await RNSB.client
      .from("user_settings")
      .select("*")
      .eq("user_uid", user.id);
    if (userSettings.error) {
      console.error("Error getting user settings:", userSettings.error.message);
      return null;
    }
    const settings: UserSettingsData = userSettings.data[0] as UserSettingsData;
    if (!settings || userSettings.data.length === 0) {
      console.error("No user settings found");
      return null;
    } else if (userSettings.data.length > 1) {
      console.error("Multiple user settings found");
      return null;
    }
    return {
      ...user,
      settings: settings,
    };
  }

  static async setUserSettings(
    settings: UserSettingsData,
  ): Promise<{ ok: boolean; error: string | null }> {
    RNSB.ensureInitialized();
    const userResult = await RNSB.client.auth.getUser();
    if (userResult.error) {
      console.error("Error getting user:", userResult.error.message);
      return {
        ok: false,
        error: userResult.error.message,
      };
    }
    const { data, error } = await RNSB.client
      .from("user_settings")
      .update(settings)
      .eq("user_uid", userResult.data.user.id)
      .select("*");
    if (error) {
      console.error("Error updating user settings:", error.message);
      return {
        ok: false,
        error: error.message,
      };
    }
    RNSB._notifyListeners({
      settingsData: data[0] as UserSettingsData,
    });
    return { ok: true, error: null };
  }

  static async signInWithGoogle() {
    RNSB.ensureInitialized();
    try {
      const hasPlayServices = await GoogleSignin.hasPlayServices();
      if (!hasPlayServices) {
        return {
          value: null,
          error: "Google Sign-In failed: No play services installed",
        };
      }
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      if (!userInfo.data || !userInfo.data.idToken) {
        return {
          value: null,
          error: "Google Sign-In failed: No ID token present",
        };
      }
      const { data, error } = await RNSB.client.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });
      if (error) {
        return {
          value: null,
          error: error.message,
        };
      }
      console.log("Successfully signed in with Google:", data);
      return {
        value: data,
        error: null,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        return {
          value: null,
          error: "User cancelled auth request",
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        return {
          value: null,
          error: "Sign-in is already in progress",
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        return {
          value: null,
          error: "Google Play Services are not available or outdated.",
        };
      } else {
        // some other error happened
        return {
          value: null,
          error: "Google Sign-In Error: An unknown error occurred",
        };
      }
    }
  }

  // Helper method to create sign-in message for wallets without signIn
  static createSignInMessage(signInData: SolanaSignInInput) {
    const {
      domain,
      address,
      statement,
      uri,
      version,
      nonce,
      issuedAt,
      resources,
    } = signInData;

    let message = `${domain} wants you to sign in with your Solana account:\n`;
    message += `${address}\n\n`;
    if (statement) {
      message += `${statement}\n\n`;
    }
    message += `URI: ${uri}\n`;
    message += `Version: ${version}\n`;
    message += `Nonce: ${nonce}\n`;
    message += `Issued At: ${issuedAt}`;

    if (resources && resources.length > 0) {
      message += `\nResources:\n`;
      resources.forEach((resource: string) => {
        message += `- ${resource}\n`;
      });
    }

    const messageBytes = new TextEncoder().encode(message);
    return { message, messageBytes };
  }

  async signUp(
    email: string,
    password: string,
    lang: string,
    referrer: string | null,
  ) {
    return RNSB.signUp(email, password, lang, referrer);
  }

  static async signUp(
    email: string,
    password: string,
    lang: string,
    referrer: string | null,
  ): Promise<ReturnType<typeof RNSB.client.auth.signUp>> {
    RNSB.ensureInitialized();
    const originPath = window.location.origin;
    const langPath = lang !== "" ? `/${lang}` : "";
    const emailRedirectTo = `${originPath}${langPath}/confirm`;

    const result = await RNSB.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirectTo,
        data: {
          referrer: referrer,
        },
      },
    });

    if (result.error) {
      console.error("Signup error:", result.error.message);
    } else {
      console.log("User signed up:", result.data.user);
      // Email users keep the default 500 credits from DB trigger
      // No additional action needed here
    }

    return result;
  }

  static async signInWithSolana(
    webUrl: string,
    publicKey: PublicKey,
    options: {
      messageSigner: (message: Uint8Array) => Promise<Uint8Array>;
    },
  ) {
    RNSB.ensureInitialized();
    const message = await SOL.createSignInData(
      "https://lealabs.io",
      publicKey.toBase58(),
    );
    if (message.error) {
      return {
        value: null,
        error: "An error occured whie generating the sign in message",
      };
    }
    const { message: messageString, messageBytes } = RNSB.createSignInMessage(
      message.value,
    );
    console.log("RNSB", "Generated message: ", messageString);
    let signature: Uint8Array;
    try {
      signature = await options.messageSigner(messageBytes);
      console.log(
        "RNSB",
        "Signature:",
        Buffer.from(signature).toString("base64"),
      );
    } catch (e) {
      console.error(
        "RNSB",
        "An error happened during message signing",
        `${JSON.stringify(e)}`,
      );
      return {
        value: null,
        error:
          "RNSB" +
          "An error happened during message signing" +
          `${JSON.stringify(e)}`,
      };
    }
    return await RNSB.signInWithSignedMessage(messageBytes, signature);
  }

  static async signInWithSignedMessage(
    message: Uint8Array,
    signature: Uint8Array,
  ) {
    RNSB.ensureInitialized();
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL ?? EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=web3`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey:
            process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
            EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          chain: "solana",
          message: new TextDecoder().decode(message),
          signature: Buffer.from(signature).toString("base64"),
        }),
      },
    );
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error signing in with Solana:", errorText);
      console.log(Buffer.from(signature).toString("base64"));
      return {
        value: null,
        error: errorText,
      };
    }
    const { access_token, refresh_token } = await res.json();
    const response = await RNSB.client.auth.setSession({
      access_token,
      refresh_token,
    });

    if (response.error) {
      console.log(response.error.message);
      return {
        value: null,
        error: response.error.message,
      };
    }

    if (!response.data.user) {
      return {
        value: null,
        error: "No user returned by supabase backend",
      };
    }

    if (!response.data.session) {
      return {
        value: null,
        error: "No session returned by supabase backend",
      };
    }

    return {
      value: response.data,
      error: null,
    };
  }

  async signUpWithOtp(email: string, lang: string, referrer: string | null) {
    RNSB.signUpWithOtp(email, lang, referrer);
  }

  static async signUpWithOtp(
    email: string,
    lang: string,
    referrer: string | null,
  ): Promise<ReturnType<typeof RNSB.client.auth.signInWithOtp>> {
    RNSB.ensureInitialized();
    console.log("signing up with ", email);
    const result = await RNSB.client.auth.signInWithOtp({
      email,
      options: {
        data: {
          referrer: referrer,
          useToken: true,
        },
      },
    });

    if (result.error) {
      console.error("Signup error:", result.error.message);
    } else {
      console.log("User signed up:", result.data);
    }

    return result;
  }

  static async updateUserMetadata(
    update: (metadata: User["user_metadata"]) => User["user_metadata"],
  ) {
    RNSB.ensureInitialized();
    const currentUser = await RNSB.getCurrentUser();

    if (!currentUser || !currentUser.ok) {
      return {
        value: null,
        error: "Couldn't get current user to update metadata",
      };
    }

    const currentMetadata = currentUser.user_metadata || {};
    const updatedMetadata = update(currentMetadata);

    const { data, error } = await RNSB.client.auth.updateUser({
      data: updatedMetadata,
    });

    if (error) {
      return {
        value: null,
        error: error.message,
      };
    }

    return {
      value: data.user,
      error: null,
    };
  }

  async signIn(
    email: string,
    password: string,
    _lang: string,
    _referrer: string | null,
  ) {
    return RNSB.signIn(email, password, _lang, _referrer);
  }

  static async signIn(
    email: string,
    password: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _lang: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _referrer: string | null,
  ): Promise<ReturnType<typeof RNSB.client.auth.signInWithPassword>> {
    RNSB.ensureInitialized();
    const result = await RNSB.client.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) {
      console.error("Login error:", result.error.message);
    } else {
      console.log("User signed in:", result.data.user, result.data.session);
    }
    return result;
  }

  //http://localhost:3000/confirm#access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IkJKRnJDaGRqL29rYlVweTUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL216eWtmZWd4ZHVkbG5xYnlkb2x2LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyMGU4MjExYS1hOTYxLTRjZDktYjUxZS04MTE3YWQyMDUwODYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQxMTUwNTA1LCJpYXQiOjE3NDExNDY5MDUsImVtYWlsIjoiZGF2aWRja3NzQHByb3Rvbi5tZSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJkYXZpZGNrc3NAcHJvdG9uLm1lIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMjBlODIxMWEtYTk2MS00Y2Q5LWI1MWUtODExN2FkMjA1MDg2In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzQxMTQ2OTA1fV0sInNlc3Npb25faWQiOiJmNzBiNTMxNS1mZTNmLTQ2ZTYtYmNhZi05MzFjY2RiZWMxMWMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.jISPSZC91WeoZg-CMh3rk2vOS_pQZ5X9Gs3dbZ5o8eo&expires_at=1741150505&expires_in=3600&refresh_token=BswvPx9AQq9lDt_v-P1aEw&token_type=bearer&type=signup
  async confirmSignUp(): Promise<{ error: AuthError } | null> {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get("access_token") ?? "";
    const refreshToken = urlParams.get("refresh_token") ?? "";
    const code = urlParams.get("code") ?? "";

    if (!accessToken && !refreshToken && !code) {
      const user = await this.client.auth.getUser();
      if (user.error) {
        return { error: user.error };
      }
      return null;
    }

    if (code) {
      const response = await this.client.auth.exchangeCodeForSession(code);
      if (response.error) {
        return {
          error: response.error,
        };
      }
      return null;
    }

    const result = await this.client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (result.error) {
      console.error("Error confirming login:", result.error.message);
      return { error: result.error };
    } else {
      console.log("User session:", result.data.session);
      return null;
    }
  }

  async signOut(): Promise<ReturnType<typeof this.client.auth.signOut>> {
    return await RNSB.signOut();
  }

  private static _listeners: ((
    tables: TableNames[],
    data: {
      userWalletsData: UserWalletsData | null;
      settingsData: UserSettingsData | null;
    },
  ) => void)[] = [];

  // Register a listener
  public static on(
    listener: (
      tables: TableNames[],
      data: {
        userWalletsData: UserWalletsData | null;
        settingsData: UserSettingsData | null;
      },
    ) => void,
  ): void {
    RNSB._listeners.push(listener);
  }

  // Remove a listener
  public static off(
    listener: (
      tables: TableNames[],
      data: {
        userWalletsData: UserWalletsData | null;
        settingsData: UserSettingsData | null;
      },
    ) => void,
  ): void {
    RNSB._listeners = RNSB._listeners.filter((l) => l !== listener);
  }

  private static _notifyListeners(data: {
    userWalletsData?: UserWalletsData;
    settingsData?: UserSettingsData;
  }) {
    const listenerData = RNSB._createListenerData(data);
    RNSB._listeners.forEach((l) => {
      l(listenerData.tables, listenerData.data);
    });
  }

  private static _createListenerData(data: {
    userWalletsData?: UserWalletsData;
    settingsData?: UserSettingsData;
  }) {
    const tables: TableNames[] = [];
    if (data.userWalletsData) {
      tables.push("user_wallets");
    }
    if (data.settingsData) {
      tables.push("user_settings");
    }
    return {
      tables,
      data: {
        userWalletsData: data.userWalletsData ?? null,
        settingsData: data.settingsData ?? null,
      },
    };
  }
}
