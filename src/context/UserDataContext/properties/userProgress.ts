import { ModuleProgress } from '../../../models/module';
import { ProblemProgress } from '../../../models/problem';
import { ResourceProgress } from '../../../models/resource';
import { createUserDataGetter, createUserDataMutation } from './hooks';

export const useUserProgressOnModules = createUserDataGetter(
  userData => userData.userProgressOnModules
);
export const useUserProgressOnModulesActivity = createUserDataGetter(
  userData => userData.userProgressOnModulesActivity
);

export const useUserProgressOnProblemsActivity = createUserDataGetter(
  userData => userData.userProgressOnProblemsActivity
);
export const useUserProgressOnProblems = createUserDataGetter(
  userData => userData.userProgressOnProblems
);

export const useUserProgressOnResources = createUserDataGetter(
  userData => userData.userProgressOnResources
);

export const useSetProgressOnModule = createUserDataMutation(
  (userData, moduleID: string, progress: ModuleProgress) => {
    const newActivityData = {
      timestamp: Date.now(),
      moduleID: moduleID,
      moduleProgress: progress,
    };
    return {
      localStorageUpdate: {
        userProgressOnModules: {
          ...userData.userProgressOnModules,
          [moduleID]: progress,
        },
        userProgressOnModulesActivity: [
          ...userData.userProgressOnModulesActivity,
          newActivityData,
        ],
      },
      remoteUpdate: {
        userProgressOnModules: {
          ...userData.userProgressOnModules,
          [moduleID]: progress,
        },
        userProgressOnModulesActivity: [
          ...userData.userProgressOnModulesActivity,
          newActivityData,
        ],
      },
    };
  }
);

export const useSetProgressOnProblem = createUserDataMutation(
  (userData, problemID: string, progress: ProblemProgress) => {
    const newActivityData = {
      timestamp: Date.now(),
      problemID: problemID,
      problemProgress: progress,
    };
    return {
      localStorageUpdate: {
        userProgressOnProblems: {
          ...userData.userProgressOnProblems,
          [problemID]: progress,
        },
        userProgressOnProblemsActivity: [
          ...userData.userProgressOnProblemsActivity,
          newActivityData,
        ],
      },
      remoteUpdate: {
        userProgressOnProblems: {
          ...userData.userProgressOnProblems,
          [problemID]: progress,
        },
        userProgressOnProblemsActivity: [
          ...userData.userProgressOnProblemsActivity,
          newActivityData,
        ],
      },
    };
  }
);

export const replaceIllegalResourceKeyCharacters = (str: string) => {
  return str.replace(/[^a-zA-Z0-9]/g, ''); // technically only ~*/[] aren't allowed but whatever
};
export const useSetProgressOnResource = createUserDataMutation(
  (userData, resourceID: string, progress: ResourceProgress) => {
    resourceID = replaceIllegalResourceKeyCharacters(resourceID);
    return {
      localStorageUpdate: {
        userProgressOnResources: {
          ...userData.userProgressOnResources,
          [resourceID]: progress,
        },
      },
      remoteUpdate: {
        userProgressOnResources: {
          ...userData.userProgressOnResources,
          [resourceID]: progress,
        },
      },
    };
  }
);
