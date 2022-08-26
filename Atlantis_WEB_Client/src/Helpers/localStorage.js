export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem("itea_state", serializedState);
  } catch (error) {
    return;
  }
};

export const loadState = () => {
  try {
    const loadedState = sessionStorage.getItem("itea_state");

    if (loadedState === null) {
      return undefined;
    }

    return JSON.parse(loadedState);
  } catch (error) {
    return undefined;
  }
};
