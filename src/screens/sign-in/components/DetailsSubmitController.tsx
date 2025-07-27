import { RNSB } from "@/src/controllers/supabase";
import { withControllerHelpers } from "@/src/lib/cotroller-helpers";
import { observable, Observable } from "@legendapp/state";
import { SignInController } from "../SignInController";

type DetailsSubmitState = {
  loading: boolean;
  name: string;
  age: number | null;
  hobbys: string;
  personality: string;
};

class DetailsSubmitControllerBase {
  public static state: Observable<DetailsSubmitState> =
    observable<DetailsSubmitState>({
      loading: false,
      name: "",
      age: null,
      hobbys: "",
      personality: "",
    });

  public static set(state: DetailsSubmitState) {
    DetailsSubmitControllerBase.state.set(state);
  }

  public static async submit() {
    DetailsSubmitControllerBase.state.loading.set(true);
    SignInController.loading.set(true);
    SignInController.state.message.set("");
    const updatedUser = await RNSB.updateUserMetadata((metadata) => {
      const newMetadata = {
        name: DetailsSubmitControllerBase.state.name.peek(),
        age: DetailsSubmitControllerBase.state.age.peek(),
        hobbys: DetailsSubmitControllerBase.state.hobbys.peek(),
        personality: DetailsSubmitControllerBase.state.personality.peek(),
      };
      return {
        ...metadata,
        ...newMetadata,
      };
    });
    DetailsSubmitControllerBase.state.loading.set(false);
    SignInController.loading.set(false);
    if (updatedUser.error) {
      SignInController.state.message.set(updatedUser.error);
      return;
    }

    if (!updatedUser.value) {
      SignInController.state.message.set("Error updating metadata");
      return;
    }
    return updatedUser.value;
  }
}

export const DetailsSubmitController = withControllerHelpers(
  DetailsSubmitControllerBase,
);
