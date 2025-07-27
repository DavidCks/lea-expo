import { withControllerHelpers } from "@/src/lib/cotroller-helpers";
import { LogInPageType } from "@components/sign-in/auth-types";
import { observable, Observable } from "@legendapp/state";

type SignInState = {
  hasAcceptedTos: boolean;
  type: LogInPageType | null;
  loading: boolean;
  message: string;
};

class SignInControllerBase {
  public static state: Observable<SignInState> = observable<SignInState>({
    hasAcceptedTos: false,
    type: null,
    loading: false,
    message: "",
  });

  public static hasAcceptedTos = SignInControllerBase.state.hasAcceptedTos;
  public static message = SignInControllerBase.state.message;
  public static loading = SignInControllerBase.state.loading;
  public static type = SignInControllerBase.state.type;

  public static set(state: SignInState) {
    SignInControllerBase.state.set(state);
  }
}

export const SignInController = withControllerHelpers(SignInControllerBase);
