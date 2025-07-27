import { withControllerHelpers } from "@/src/lib/cotroller-helpers";
import { LogInPageType } from "@components/sign-in/auth-types";
import { observable, Observable } from "@legendapp/state";
import { SignInController } from "../SignInController";
import { RNSB } from "@/src/controllers/supabase";

type EmailSignInState = {
  email: string;
  password: string;
  loading: boolean;
};

class EmailSignInControllerBase {
  public static state: Observable<EmailSignInState> =
    observable<EmailSignInState>({
      email: "",
      password: "",
      loading: false,
    });

  public static email = EmailSignInControllerBase.state.email;
  public static password = EmailSignInControllerBase.state.password;
  public static loading = EmailSignInControllerBase.state.loading;

  public static set(state: EmailSignInState) {
    EmailSignInControllerBase.state.set(state);
  }

  public static async submit(type: LogInPageType) {
    EmailSignInControllerBase.loading.set(true);
    SignInController.loading.set(true);
    SignInController.message.set("");
    const email = EmailSignInControllerBase.email.peek();
    const password = EmailSignInControllerBase.password.peek();

    let result;

    if (type === LogInPageType.LogIn) {
      result = await RNSB.signIn(email, password, "en", null);
    } else {
      result = await RNSB.signUpWithOtp(email, "en", null);
    }

    EmailSignInControllerBase.loading.set(false);
    SignInController.loading.set(false);
    if (result.error) {
      SignInController.message.set(result.error.message);
      return {
        value: null,
        error: result.error.message,
      };
    }

    EmailSignInControllerBase.loading.set(false);
    SignInController.loading.set(false);
    SignInController.message.set("");
    return {
      value: result.data.user,
      error: null,
    };
  }
}

export const EmailSignInController = withControllerHelpers(
  EmailSignInControllerBase,
);
