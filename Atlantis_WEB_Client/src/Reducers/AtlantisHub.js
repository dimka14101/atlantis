
// Context
const initialState = {
  shipName: "",
  shipData: null,
  kitchenData: null,
  hallData: null,
  bathData: null,
  hub: null,
  lastUpdateTime: null
};

const mqttReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'atlantis/brooks'://action.type.startsWith("esp32"):
      return {
        ...state,
        shipName: action.type,
        shipData: action.payload,
        lastUpdateTime: action.payload.lastUpdateTime
      };
    case 'atlantis/kitchen'://action.type.startsWith("esp32"):
      return {
        ...state,
        shipName: action.type,
        kitchenData: action.payload,
        lastUpdateTime: action.payload.lastUpdateTime
      };
    case 'atlantis/hall'://action.type.startsWith("esp32"):
      return {
        ...state,
        shipName: action.type,
        hallData: action.payload,
        lastUpdateTime: action.payload.lastUpdateTime
      };
    case 'atlantis/bath'://action.type.startsWith("esp32"):
      return {
        ...state,
        shipName: action.type,
        bathData: action.payload,
        lastUpdateTime: action.payload.lastUpdateTime
      };
    case 'atlantis/hub'://action.type.startsWith("esp32"):
      return {
        ...state,
        shipName: action.type,
        hub: action.payload,
        lastUpdateTime: action.payload.lastUpdateTime
      };
    default:
      return state;
  }
};

export default mqttReducer;
