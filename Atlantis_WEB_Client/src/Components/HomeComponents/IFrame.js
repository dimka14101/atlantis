import React, { useState, useContext, useEffect } from 'react'
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
import FullscreenIcon from '../../Images/BrooksCam/fullscreenIcon.png';
import WarningIcon from '../../Images/warningIcon.png';
import CameraIcon from '../../Images/Camera/CameraIcon.png';
import ReconnectIcon from '../../Images/refreshIcon.png';

import { Card, Nav, Button, Image } from 'react-bootstrap';
import { connect } from "react-redux";
import MQTTContext from "../MQTT/MQTTConnectionContext";
import moment from "moment";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { ThemeContext } from '../ThemeContext';
import  '../../Styles/TopPanel.css'
import Iframe from 'react-iframe';

const IFrame = (mqtt) => {
  const [cameraConnected, setCameraConnected] = useState(false);
  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);

  const fullscreen = () => {
    if (document.fullscreenEnabled || 
      document.webkitFullscreenEnabled || 
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled) {
      
      // which element will be fullscreen
      var iframe = document.getElementById('cameraFrame');
      // Do fullscreen
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
      } else if (iframe.mozRequestFullScreen) {
        iframe.mozRequestFullScreen();
      } else if (iframe.msRequestFullscreen) {
        iframe.msRequestFullscreen();
      }
    }
    else {
      document.querySelector('.error').innerHTML = 'Your browser is not supported';
    }
  }
  
  useEffect(() => {
  fetch('http://192.168.0.212', { method: "HEAD", mode: 'no-cors' })
  .then((response) => {
    setCameraConnected(true);
   })
  .catch((error) => {
    setCameraConnected(false);
       console.log('Cam status check network error: ' + error);
   })
  }, []);
   

      
        return (
                <>
                  
  <Card style={{margin:'10px', width: 'auto', height:'100%'}} className={something.themeMode}>
      <Card.Header>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{ flexBasis: '8%', marginRight: '4%'}}>
            <img src={CameraIcon} width='100%' height="auto" alt="" rounded='true' />
          </div>
          <span> Brooks Cam </span>    
        </div>
      </Card.Header>
     
      { cameraConnected ? <>
        <Card.Body style={{padding:'0'}}>
      <Iframe url='http://192.168.0.212'
        // style={{    color: 'aqua'}}
          width="100%"
          height="301px"
        id="cameraFrame"
        //className="custom"
        //display="initial"
        //position="relative"
        />
         </Card.Body>
         </> : <>
         <Card.Body>
          <Card.Text>
          {t('Container.BrooksCam.NoConnection')}
          </Card.Text>
          </Card.Body>
        </>}
        
      <Card.Footer >
       
           <div className="row">
            <div className="col-md-6">
             
            { cameraConnected ? <>
          <Button variant="primary" style={{padding:"4px"}} onClick={fullscreen}><img src={FullscreenIcon} width="20" alt="fullscreen" /> Fullscreen</Button>
          </> : <>
           </> }
            </div>
            <div className="col-md-6">
            <img src={cameraConnected ? OnlineIcon : OfflineIcon } width='10%' height="auto" alt="" rounded='true' style ={{float: 'right', position: 'relative', top:'30%'}}  />
      
            </div>
          </div>
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



  export default connect(mapStateToProps, mapDispatchToProps)(IFrame);