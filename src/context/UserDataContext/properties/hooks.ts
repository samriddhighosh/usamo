import { UserData, useUpdateUserData, useUserData } from '../UserDataContext';

export function createUserDataGetter<ReturnValue>(
  getter: (userData: UserData) => ReturnValue
): () => ReturnValue {
  return () => {
    const userData = useUserData();
    return getter(userData);
  };
}

/**
 * Helper function to create a user data mutation hook
 *
 * @param updateFunc
 * This function is given the "latest" copy of userData (see below for what "latest"
 * means), and returns an object:
 * - the localStorageUpdate key holds changes that will be shallowly merged with the
 *   old userData object and written back to localStorage, if the user isn't logged in
 * - the remoteUpdate key holds changes that will be written to Supabase
 *   (user_data JSON), if the user is logged in
 *
 * If the user is not logged in (ie. the localStorageUpdate path), the "latest" copy
 * of userData is guaranteed to be the latest.
 *
 * If the user is logged in, the updateFunc is given a *probably latest* copy
 * of userData (since Supabase realtime should keep our userData object up to date).
 * It's NOT guaranteed to be the latest, since there could be
 * network failures or race conditions, and we are NOT wrapping this
 * in a transaction for the sake of speed. For our use
 * cases, it's fine for userData to possibly be a bit outdated, since none
 * of our updates are destructive / depend on previous userData except for
 * consecutiveVisits, which isn't too bad to lose.
 *
 * @returns A user data mutation hook
 */
export function createUserDataMutation<T extends unknown[]>(
  updateFunc: (
    userData: UserData,
    ...updatePayload: T
  ) => {
    localStorageUpdate: Partial<UserData>;
    remoteUpdate: object;
  }
): () => (...updatePayload: T) => void {
  return () => {
    const updateUserData = useUpdateUserData();
    return (...updatePayload: T) => {
      updateUserData((prevUserData: UserData) =>
        updateFunc(prevUserData, ...updatePayload)
      );
    };
  };
}

/**
 * Helper function to create a "simple" user data mutation hook,
 * where the localStorageUpdate and the remoteUpdate objects are the same.
 */
export function createSimpleUserDataMutation<T extends unknown[]>(
  mutation: (userData: UserData, ...updatePayload: T) => Partial<UserData>
): () => (...upatePayload: T) => void {
  return createUserDataMutation((userData, ...updatePayload) => {
    const changes = mutation(userData, ...updatePayload);
    return {
      localStorageUpdate: changes,
      remoteUpdate: changes,
    };
  });
}
