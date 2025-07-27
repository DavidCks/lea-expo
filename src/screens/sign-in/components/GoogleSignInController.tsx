import { RNSB } from "@/src/controllers/supabase";
import { withControllerHelpers } from "@/src/lib/cotroller-helpers";
import { SignInController } from "../SignInController";
import { Observable, observable } from "@legendapp/state";

type GoogleSignInState = {
  loading: boolean;
};

class GoogleSignInControllerBase {
  public static state: Observable<GoogleSignInState> =
    observable<GoogleSignInState>({
      loading: false,
    });
  public static loading = GoogleSignInControllerBase.state.loading;

  public static set(state: GoogleSignInState) {
    GoogleSignInControllerBase.state.set(state);
  }

  public static async signIn() {
    GoogleSignInControllerBase.loading.set(true);
    SignInController.state.loading.set(true);
    SignInController.state.message.set("");
    const data = await RNSB.signInWithGoogle();
    GoogleSignInControllerBase.loading.set(false);
    SignInController.loading.set(false);
    if (data.error) {
      SignInController.message.set(data.error);
      return data;
    } else if (!data.value?.user) {
      const msg =
        "Couldn't retrieve user using google sign in. Please use another authentication method.";
      SignInController.message.set(msg);
      return {
        value: null,
        error: msg,
      };
    } else {
      SignInController.message.set("");
      return {
        value: data.value?.user,
        error: null,
      };
    }
  }
}

export const GoogleSignInController = withControllerHelpers(
  GoogleSignInControllerBase,
);
