import React, { Component, useContext, useState, useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { Navbar, Nav } from 'react-bootstrap';
//import { FilterPanel, MoviesList, TopMoviesPanel } from "./MainContainer";
//import Search from './Common/Search'
import MainLogo from '../Images/MainLogo.png';
import SettingsIcon from "../Images/SettingsIcon.png";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { connect } from "react-redux";
import MQTTContext from "../Components/MQTT/MQTTConnectionContext";
import { ThemeContext } from './ThemeContext';
import '../Styles/ThemeSwitch.css'
import { history } from "../Helpers/history";
import { clearMessage } from "../Actions/message";
import { logout } from "../Actions/auth";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  NavLink,
  useRouteMatch
} from "react-router-dom";

const TopPanel = ({ mqtt, connectionStatus }) => {

  const { t, i18n } = useTranslation();
  const something = useContext(ThemeContext);

  const [showModeratorBoard, setShowModeratorBoard] = useState(false);
  const [showAdminBoard, setShowAdminBoard] = useState(false);

  const { user: currentUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    history.listen((location) => {
      dispatch(clearMessage()); // clear message when changing location
    });
  }, [dispatch]);

  useEffect(() => {
    if (currentUser) {
      setShowModeratorBoard(currentUser.roles.includes("ROLE_MODERATOR"));
      setShowAdminBoard(currentUser.roles.includes("ROLE_ADMIN"));
    }
  }, [currentUser]);

  const logOut = () => {
    dispatch(logout());
  };

  // const {
  //   mqtt,
  //   connectionStatus
  // } = this;
  return (
    <>
      <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Brand  >
          <img
            alt=""
            src={MainLogo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          Atlantis
        </Navbar.Brand>
        <Navbar.Collapse id="responsive-navbar-nav" style={{ whiteSpace: 'nowrap' }}>
          <Nav className="mr-auto">
            <NavLink style={{ margin: '1%' }} exact to="/" className="nav-link">
              {t('TopPanel.Home')}
            </NavLink>
            <NavLink style={{ margin: '1%' }} exact to="/settings" className="nav-link">
              {t('TopPanel.Settings')}
            </NavLink>
            <NavLink style={{ margin: '1%' }} exact to="/about" className="nav-link">
              {t('TopPanel.About')}
            </NavLink>
            <NavLink style={{ margin: '1%' }} exact to="/admin_home" className="nav-link">
              {/* {t('TopPanel.About')}*/} Admin Home
            </NavLink>

            {showModeratorBoard && (
              <NavLink style={{ margin: '1%' }} exact to="/mod" className="nav-link">
                {/* {t('TopPanel.About')}*/} Moderator Board
              </NavLink>
            )}

            {showAdminBoard && (
              <NavLink style={{ margin: '1%' }} exact to="/admin" className="nav-link">
                {/* {t('TopPanel.About')}*/}  Admin Board
              </NavLink>
            )}

            {currentUser && (
              <NavLink style={{ margin: '1%' }} exact to="/profile" className="nav-link">
                {/* {t('TopPanel.About')}*/} User
              </NavLink>
            )}

          </Nav>
        </Navbar.Collapse>

        <Navbar.Collapse className="justify-content-end">
          {currentUser ? (
            <Nav.Link href="/settings">
              {t('TopPanel.ServerStatus')} {t('TopPanel.PanelConnectStatus.' + connectionStatus, t('TopPanel.PanelConnectStatus.NotConnected'))}
              {/* <img
        alt=""
        src={SettingsIcon}
        width="30"
        height="30"
        className="d-inline-block align-top"
        align="right"
      />{' '} */}
            </Nav.Link>
          ) : (<>
          </>)}

          {currentUser ? (
            <Nav>
              <NavLink exact to="/profile" className="nav-link">
                {/* {t('TopPanel.Settings')} */}  {currentUser.username}
              </NavLink>
              <NavLink exact to="/login" className="nav-link" onClick={logOut}>
                {/* {t('TopPanel.Settings')} */} LogOut
              </NavLink>
            </Nav>
            // <div className="navbar-nav ml-auto">
            //   <li className="nav-item">
            //     <Link to={"/profile"} className="nav-link">
            //       {currentUser.username}
            //     </Link>
            //   </li>
            //   <li className="nav-item">
            //     <a href="/login" className="nav-link" onClick={logOut}>
            //       LogOut
            //     </a>
            //   </li>
            // </div>
          ) : (
            <Nav>
              <NavLink exact to="/login" className="nav-link">
                {/* {t('TopPanel.Settings')} */} Login
              </NavLink>
              <NavLink exact to="/register" className="nav-link">
                {/* {t('TopPanel.Settings')} */} Sign Up
              </NavLink>
            </Nav>
          )}

        </Navbar.Collapse>

      </Navbar>
    </>
  );
};


function mapStateToProps(state) {
  return {
    mqtt: null,//state.mqtt,
    connectionStatus: state.mqtt.mqtt.status.connectStatus
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


export default connect(mapStateToProps, mapDispatchToProps)(TopPanel);
