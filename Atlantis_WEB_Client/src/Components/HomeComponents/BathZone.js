import React, { useState, useContext } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import InfoIcon from '../../Images/InfoIcon.png';

import LuminosityIcon from '../../Images/BrooksZone/luminosityIcon.png';
import BathIcon from '../../Images/BathZone/BathIcon.png';
import TempIcon from '../../Images/BrooksZone/tempIcon.png';
import PressureIcom from '../../Images/BrooksZone/pressureIcom.png';
import AltitudeIcon from '../../Images/BrooksZone/altitudeIcon.png';
import HumidityIcon from '../../Images/BrooksZone/humidityIcon.png';
import OnlineIcon from '../../Images/onlineIcon.png';
import OfflineIcon from '../../Images/offlineIcon.png';
import WarningIcon from '../../Images/warningIcon.png';
import CheckIcon from '../../Images/checkIcon.png';
import ReconnectIcon from '../../Images/refreshIcon.png';

import { Card, Nav, Button, Image } from 'react-bootstrap';
import { connect } from "react-redux";
import MQTTContext from "../MQTT/MQTTConnectionContext";
import moment from "moment";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { ThemeContext } from '../ThemeContext';
import '../../Styles/TopPanel.css'
import AlarmSoundfFile from '../../Sounds/alarm.wav';
import Cookies from 'universal-cookie';

