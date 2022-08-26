import React from "react";
import { Card, Button, Glyphicon, Form, Row, Col } from 'react-bootstrap';
import mqtt from "mqtt";
import { connect } from "react-redux";
import MQTTContext from "../MQTT/MQTTConnectionContext";
import moment from "moment";
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import { ThemeContext } from '../ThemeContext';

class SettingsMosquitoTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      record: {
        host: process.env.REACT_APP_MQTT_ADDRESS,
        clientId: `mqttjs_ + ${Math.random().toString(16).substr(2, 8)}`,
        port: process.env.REACT_APP_MQTT_PORT,
        username: process.env.REACT_APP_MQTT_USER_NAME,
        password: process.env.REACT_APP_MQTT_USER_PASS
      },
      connectStatus: "Connect",
      attempts: 5,
      attempt: 0
    };
  }

  onRecordChange = (value) => {
    const { record } = this.state;
    const changedRecord = Object.assign(record, value);
    this.setState({ record: changedRecord });
  };

  handleConnect = () => {
    const { host, clientId, port, username, password } = this.state.record;
    const url = `ws://${host}:${port}/mqtt`;
    const options = {
      keepalive: 30,
      protocolId: "MQTT",
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: "WillMsg",
        payload: "Connection Closed abnormally..!",
        qos: 0,
        retain: false,
      },
      rejectUnauthorized: false,
    };
    options.clientId = clientId;
    options.username = username;
    options.password = password;
    // this.props.connect(url, options);
    this.setState({ connectStatus: "Connecting" });
    this.client = mqtt.connect(url, options);
    if (this.client) {
      this.props.updateMQTTStatus(this.state, this.client);
      this.client.on("connect", () => {
        this.setState({ connectStatus: "Connected" });
        this.props.updateMQTTStatus(this.state, this.client);
      });
      this.client.on("error", (err) => {
        this.setState({ connectStatus: "Error" });

        this.props.updateMQTTStatus(this.state, this.client);
        console.error("Connection error: ", err);
        this.client.end();
      });
      this.client.on("reconnect", () => {
        this.setState({ connectStatus: "Reconnecting" });
        this.setState(prevState => {
          return { attempt: prevState.attempt + 1 }
        });
        if (this.state.attempt === this.state.attempts) {
          this.client.reconnecting = false;
          this.client.end(true, null, null);
        }

        this.props.updateMQTTStatus(this.state, this.client);
      });
      this.client.on("message", (topic, message) => {
        const payload = { topic, message: message.toString(), lastUpdateTime: moment() };
        const { messages } = this.state;
        if (payload.topic) {
          //   const changedMessages = messages.concat([payload]);
          //   this.setState({ messages: changedMessages });
          this.props.updateShipStatus(payload);
          console.log("Subscribe to topics ", payload);
        }
      });
    }
  };

  disconnect = () => {
    if (this.client) {
      this.client.end(() => {
        this.setState({ connectStatus: "Connect" });
        this.setState({ client: null });
        this.props.updateMQTTStatus(this.state, this.client);
      });
    }
  };

  handleFormChange = (event) => {
    var record = this.state.record;
    record[event.target.name] = event.target.value;
    // this.setState(state);
    // const obj = this.state.formData;
    // obj[event.target.name] = event.target.value;
    this.setState({
      record: record
    });
  };

  render() {
    const { t } = this.props;
    const { host, clientId, port, username, password } = this.state.record;
    const { attempt, attempts } = this.state;
    const { themeMode } = this.context;

    return (
      <Card style={{ margin: '10px' }} className={themeMode} id="mosquito">
        <Card.Header>Mosquito</Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.Mosquito.Username')}</label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="usernameId">👤</span>
                </div>
                <input type="text" className="form-control" placeholder={t('Settings.Mosquito.Username')} name="username" onChange={this.handleFormChange} value={username} aria-describedby="usernameId" />
              </div>
            </div>
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.Mosquito.Password')} </label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="passwordId">📝</span>
                </div>
                <input type="password" className="form-control" placeholder={t('Settings.Mosquito.Password')} name="password" onChange={this.handleFormChange} value={password} aria-describedby="passwordId" />
              </div>
            </div>
            <div className="col-sm-4">
            </div>
          </div>

          <div className="row">
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.Mosquito.Host')}</label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="hostId">🏠</span>
                </div>
                <input type="text" className="form-control" placeholder={t('Settings.Mosquito.Host')} name="host" onChange={this.handleFormChange} value={host} aria-describedby="hostId" />
              </div>
            </div>
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.Mosquito.Port')}</label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="portId">🌌</span>
                </div>
                <input type="text" className="form-control" placeholder={t('Settings.Mosquito.Port')} name="port" onChange={this.handleFormChange} value={port} aria-describedby="portId" />
              </div>
            </div>
            <div className="col-sm-4">
              <label htmlFor="basic-url">{t('Settings.Mosquito.ClientID')}</label>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="clientId">🆔</span>
                </div>
                <input type="text" className="form-control" placeholder={t('Settings.Mosquito.ClientID')} name="clientId" onChange={this.handleFormChange} value={clientId} aria-describedby="clientId" />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-sm-2">
              <Button type="primary" onClick={this.handleConnect} style={{ width: '100%', marginBottom: '1%' }} disabled={this.client ? this.client.connected : false}>
                {t('Settings.Mosquito.ConnectStatus.' + this.state.connectStatus)}
              </Button>
            </div>
            <div className="col-sm-2">
              <Button onClick={this.disconnect} style={{ width: '100%', marginBottom: '1%' }}> {t('Settings.Mosquito.DisconnectBTN')}
              </Button>
            </div>
            <div className="col-sm-8">
            </div>
          </div>




        </Card.Body>
        <Card.Footer>
          <p>
            {this.client && this.client.reconnecting ? <>
              <small className="text-muted" style={{ float: 'left' }}>{t('Settings.Mosquito.Attempt')} {attempt} {t('Settings.Mosquito.From')} {attempts}</small>
            </> : <></>}
          </p>
        </Card.Footer>
      </Card>
    );
  }
}

const mapStateToProps = state => ({
  mqtt: state.mqtt,
  connectionStatus: state.connectionStatus
});

const mapDispatchToProps = dispatch => ({
  updateMQTTStatus: (status, client) => {
    dispatch(MQTTContext.setMQTTStatus(status, client));
  },
  updateShipStatus: status => {
    dispatch(MQTTContext.setShipStatus(status));
  }
});

SettingsMosquitoTab.contextType = ThemeContext;
export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(SettingsMosquitoTab));
