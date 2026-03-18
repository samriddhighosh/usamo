import { UserData } from '../UserDataContext';
import { createUserDataGetter, createUserDataMutation } from './hooks';

export const useLastVisitInfo = createUserDataGetter(userData => {
  return {
    lastVisitDate: userData.lastVisitDate,
    consecutiveVisits: userData.consecutiveVisits,
    numPageviews: userData.numPageviews,
    pageviewsPerDay: userData.pageviewsPerDay,
  };
});
export const useSetLastVisitDate = createUserDataMutation(
  (
    userData,
    {
      lastVisitDate,
      lastViewedModule,
    }: { lastVisitDate: number; lastViewedModule?: string }
  ) => {
    const timeSinceLastVisit = lastVisitDate - userData.lastVisitDate;
    const oneDay = 1000 * 60 * 60 * 20,
      twoDays = 1000 * 60 * 60 * 24 * 2;

    const changes: {
      localStorageUpdate: Partial<UserData>;
      remoteUpdate: Partial<UserData>;
    } = {
      localStorageUpdate: {},
      remoteUpdate: {},
    };

    if (timeSinceLastVisit >= oneDay && timeSinceLastVisit <= twoDays) {
      changes.localStorageUpdate['lastVisitDate'] = lastVisitDate;
      changes.remoteUpdate['lastVisitDate'] = lastVisitDate;
      changes.localStorageUpdate['consecutiveVisits'] =
        userData.consecutiveVisits + 1;
      changes.remoteUpdate['consecutiveVisits'] =
        userData.consecutiveVisits + 1;
    } else if (timeSinceLastVisit > twoDays) {
      changes.localStorageUpdate['lastVisitDate'] = lastVisitDate;
      changes.remoteUpdate['lastVisitDate'] = lastVisitDate;
      changes.localStorageUpdate['consecutiveVisits'] = 1;
      changes.remoteUpdate[`consecutiveVisits`] = 1;
    }
    changes.localStorageUpdate['numPageviews'] = userData.numPageviews + 1;
    changes.localStorageUpdate['pageviewsPerDay'] = {
      ...userData.pageviewsPerDay,
    };

    const todayDate = new Date(lastVisitDate);
    todayDate.setHours(0, 0, 0, 0);
    const todayDateTimestamp = todayDate.getTime();
    if (todayDateTimestamp in changes.localStorageUpdate.pageviewsPerDay) {
      changes.localStorageUpdate.pageviewsPerDay[todayDateTimestamp]++;
    } else {
      changes.localStorageUpdate.pageviewsPerDay[todayDateTimestamp] = 1;
    }

    changes.remoteUpdate['numPageviews'] =
      changes.localStorageUpdate.numPageviews;
    changes.remoteUpdate['pageviewsPerDay'] =
      changes.localStorageUpdate.pageviewsPerDay;

    if (lastViewedModule) {
      changes.localStorageUpdate.lastViewedModule = lastViewedModule;
      changes.remoteUpdate.lastViewedModule = lastViewedModule;
    }

    return changes;
  }
);
