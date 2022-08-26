
// Context
const initialState = {
  mqtt: {
    status: {
      record: {
        host: "0.0.0.0",
        clientId: `no_mqtt_id`,
        port: 14101,
        username: "no_mqtt_user",
        password: "no_mqtt_pass"
      },
      connectStatus: "NotConnected"
    },
    client: undefined
  }
};

const mqttReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'mqttConnect':
      return {
        ...state,
        connectionStatus: 'Off',
      };
    case 'mqttStatus':
      return {
        ...state,
        connectionStatus: 'Online',
        mqtt: action.payload,
      };
    case action.type.startsWith("esp32"):
      return {
        ...state,
        shipName: action.type,
        mqtt: action.payload,
      };
    default:
      return state;
  }
};

export default mqttReducer;
