import React, { useState, useContext } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import InfoIcon from '../../Images/InfoIcon.png';
import LuminosityIcon from '../../Images/BrooksZone/luminosityIcon.png';
import KitchenIcon from '../../Images/KitchenZone/KitchenIcon.png';
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
import  '../../Styles/TopPanel.css'
import Cookies from 'universal-cookie';
import AlarmSoundfFile from '../../Sounds/alarm.wav';

const KitchenZone = (mqtt) => {
  const [shipConnected, setShipConnected] = useState(false);
  const cookies = new Cookies();
  const KDLimits = cookies.get('KitchenDeviceLimitsCookie');

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);

    const handleSubscribe = () => {
        var qos = 0;
        if (mqtt.mqtt.client) {
            mqtt.mqtt.client.subscribe("atlantis/kitchen", { qos }, (error) => {//topic - string, qos = 0
            if (error) {
              console.log("Subscribe to topics error", error);
              return;
            }
            console.log("Subscribe to topics error", error);
          });
        }
      };

      const handlePublishToHub = () => {
        if (mqtt.mqtt.client) {

          mqtt.mqtt.client.publish("atlantis/hubnotify", "Check Kitchen!", { QoS: 0 }, (error) => {
            if (error) {
              console.log("Publish error: ", error);
            }
          });
        }
      };

      const requestRestart = () => {
        if (mqtt.mqtt.client) {
          console.log("Kitchen restart called");
          mqtt.mqtt.client.publish("atlantis/kitchennotify", "restart", { QoS: 0 }, (error) => {
            if (error) {
              console.log("Publish error: ", error);
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
      let MQ2InRed = false;
      let MQ5InRed = false;
      let MQ9InRed = false;
      let MQ135InRed = false;

      if(mqtt.AtlantisHub.kitchenData) {
        shipData = JSON.parse(mqtt.AtlantisHub.kitchenData.message);

        if (shipData.lightV >= KDLimits.ComfLmnst.max){
            lightInRed = true;
            warningMessages.push("Container.KitchenZone.Messages.ALotOfLight");
          } else if (shipData.lightV <= KDLimits.ComfLmnst.min){
            lightInRed = true;
            warningMessages.push("Container.KitchenZone.Messages.NeedLight");
          }
        
          if (shipData.bmpTemp <= KDLimits.ComfTemp.min  || shipData.dhtTemp <= KDLimits.ComfTemp.min) {
            tempInRed = true;
            warningMessages.push("Container.KitchenZone.Messages.TooCold");
          } else if (shipData.bmpTemp >= KDLimits.ComfTemp.max  || shipData.dhtTemp >= KDLimits.ComfTemp.max) {
            tempInRed = true;
            warningMessages.push("Container.KitchenZone.Messages.TooHot");
          }
        
          if (shipData.dhtHumidity <= KDLimits.ComfHmdt.min){
            hmdtInRed = true;
            warningMessages.push("Container.KitchenZone.Messages.NeedHumidity");
          } else if (shipData.dhtHumidity >= KDLimits.ComfHmdt.max){
            hmdtInRed = true;
            warningMessages.push("Container.KitchenZone.Messages.TooMuchHumidity");
          }

          if (shipData.vibroV <= KDLimits.NormVibro.min ||
            shipData.vibroV >= KDLimits.NormVibro.max) {
          vibroInRed = true;
          warningMessages.push("Container.KitchenZone.Messages.VibroMsg");
        } 
        
          if (shipData.MQ2V <= KDLimits.MQ2.min || 
            shipData.MQ2V >= KDLimits.MQ2.max) {
              MQ2InRed = true;
              warningMessages.push("Container.KitchenZone.Messages.MQ2");
          }

          if (shipData.MQ5V <= KDLimits.MQ5.min ||
            shipData.MQ5V >= KDLimits.MQ5.max) {
              MQ5InRed = true;
              warningMessages.push("Container.KitchenZone.Messages.MQ5");
          } 

        if (shipData.MQ135ppm <= KDLimits.MQ135.min ||
          shipData.MQ135ppm >= KDLimits.MQ135.max) {
          MQ135InRed = true;
          warningMessages.push("Container.KitchenZone.Messages.MQ135");
        } 

      if (shipData.MQ9V <= KDLimits.MQ9.min ||
          shipData.MQ9V >= KDLimits.MQ9.max) {
          MQ9InRed = true;
          warningMessages.push("Container.KitchenZone.Messages.MQ9");
      }
      
      if (!shipData.isClosed) {
          warningMessages.push("Container.KitchenZone.Messages.CloseMsg");
      }

      if (shipData.isMove) {
          warningMessages.push("Container.KitchenZone.Messages.MoveMsg");
      }

  
          if (warningMessages.length > 0  || !shipData.isClosed || shipData.isMove) {
            console.log("KITCHEN ALERT---> Notifying HUB");
            handlePublishToHub();
            console.log("KITCHEN ALERT---> Messages:");
            console.log(warningMessages);
            console.log("KITCHEN ALERT---> Start sound")
            var audio = new Audio(AlarmSoundfFile);
            //audio.muted = true;
            //audio.play();
            }
      }

      //mq2 газ і дим
      //mq5 Висока чутливість до природного газу, пропану, ізобутану, коксового газу. Слабо чутливий до алкогольних парів та диму. 
      //MQ9 використовується для перевірки витоків газу в домашніх і промислових умовах. Реагує на ЗНГ (зріджений нафтовий газ), ізобутан, метан, алкоголь, гідроген, дим і т.п.
      //mq135 Модуль датчика якості повітря MQ135 призначений для 
      //визначення вмісту та кількості шкідливих і небезпечних газів в
      // повітрі таких як: NH3, NOx, пари алкоголю, бензину, диму, CO2 і т.д.
      // Побудований на датчику MQ135. На платі модуля передбачений компаратор 
      //для визначення порогового значення концентрації шкідливих речовин. Поріг спрацьовування задається потенціометром.

        return (
                <>
                  
  <Card style={{margin:'10px'}} className={something.themeMode}>
      <Card.Header>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{ flexBasis: '8%', marginRight: '4%'}}>
            <img src={warningMessages.length > 0 ? WarningIcon : CheckIcon} width='100%' height="auto" alt="" rounded='true' />
          </div>
          <span>  {t('Container.KitchenZone.MainName')} </span>    
        </div>
      </Card.Header>
      <Card.Body style={{ overflow: 'scroll', height: '371px'}}>
        {mqtt.AtlantisHub.kitchenData && shipData ? <>
          {/* Luminosity Zone */}
          <div  className='row'>
            <div className='col' style={{ display: "flex", alignItems: "center"}}>
            <img src={LuminosityIcon}   width="30%" height="auto" alt="" rounded='true' />
              <div>
                <p style={{ margin: '0', color: lightInRed ? 'red' : null, fontWeight: lightInRed ? 'bold' : null}}>{shipData.lightV.toFixed(2)} {t('Container.KitchenZone.lxMsr')}</p>
              </div>
            </div>
            <div className='col' >
              <div>
                <img src={ReconnectIcon}   width="30%" height="auto" alt="" rounded='true' style={{float:"right"}} onClick={requestRestart}/>
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
                  <img src={KitchenIcon}   width="100%" height="auto" alt="" rounded='true' />
                </div>
              </div>
              {/* PLANT MESSAGES */}
              <div className="row-sm-12">
                <div style={{display: 'flex', alignItems: 'center', fontSize: '14px'}}>
                  <dl>
                    {warningMessages.length > 0 ? warningMessages.map((item, index) => (
                          <dt key={index}>{t(item)}</dt>
                      )) : <>
                       <dt>{t('Container.KitchenZone.Messages.KitchenOk')}</dt>
                      </> }
                  </dl>
                </div>
              </div>
            </div>
            {/* RIGHT SIDE */}
            <div className="col-sm-6">
              {/* PressureSensorData */}
              <div style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', padding: '5px', margin: '2px'}}>
                <p style={{textAlign: 'center', fontSize: '14px', marginBottom: '1%'}}> {t('Container.KitchenZone.PressureSensor')} </p>
                {/* BMP TEMP */}
                <div style={{display: 'flex', alignItems: 'center'}} className='row-sm-12'>
                  <div style={{ flexBasis: '13%', marginRight: '4%'}}>
                    <img src={TempIcon} width='65%' height="auto" alt="" rounded='true' style ={{marginLeft: 'auto', marginRight: 'auto', display: 'block'}} />
                  </div>
                  <span style={{color: tempInRed ? 'red' : null, fontWeight: tempInRed ? 'bold' : null}}> {shipData.bmpTmp ? shipData.bmpTmp.toFixed(2) : "N/A"} {t('Container.KitchenZone.cels')} </span>    
                </div>
                {/* BMP PRESSURE */}
                <div style={{display: 'flex', alignItems: 'center'}} className='row-sm-12'>
                  <div style={{ flexBasis: '13%', marginRight: '4%'}}>
                    <img src={PressureIcom} width='100%' height="auto" alt="" rounded='true' />
                  </div>
                  <span> {shipData.bmpPrssr ? shipData.bmpPrssr.toFixed(2) : "N/A"} {t('Container.KitchenZone.hPaMsr')} </span>    
                </div>
                {/* BMP ALTITUDE */}
                <div style={{display: 'flex', alignItems: 'center'}} className='row-sm-12'>
                  <div style={{ flexBasis: '13%', marginRight: '4%'}}>
                    <img src={AltitudeIcon} width='100%' height="auto" alt="" rounded='true' />
                  </div>
                  <span> {shipData.bmpAlttd ? shipData.bmpAlttd.toFixed(2) : "N/A"} {t('Container.KitchenZone.mMsr')} </span>    
                </div>
              </div>

              {/* HimiditySensorData */}
              <div style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', padding: '5px', margin: '2px'}}>
                <p style={{textAlign: 'center', fontSize: '14px', marginBottom: '1%'}}> {t('Container.KitchenZone.HumiditySensor')} </p>
                {/* DHT TEMP */}
                <div style={{display: 'flex', alignItems: 'center'}} className='row-sm-12'>
                  <div style={{ flexBasis: '13%', marginRight: '4%'}}>
                    <img src={TempIcon} width='65%' height="auto" alt="" rounded='true' style ={{marginLeft: 'auto', marginRight: 'auto', display: 'block'}}  />
                  </div>
                  <span style={{color: tempInRed ? 'red' : null, fontWeight: tempInRed ? 'bold' : null}}> {shipData.dhtTmp ? shipData.dhtTmp.toFixed(2) : "N/A"} {t('Container.KitchenZone.cels')} </span>    
                </div>
                {/* DHT HUMIDITY */}
                <div style={{display: 'flex', alignItems: 'center'}} className='row-sm-12'>
                  <div style={{ flexBasis: '13%', marginRight: '4%'}}>
                    <img src={HumidityIcon} width='100%' height="auto" alt="" rounded='true' />
                  </div>
                  <span style={{color: hmdtInRed ? 'red' : null, fontWeight: hmdtInRed ? 'bold' : null}}> {shipData.dhtHmdt ? shipData.dhtHmdt.toFixed(2) : "N/A"} % </span>    
                </div>
              </div>
            </div>
          </div>

            {/* MotionSensorsData */}
            <div className="row-sm-12" style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', margin: '2px'}}>
                <p style={{textAlign: 'center', fontSize: '14px', marginBottom: '1%', padding: '5px'}}> {t('Container.KitchenZone.MotionSensors')} </p>
                <div className="row" style={{  marginRight: '0', marginLeft: '0'}}> 
                    {/* Gerkon  */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-4'>
                        <div className='row-sm-12' style={{ display: 'flex'}}>
                            <img src={TempIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}}  />
                            <p style={{margin: '0px auto 0px 5px'}}>{t('Container.KitchenZone.Closed')}:</p>
                        </div>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: shipData.isClosed ? 'red' : null, fontWeight: shipData.isClosed ? 'bold' : null}}> {shipData.isClosed ?  t('Container.KitchenZone.Yes') : t('Container.KitchenZone.No')}  </span>
                        </div>  
                    </div>
                    {/* Vibro  */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-4'>
                        <div className='row-sm-12' style={{ display: 'flex'}}>
                            <img src={HumidityIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}} />
                            <p style={{margin: '0px auto 0px 5px'}}>{t('Container.KitchenZone.Vibro')}:</p>
                        </div>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: vibroInRed ? 'red' : null, fontWeight: vibroInRed ? 'bold' : null}}> {shipData.vibroV}  </span>
                        </div>    
                    </div>
                    {/* Move  */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-4'>
                        <div className='row-sm-12' style={{ display: 'flex'}}>
                            <img src={AltitudeIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}}/>
                            <p style={{margin: '0px auto 0px 5px'}}>{t('Container.KitchenZone.Move')}:</p>
                        </div>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: shipData.isMove ? 'red' : null, fontWeight: shipData.isMove ? 'bold' : null}}> {shipData.isMove ?  t('Container.KitchenZone.Yes') : t('Container.KitchenZone.No')}  </span>
                        </div>      
                    </div>
                </div>
              </div>


           {/* MQ ZONE */}               
           <div className="row-sm-12" style={{ borderWidth: '1px', borderStyle: 'solid', borderRadius: '3px', margin: '2px'}}>
                <p style={{textAlign: 'center', fontSize: '14px', marginBottom: '1%'}}> {t('Container.KitchenZone.GasSensors')} </p>
               <div className="row" style={{  marginRight: '0', marginLeft: '0'}}>  
                    {/* MQ2 */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-3'>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <img src={TempIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}} />
                            <p style={{margin: '0px auto 0px 5px'}}>MQ2</p>
                        </div> 
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: MQ2InRed ? 'red' : null, fontWeight: MQ2InRed ? 'bold' : null}}> {shipData.MQ2V.toFixed(2)}  </span>
                        </div>
                    </div>
                    {/* MQ5 */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-3'>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <img src={TempIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}} />
                            <p style={{margin: '0px auto 0px 5px'}}>MQ5</p>
                        </div> 
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: MQ5InRed ? 'red' : null, fontWeight: MQ5InRed ? 'bold' : null}}> {shipData.MQ5V.toFixed(2)}  </span>
                        </div>
                    </div>                 
                    {/* MQ9 */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-3'>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <img src={TempIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}} />
                            <p style={{margin: '0px auto 0px 5px'}}>MQ9</p>
                        </div> 
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: MQ9InRed ? 'red' : null, fontWeight: MQ9InRed ? 'bold' : null}}> {shipData.MQ9V.toFixed(2)}  </span>
                        </div>
                    </div>
                    {/* MQ135 */}
                    <div style={{alignItems: 'center', padding: '0'}} className='col-3'>
                        <div className='row-sm-12' style={{display: 'flex'}} >
                            <img src={TempIcon} alt="" rounded='true' style ={{marginLeft: 'auto', width: '15%', height: 'auto'}} />
                            <p style={{margin: '0px auto 0px 5px'}}>MQ135</p>
                        </div>
                        <div className='row-sm-12' style={{display: 'flex'}}>
                            <span style={{margin: 'auto', color: MQ135InRed ? 'red' : null, fontWeight: MQ135InRed ? 'bold' : null}}> {shipData.MQ135ppm.toFixed(2)}  </span>
                        </div>
                        
                    </div>  
                </div>
            </div>
        </> : <>
          <Card.Text>
          {t('Container.KitchenZone.NoConnection')}
          </Card.Text>
          <Button variant="primary"
                  onClick={handleSubscribe}> {t('Container.KitchenZone.ConnectBtn')}
          </Button>
        </>
        }
        
      </Card.Body>
      <Card.Footer>
        <p>
          {/* <small className="text-muted" style={{float: 'right'}}>{mqtt.connectionStatus}</small> */}
          <img src={mqtt.connectionStatus === 'Connected' && shipData ? OnlineIcon : OfflineIcon } width='5%' height="auto" alt="" rounded='true' style ={{float: 'right', marginLeft: 'auto', marginRight: 'auto', display: 'block'}}  />
          <small className="text-muted" style={{float: 'left'}}>{t('Container.KitchenZone.Updated')} {(shipData && shipData.dTime) ? moment(shipData.dTime).format("DD-MM-YYYY HH:mm:ss") : t('Container.KitchenZone.NoData')}</small>
        </p> 
      </Card.Footer>
    </Card>
  </>
  )
}



function mapStateToProps(state) {
    return {  mqtt: state.mqtt.mqtt,
      connectionStatus: state.mqtt.mqtt.status.connectStatus,
      AtlantisHub: state.atlantisHub };
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



  export default connect(mapStateToProps, mapDispatchToProps)(KitchenZone);