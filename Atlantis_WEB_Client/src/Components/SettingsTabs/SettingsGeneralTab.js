import React, { Component, useState, useEffect, useContext } from 'react'
import { Card, Button, InputGroup, FormControl, DropdownButton, Dropdown } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import SettingsIcon from '../../Images/SettingsIcon.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import ThemeSwitch from './ThemeSwitch';
import { ThemeContext } from '../ThemeContext';

const SettingsGeneralTab = () => {

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
      <Card className={something.themeMode} style={{ margin: '10px' }} id="general">
        <Card.Header>{t('Settings.General.Name')}</Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.General.Theme')}</label>
              <ThemeSwitch />

            </div>
            <div className="col-sm-4">
            </div>
            <div className="col-sm-4">
            </div>
          </div>

          <div className="row">
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.General.Language')} ({t('Settings.General.SelectedLng')} - {i18n.language})</label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" htmlFor="inputGroupSelect01">🌍</span>
                </div>
                <select className="custom-select" id="inputGroupSelect01" onChange={changeLanguage} value={i18n.language}>
                  {/* <option selected>Choose...</option> */}
                  <option value="ua">Українська (ua)</option>
                  <option value="en">English (en)</option>
                  <option value="pl">PL-Coming soon</option>
                </select>
              </div>
            </div>
            <div className="col-sm-4">
            </div>
            <div className="col-sm-4">
            </div>
          </div>
          <div className="row">
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.General.Location')}</label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="usernameId">📍</span>
                </div>
                <input type="text" className="form-control" placeholder='' name="username" aria-describedby="usernameId"
                  value={details ? `${details.city}, ${details.country_name}(${details.country_code})` : ''} disabled />
              </div>
            </div>
            <div className="col-sm-4">
              <label htmlFor="basic-url">IP </label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="passwordId">📱</span>
                </div>
                <input type="text" className="form-control" placeholder='' name="password" value={details ? details.IPv4 : ''} aria-describedby="passwordId" disabled />
              </div>
            </div>
            <div className="col-sm-4">
            </div>
          </div>
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



export default SettingsGeneralTab;