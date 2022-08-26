import React, { useState, useContext } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import OnlineIcon from '../../Images/onlineIcon.png';
import OfflineIcon from '../../Images/offlineIcon.png';

import { Card, Nav, Button, Image } from 'react-bootstrap';
import { connect } from "react-redux";
import MQTTContext from "../MQTT/MQTTConnectionContext";
import moment from "moment";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { ThemeContext } from '../ThemeContext';
import '../../Styles/TopPanel.css'
import Cookies from 'universal-cookie';
import AlarmSoundfFile from '../../Sounds/alarm.wav';
import SettingsStyles from '../../Styles/SettingsStyles.css';

const Hub = (mqtt) => {
  const [shipConnected, setShipConnected] = useState(false);
  const cookies = new Cookies();
  const HDLimits = cookies.get('HallDeviceLimitsCookie');

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);

  const handleSubscribe = () => {
    var qos = 0;
    if (mqtt.mqtt.client) {
      mqtt.mqtt.client.subscribe("atlantis/hub", { qos }, (error) => {//topic - string, qos = 0
        if (error) {
          console.log("Subscribe to atlantis/hub topics error", error);
          return;
        }
        console.log("Subscribe to atlantis/hub topics error", error);
      });
    }
  };

  const requestRestart = () => {
    if (mqtt.mqtt.client) {

      mqtt.mqtt.client.publish("atlantis/hubnotify", "restart", { QoS: 0 }, (error) => {
        if (error) {
          console.log("Publish atlantis/hubnotify error: ", error);
        }
      });
    }
  };

  //console.log("STATE----->", mqtt.AtlantisHub);
  if (!shipConnected && mqtt.mqtt.client) {
    handleSubscribe();
    setShipConnected(true);
  }

  let shipData = null;

  if (mqtt.AtlantisHub.hub) {
    shipData = JSON.parse(mqtt.AtlantisHub.hub.message);
  }

  return (
    <>
      <div className="row hubnav" style={{ fontSize: '16px' }}>
        {shipData ?
          <>
            <p className="col-sm-2" > Server:
              <img src={mqtt.connectionStatus === 'Connected' && shipData ? OnlineIcon : OfflineIcon} width='10%' height="auto" alt="" rounded='true' style={{ margin: '1px 3px 3px 5px' }} />
              <button type="button" className="btn" onClick={requestRestart}>🔄</button>
            </p>
            <p className="col-sm-2">Hub state: {shipData.health}</p>
            <p className="col-sm-3">time:{shipData.dTime}</p>
            <p className="col-sm-2">SSID:{shipData.ssid}</p>
            <p className="col-sm-3">IP:{shipData.IP}</p>

          </> : <>
            <p>Hub is offline. Please check the configuration or\and the internet connection.</p>
          </>}
      </div>
    </>
  )
}



function mapStateToProps(state) {
  return {
    mqtt: state.mqtt.mqtt,
    connectionStatus: state.mqtt.mqtt.status.connectStatus,
    AtlantisHub: state.atlantisHub
  };
}
// const mapStateToProps = state => ({
//   mqtt: state.mqtt,
//   connectionStatus: state.connectionStatus
// });

const mapDispatchToProps = dispatch => ({
  getMoviesAction: pageId => {
    dispatch(MQTTContext.getMqttStatus());
  }
});



export default connect(mapStateToProps, mapDispatchToProps)(Hub);