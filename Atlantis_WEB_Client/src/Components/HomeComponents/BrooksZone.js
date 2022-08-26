import React, { useState, useContext } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import InfoIcon from '../../Images/InfoIcon.png';
import LuminosityIcon from '../../Images/BrooksZone/luminosityIcon.png';
import PlantIcon from '../../Images/BrooksZone/plantIcon.png';
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

const BrooksZone = (mqtt) => {
  const [shipConnected, setShipConnected] = useState(false);
  const cookies = new Cookies();
  const BDLimits = cookies.get('BrooksDeviceLimitsCookie');

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);

  const handleSubscribe = () => {
    var qos = 0;
    if (mqtt.mqtt.client) {
      mqtt.mqtt.client.subscribe("atlantis/brooks", { qos }, (error) => {//topic - string, qos = 0
        if (error) {
          console.log("Subscribe to atlantis/brooks topics error", error);
          return;
        }
        console.log("Subscribe to atlantis/brooks topics error", error);
      });
    }
  };

  const handlePublishToHub = () => {
    if (mqtt.mqtt.client) {

      mqtt.mqtt.client.publish("atlantis/hubnotify", "Check Brooks!", { QoS: 0 }, (error) => {
        if (error) {
          console.log("Publish atlantis/hubnotify error: ", error);
        }
      });
    }
  };

  const requestRestart = () => {
    if (mqtt.mqtt.client) {
      console.log("Brooks restart called");
      mqtt.mqtt.client.publish("atlantis/brooksnotify", "restart", { QoS: 0 }, (error) => {
        if (error) {
          console.log("Publish atlantis/brooksnotify error: ", error);
        }
      });
    }
  }

  //console.log("STATE----->", mqtt.AtlantisHub);
  if (!shipConnected && mqtt.mqtt.client) {
    handleSubscribe();
    setShipConnected(true);
  }

  let warningMessages = [];
  let shipData = null;
  let tempInRed = false;
  let hmdtInRed = false;
  let lightInRed = false;
  let vibroInRed = false;

  if (mqtt.AtlantisHub.shipData) {
    shipData = JSON.parse(mqtt.AtlantisHub.shipData.message);

    if (shipData.luminosity >= BDLimits.ComfLmnst.max) {
      lightInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.ALotOfLight");
    } else if (shipData.luminosity <= BDLimits.ComfLmnst.min) {
      lightInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.NeedLight");
    }

    if (shipData.bmpTemp <= BDLimits.ComfTemp.min || shipData.dhtTemp <= BDLimits.ComfTemp.min) {
      tempInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.TooCold");
    } else if (shipData.bmpTemp >= BDLimits.ComfTemp.max || shipData.dhtTemp >= BDLimits.ComfTemp.max) {
      tempInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.TooHot");
    }

    if (shipData.dhtHumidity <= BDLimits.ComfHmdt.min) {
      hmdtInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.NeedHumidity");
    } else if (shipData.dhtHumidity >= BDLimits.ComfHmdt.max) {
      hmdtInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.TooMuchHumidity");
    }

    if (shipData.vibroV <= BDLimits.NormVibro.min ||
      shipData.vibroV >= BDLimits.NormVibro.max) {
      vibroInRed = true;
      warningMessages.push("Container.BrooksZone.Messages.VibroMsg");
    }

    if (!shipData.isClosed) {
      warningMessages.push("Container.BrooksZone.Messages.CloseMsg");
    }

    if (shipData.isMove) {
      warningMessages.push("Container.BrooksZone.Messages.MoveMsg");
    }

    if (warningMessages.length > 0 || !shipData.isClosed || shipData.isMove) {
      console.log("BROOKS ALERT---> Notifying HUB");
      handlePublishToHub();
      console.log("BROOKS ALERT---> Messages:");
      console.log(warningMessages);
      console.log("BROOKS ALERT---> Start sound")
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
            <span> Brooks </span>
          </div>
        </Card.Header>
        <Card.Body style={{ overflow: 'scroll', height: '371px' }}>
          {mqtt.AtlantisHub.shipData && shipData ? <>
            {/* Luminosity Zone */}
            <div className='row'>
              <div className='col' style={{ display: "flex", alignItems: "center" }}>
                <img src={LuminosityIcon} width="30%" height="auto" alt="" rounded='true' />
                <div>
                  <p style={{ margin: '0', color: lightInRed ? 'red' : null, fontWeight: lightInRed ? 'bold' : null }}>{shipData.luminosity.toFixed(2)} {t('Container.BrooksZone.lxMsr')}</p>
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
                    <img src={PlantIcon} width="100%" height="auto" alt="" rounded='true' />
                  </div>
                </div>
                {/* PLANT MESSAGES */}
                <div className="row-sm-12">
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                    <dl>
                      {warningMessages.length > 0 ? warningMessages.map((item, index) => (
                        <dt key={index}>{t(item)}</dt>
                      )) : <>
                        <dt>{t('Container.BrooksZone.Messages.PlantOk')}</dt>
                      </>}
                    </dl>
                  </div>
                </div>
              </div>
              {/* RIGHT SIDE */}
              <div className="col-sm-6">
                {/* PressureSensorData */}
                <div style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', padding: '5px', margin: '2px' }}>
                  <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%' }}> {t('Container.BrooksZone.PressureSensor')} </p>
                  {/* BMP TEMP */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={TempIcon} width='65%' height="auto" alt="" rounded='true' style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
                    </div>
                    <span style={{ color: tempInRed ? 'red' : null, fontWeight: tempInRed ? 'bold' : null }}> {shipData.bmpTemp.toFixed(2)} {t('Container.BrooksZone.cels')} </span>
                  </div>
                  {/* BMP PRESSURE */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={PressureIcom} width='100%' height="auto" alt="" rounded='true' />
                    </div>
                    <span> {shipData.bmpPressure.toFixed(2)} {t('Container.BrooksZone.hPaMsr')} </span>
                  </div>
                  {/* BMP ALTITUDE */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={AltitudeIcon} width='100%' height="auto" alt="" rounded='true' />
                    </div>
                    <span> {shipData.bmpAlttd.toFixed(2)} {t('Container.BrooksZone.mMsr')} </span>
                  </div>
                </div>

                {/* HimiditySensorData */}
                <div style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', padding: '5px', margin: '2px' }}>
                  <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%' }}> {t('Container.BrooksZone.HumiditySensor')} </p>
                  {/* DHT TEMP */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={TempIcon} width='65%' height="auto" alt="" rounded='true' style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
                    </div>
                    <span style={{ color: tempInRed ? 'red' : null, fontWeight: tempInRed ? 'bold' : null }}> {shipData.dhtTemp.toFixed(2)}  {t('Container.BrooksZone.cels')} </span>
                  </div>
                  {/* DHT HUMIDITY */}
                  <div style={{ display: 'flex', alignItems: 'center' }} className='row-sm-12'>
                    <div style={{ flexBasis: '13%', marginRight: '4%' }}>
                      <img src={HumidityIcon} width='100%' height="auto" alt="" rounded='true' />
                    </div>
                    <span style={{ color: hmdtInRed ? 'red' : null, fontWeight: hmdtInRed ? 'bold' : null }}> {shipData.dhtHumidity.toFixed(2)} % </span>
                  </div>
                </div>

              </div>
            </div>
            {/* MotionSensorsData */}
            <div className="row-sm-12" style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', margin: '2px' }}>
              <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '1%', padding: '5px' }}> {t('Container.BrooksZone.MotionSensors')} </p>
              <div className="row" style={{ marginRight: '0', marginLeft: '0' }}>
                {/* Gerkon  */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-4'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={TempIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '15%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>{t('Container.BrooksZone.Closed')}:</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: shipData.isClosed ? 'red' : null, fontWeight: shipData.isClosed ? 'bold' : null }}> {shipData.isClosed ? t('Container.HallZone.Yes') : t('Container.HallZone.No')}  </span>
                  </div>
                </div>
                {/* Vibro  */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-4'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={HumidityIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '15%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>{t('Container.BrooksZone.Vibro')}:</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: vibroInRed ? 'red' : null, fontWeight: vibroInRed ? 'bold' : null }}> {shipData.vibroV}  </span>
                  </div>
                </div>
                {/* Move  */}
                <div style={{ alignItems: 'center', padding: '0' }} className='col-4'>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <img src={AltitudeIcon} alt="" rounded='true' style={{ marginLeft: 'auto', width: '15%', height: 'auto' }} />
                    <p style={{ margin: '0px auto 0px 5px' }}>{t('Container.BrooksZone.Move')}:</p>
                  </div>
                  <div className='row-sm-12' style={{ display: 'flex' }}>
                    <span style={{ margin: 'auto', color: shipData.isMove ? 'red' : null, fontWeight: shipData.isMove ? 'bold' : null }}> {shipData.isMove ? t('Container.HallZone.Yes') : t('Container.HallZone.No')}  </span>
                  </div>
                </div>
              </div>
            </div>
          </> : <>
            <Card.Text>
              {t('Container.BrooksZone.NoConnection')}
            </Card.Text>
            <Button variant="primary"
              onClick={handleSubscribe}> {t('Container.BrooksZone.ConnectBtn')}
            </Button>
          </>
          }

        </Card.Body>
        <Card.Footer>
          <p>
            {/* <small className="text-muted" style={{float: 'right'}}>{mqtt.connectionStatus}</small> */}
            <img src={mqtt.connectionStatus === 'Connected' && shipData ? OnlineIcon : OfflineIcon} width='5%' height="auto" alt="" rounded='true' style={{ float: 'right', marginLeft: 'auto', marginRight: 'auto', display: 'block' }} />
            <small className="text-muted" style={{ float: 'left' }}>{t('Container.BrooksZone.Updated')} {(shipData && shipData.dTime) ? moment(shipData.dTime).format("DD-MM-YYYY HH:mm:ss") : t('Container.BrooksZone.NoData')}</small>
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



export default connect(mapStateToProps, mapDispatchToProps)(BrooksZone);