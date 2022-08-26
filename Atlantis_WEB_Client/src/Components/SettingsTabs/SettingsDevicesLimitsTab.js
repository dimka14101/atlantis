import React, { Component, useState, useEffect, useContext } from 'react'
import { Card, Button, InputGroup, FormControl, DropdownButton, Dropdown, Tab, Col, Nav, Row } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import SettingsIcon from '../../Images/SettingsIcon.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import ThemeSwitch from './ThemeSwitch';
import { ThemeContext } from '../ThemeContext';
import SettingsStyles from "../../Styles/SettingsStyles.css"
import KitchenDeviceLimits from "./DevicesLimits/KitchenDeviceLimits"
import HallDeviceLimits from './DevicesLimits/HallDeviceLimits';
import BrooksDeviceLimits from './DevicesLimits/BrooksDeviceLimits';
import BathDeviceLimits from './DevicesLimits/BathDeviceLimits';
import ModalDialog from './ModalDialog';


const SettingsDevicesLimitsTab = () => {

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);
  const changeLanguage = (event) => {
    localStorage.setItem("language", event.target.value);
    i18n.changeLanguage(event.target.value);
  };

  const [details, setDetails] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const dialogText = ["This is ", <strong>not</strong>, "working."];
  //TODO move it to app.js and store data in cache
  useEffect(() => {
    fetch("https://geolocation-db.com/json/e18cd550-7ab3-11eb-b603-3d466becf114")
      .then(response => response.json())
      .then(data => setDetails(data));
  }, []);

  const showDialog = () => {



    setModalShow(true)
  }

  return (
    <>
      <ModalDialog show={modalShow} text={dialogText} onHide={() => setModalShow(false)} />

      <Card className={something.themeMode} style={{ margin: '10px' }} id="limits">
        <Card.Header>
          <div className='row'>
            <div className='col-10'>
              {t('Settings.DevicesLimits.Name')}
            </div>
            <div className='col-2' >
              <Button style={{ float: 'right' }} variant="primary" onClick={showDialog}>
                i
              </Button>
              {/* <p style={{float:'right'}} >II</p> */}
            </div>
          </div>
        </Card.Header>
        <Card.Body>

          <Tab.Container id="left-tabs-example" defaultActiveKey="Brooks">
            <Row>
              <Col sm={3}>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="Brooks" href="#">
                      Brooks
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="Kitchen" href="#">
                      Kitchen module
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="Bath" href="#">
                      Bath module
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="Hall" href="#">
                      Hall module
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              <Col sm={9}>
                <Tab.Content>
                  <Tab.Pane eventKey="Brooks">
                    <BrooksDeviceLimits />
                  </Tab.Pane>
                  <Tab.Pane eventKey="Kitchen">
                    <KitchenDeviceLimits />
                  </Tab.Pane>
                  <Tab.Pane eventKey="Bath">
                    <BathDeviceLimits />
                  </Tab.Pane>
                  <Tab.Pane eventKey="Hall">
                    <HallDeviceLimits />
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
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



export default SettingsDevicesLimitsTab;