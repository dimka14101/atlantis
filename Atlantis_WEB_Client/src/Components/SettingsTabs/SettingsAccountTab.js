import React, { Component, useState, useEffect, useContext } from 'react'
import { Card, Button, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import SettingsIcon from '../../Images/SettingsIcon.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import ThemeSwitch from './ThemeSwitch';
import { ThemeContext } from '../ThemeContext';

const SettingsAccountTab = () => {

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);
  const changeLanguage = (event) => {
    localStorage.setItem("language", event.target.value);
    i18n.changeLanguage(event.target.value);
  };

  const [details, setDetails] = useState(null);

  //TODO move it to app.js and store data in cache
  useEffect(() => {
    fetch("https://geolocation-db.com/json/e18cd550-7ab3-11eb-b603-3d466becf114")
      .then(response => response.json())
      .then(data => setDetails(data));
  }, []);



  return (
    <>
      <Card className={something.themeMode} style={{ margin: '10px' }} id="account">
        <Card.Header>{t('Settings.Account.Name')}</Card.Header>
        <Card.Body>
          Comming soon.....
        </Card.Body>
        <Card.Footer>
          <p>
            {/* <small className="text-muted" style={{float: 'right'}}>{mqtt.connectionStatus}</small> */}
            {/* <img src={mqtt.connectionStatus === 'Connected' ? OnlineIcon : OfflineIcon } width='5%' height="auto" alt="" rounded='true' style ={{float: 'right', marginLeft: 'auto', marginRight: 'auto', display: 'block'}}  />
          <small className="text-muted" style={{float: 'left'}}>Updated: {mqtt.AtlantisHub.lastUpdateTime ? moment(mqtt.AtlantisHub.lastUpdateTime).format("DD-MM-YYYY hh:mm:ss") : "no data"}</small> */}
          </p>
        </Card.Footer>
      </Card>
    </>
  )
}



export default SettingsAccountTab;