const BathZone = (mqtt) => {
  const [shipConnected, setShipConnected] = useState(false);
  const cookies = new Cookies();
  const BDLimits = cookies.get('BathDeviceLimitsCookie');

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);

  const handleSubscribe = () => {
    var qos = 0;
    if (mqtt.mqtt.client) {
      mqtt.mqtt.client.subscribe("atlantis/bath", { qos }, (error) => {
        if (error) {
          console.log("Subscribe to atlantis/bath error", error);
          return;
        }
        console.log("Subscribe to atlantis/bath error", error);
      });
    }

  };

  const handlePublishToHub = () => {
    if (mqtt.mqtt.client) {

      mqtt.mqtt.client.publish("atlantis/hubnotify", "Check Bath!", { QoS: 0 }, (error) => {
        if (error) {
          console.log("Publish atlantis/hubnotify error: ", error);
        }
      });
    }
  };

  const requestRestart = () => {
    if (mqtt.mqtt.client) {

      mqtt.mqtt.client.publish("atlantis/bathnotify", "restart", { QoS: 0 }, (error) => {
        if (error) {
          console.log("Publish atlantis/bathnotify error: ", error);
        }
      });
    }
  }

  if (!shipConnected && mqtt.mqtt.client) {
    handleSubscribe();
    setShipConnected(true);
  }

  let warningMessages = [];
  let shipData = null;
  let tempInRed = false;
  let hmdtInRed = false;
  let lightInRed = false;
  let waterInRed = false;
  let MQ9InRed = false;
  let MQ135InRed = false;

  if (mqtt.AtlantisHub.bathData) {
    shipData = JSON.parse(mqtt.AtlantisHub.bathData.message);

    if (shipData.lightV >= BDLimits.ComfLmnst.max) {
      lightInRed = true;
      warningMessages.push("Container.BathZone.Messages.ALotOfLight");
    } else if (shipData.lightV <= BDLimits.ComfLmnst.min) {
      lightInRed = true;
      warningMessages.push("Container.BathZone.Messages.NeedLight");
    }

    if (shipData.bmpTemp <= BDLimits.ComfTemp.min || shipData.dhtTemp <= BDLimits.ComfTemp.min) {
      tempInRed = true;
      warningMessages.push("Container.BathZone.Messages.TooCold");
    } else if (shipData.bmpTemp >= BDLimits.ComfTemp.max || shipData.dhtTemp >= BDLimits.ComfTemp.max) {
      tempInRed = true;
      warningMessages.push("Container.BathZone.Messages.TooHot");
    }

    if (shipData.dhtHumidity <= BDLimits.ComfHmdt.min) {
      hmdtInRed = true;
      warningMessages.push("Container.BathZone.Messages.NeedHumidity");
    } else if (shipData.dhtHumidity >= BDLimits.ComfHmdt.max) {
      hmdtInRed = true;
      warningMessages.push("Container.BathZone.Messages.TooMuchHumidity");
    }

    if (shipData.waterLvl <= BDLimits.NormWaterLvl.min ||
      shipData.waterLvl >= BDLimits.NormWaterLvl.max) {
      waterInRed = true;
      warningMessages.push("Container.BathZone.Messages.WaterMsg");
    }

    if (shipData.MQ135ppm <= BDLimits.NormMQ135.min ||
      shipData.MQ135ppm >= BDLimits.NormMQ135.max) {
      MQ135InRed = true;
      warningMessages.push("Container.BathZone.Messages.MQ135");
    }

    if (shipData.MQ9V <= BDLimits.NormMQ9.min ||
      shipData.MQ9V >= BDLimits.NormMQ9.max) {
      MQ9InRed = true;
      warningMessages.push("Container.BathZone.Messages.MQ9");
    }

    if (shipData.relayIN1 != '1') {
      warningMessages.push("Container.BathZone.Messages.RelayMsg");
    }

    if (shipData.isMove) {
      warningMessages.push("Container.BathZone.Messages.MoveMsg");
    }

    if (warningMessages.length > 0 || shipData.relayIN1 != '1' || shipData.isMove) {
      console.log("BATH ALERT---> Notifying HUB");
      handlePublishToHub();
      console.log("BATH ALERT---> Messages:");
      console.log(warningMessages);
      console.log("BATH ALERT---> Start sound")
      var audio = new Audio(AlarmSoundfFile);
      //audio.muted = true;
      //audio.play();
    }
  }



  return (
    <>
      <Card style={{ margin: '10px' }} className={something.themeMode}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flexBasis: '8%', marginRight: '4%' }}>
              <img src={warningMessages.length > 0 ? WarningIcon : CheckIcon} width='100%' height="auto" alt="" rounded='true' />
            </div>
            <span>  {t('Container.BathZone.MainName')} </span>
          </div>
        </Card.Header>
        <Card.Body style={{ overflow: 'scroll', height: '371px' }}>
          {mqtt.AtlantisHub.bathData && shipData ? <>
            {/* Luminosity Zone */}
            <div className='row'>
              <div className='col' style={{ display: "flex", alignItems: "center" }}>
                <img src={LuminosityIcon} width="30%" height="auto" alt="" rounded='true' />
                <div>
                  <p style={{ margin: '0', color: lightInRed ? 'red' : null, fontWeight: lightInRed ? 'bold' : null }}>{shipData.lightV.toFixed(2)} {t('Container.BathZone.lxMsr')}</p>
                </div>
              </div>
              <div className='col' >
                <div>
                  <img src={ReconnectIcon} width="30%" height="auto" alt="" rounded='true' style={{ float: "right" }} onClick={requestRestart} />
                </div>
              </div>
            </div>

            {/* PlantZone */}
            <div className="row">
              {/* LEFT SIDE */}
              <div className="col-sm-6">
                {/* PLANT ICON */}
                <div className="row-sm-12">
                  <div >
                    <img src={BathIcon} width="90%" height="auto" alt="" rounded='true' />
                  </div>
                </div>
                {/* PLANT MESSAGES */}
                <div className="row-sm-12">
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <dl>
                      {warningMessages.length > 0 ? warningMessages.map((item, index) => (
                        <dt key={index}>{t(item)}</dt>
                      )) : <>
                        <dt>{t('Container.BathZone.Messages.BathOk')}</dt>
                      </>}
                    </dl>
                  </div>
                </div>
              </div>
              {/* RIGHT SIDE */}
              <div className="col-sm-6">
                {/* PressureSensorData */}
                <div style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', padding: '5px', margin: '2px' }}>
                  <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%' }}> {t('Container.BathZone.PressureSensor')} </p>
                  {/* BMP TEMP */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={TempIcon} width='65%' height="auto" alt="" rounded='true' style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
                    </div>
                    <span style={{ color: tempInRed ? 'red' : null, fontWeight: tempInRed ? 'bold' : null }}> {shipData.bmpTmp.toFixed(2)} {t('Container.BathZone.cels')} </span>
                  </div>
                  {/* BMP PRESSURE */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={PressureIcom} width='100%' height="auto" alt="" rounded='true' />
                    </div>
                    <span> {shipData.bmpPrssr.toFixed(2)} {t('Container.BathZone.hPaMsr')} </span>
                  </div>
                  {/* BMP ALTITUDE */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={AltitudeIcon} width='100%' height="auto" alt="" rounded='true' />
                    </div>
                    <span> {shipData.bmpAlttd.toFixed(2)} {t('Container.BathZone.mMsr')} </span>
                  </div>
                </div>

                {/* HimiditySensorData */}
                <div style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', padding: '5px', margin: '2px' }}>
                  <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%' }}> {t('Container.BathZone.HumiditySensor')} </p>
                  {/* DHT TEMP */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={TempIcon} width='65%' height="auto" alt="" rounded='true' style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
                    </div>
                    <span style={{ color: tempInRed ? 'red' : null, fontWeight: tempInRed ? 'bold' : null }}> {shipData.dhtTmp.toFixed(2)} °C </span>
                  </div>
                  {/* DHT HUMIDITY */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={HumidityIcon} width='100%' height="auto" alt="" rounded='true' />
                    </div>
                    <span style={{ color: hmdtInRed ? 'red' : null, fontWeight: hmdtInRed ? 'bold' : null }}> {shipData.dhtHmdt.toFixed(2)} % </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MotionSensorsData */}
            <div className="row-sm-12" style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', margin: '2px' }}>
              <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%', padding: '5px' }}> {t('Container.BathZone.BathSensors')} </p>
              <div className="row" style={{ marginRight: '0', marginLeft: '0' }}>
                {/* Relay  */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-4'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={TempIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '15%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>{t('Container.BathZone.RelayClosed')}:</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: shipData.relayIN1 == '1' ? 'red' : null, fontWeight: shipData.relayIN1 == '1' ? 'bold' : null }}> {shipData.relayIN1 != '1' ? t('Container.BathZone.Yes') : t('Container.BathZone.No')}  </span>
                  </div>
                </div>
                {/* WaterLvl  */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-4'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={HumidityIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '15%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>{t('Container.BathZone.WaterLvl')}:</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: waterInRed ? 'red' : null, fontWeight: waterInRed ? 'bold' : null }}> {shipData.waterLvl}  </span>
                  </div>
                </div>
                {/* Move  */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-4'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={AltitudeIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '15%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>{t('Container.BathZone.Move')}:</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: shipData.isMove ? 'red' : null, fontWeight: shipData.isMove ? 'bold' : null }}> {shipData.isMove ? t('Container.BathZone.Yes') : t('Container.BathZone.No')}  </span>
                  </div>
                </div>
              </div>
            </div>
            {/* MQ ZONE */}
            <div className="row-sm-12" style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', margin: '2px' }}>
              <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%' }}> {t('Container.BathZone.GasSensors')} </p>
              <div className="row" style={{ marginRight: '0', marginLeft: '0' }}>
                {/* MQ9 */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-6'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={TempIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '7%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>MQ9</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: MQ9InRed ? 'red' : null, fontWeight: MQ9InRed ? 'bold' : null }}> {shipData.MQ9V.toFixed(2)}  </span>
                  </div>
                </div>
                {/* MQ135 */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-6'>
                  <div className='row-sm-12' style={{ display: 'flex' }} >
                    <img src={TempIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '7%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>MQ135</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: MQ135InRed ? 'red' : null, fontWeight: MQ135InRed ? 'bold' : null }}> {shipData.MQ135ppm.toFixed(2)}  </span>
                  </div>

                </div>
              </div>
            </div>
          </> : <>
            <Card.Text>
              {t('Container.BathZone.NoConnection')}
            </Card.Text>
            <Button variant="primary"
              onClick={handleSubscribe}> {t('Container.BathZone.ConnectBtn')}
            </Button>
          </>
          }

        </Card.Body>
        <Card.Footer>
          <p>
            {/* <small className="text-muted" style={{float: 'right'}}>{mqtt.connectionStatus}</small> */}
            <img src={mqtt.connectionStatus === 'Connected' && shipData ? OnlineIcon : OfflineIcon} width='5%' height="auto" alt="" rounded='true' style={{ float: 'right', marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
            <small className="text-muted" style={{ float: 'left' }}>{t('Container.BathZone.Updated')} {(shipData && shipData.dTime) ? moment(shipData.dTime).format("DD-MM-YYYY HH:mm:ss") : t('Container.BathZone.NoData')}</small>
          </p>
        </Card.Footer>
      </Card>
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



export default connect(mapStateToProps, mapDispatchToProps)(BathZone);