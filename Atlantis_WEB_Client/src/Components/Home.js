import React, { Component } from "react";
import { Container, CardColumns } from 'react-bootstrap';
import BrooksZone from "./HomeComponents/BrooksZone"
import IFrame from "./HomeComponents/IFrame"
import { ThemeContext } from './ThemeContext';
import ThemeSwitch from '../Styles/ThemeSwitch.css';
import { connect, Provider, useDispatch, useSelector } from "react-redux";
import PageNotFound from "../Components/PageNotFound";
import KitchenZone from "./HomeComponents/KitchenZone";
import HallZone from "./HomeComponents/HallZone";
import BathZone from "./HomeComponents/BathZone";
import Hub from "./HomeComponents/Hub";
class Home extends Component {

    constructor(props) {
        super(props)
        this.state = {
            currentUser: {}
        }
    }

    componentDidMount() {
        console.log("CONTEXT=====>>" + this.contextType);
    }



    render = () => {
        const { currentUser } = this.props;
        return (
            <>
                <Container>
                    {!currentUser ? (
                        <>
                            <Hub />
                            <CardColumns>

                                <BrooksZone />
                                <KitchenZone />
                                <HallZone />
                                <BathZone />
                                <IFrame />
                            </CardColumns>
                        </>
                    ) : (
                        <>
                            Login to see details
                        </>
                    )}
                    {/* <BrooksZone/>
            <BrooksZone/> */}

                </Container>

            </>
        );
    };
}

const mapStateToProps = state => {
    return {
        currentUser: state.auth.user
    }
}
const mapDispatchToProps = dispatch => ({
    // updateMQTTStatus: (status, client) => {
    //   dispatch(MQTTContext.setMQTTStatus(status, client));
    // },
    // updateShipStatus: status => {
    //   dispatch(MQTTContext.setShipStatus(status));
    // }
});

Home.contextType = ThemeContext;

export default connect(mapStateToProps, mapDispatchToProps)(Home);
