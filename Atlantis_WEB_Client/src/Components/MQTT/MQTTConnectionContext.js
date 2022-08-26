import { Component } from 'react';
//import axios from "../Helpers/axios.public";

class MQTTContext extends Component {
    constructor (props) {
        super(props);
        this.state = {
            tableMock: props.data
        }
    }

    static setMQTTStatus = (status, client) => (dispatch) => {
        console.log(`[InvokeRequest] started to: ${status}`);
        dispatch({ type: 'mqttStatus', payload: {status: status, client: client} });
        // dispatch({ type: requestStart });
        // axios.get(query)
        //     .then((res) => {
        //         console.log(`[InvokeRequest] onSuccess from: ${query} is: `);
        //         console.log(res);
        //         dispatch({ type: onSuccess, payload: res.data });
        //     })
        //     .catch((err) => {
        //         console.log(`[InvokeRequest] onError from:${query} errorInfo: ${err}`);
        //         console.log(err);
        //         dispatch({ type: onError, error: err });
        //     });
    };

    static getMQTTStatus = () => (dispatch) => {
       // console.log(`[InvokeRequest] started to: ${query}`);
        dispatch({ type: 'mqttStatus', payload: { }});
      //  dispatch({ type: 'mqttStatus'});
           
    };

    static setShipStatus = (status) => (dispatch) => {
        dispatch({ type: status.topic, payload: status});
    }; 
}

export default MQTTContext;


