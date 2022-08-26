import React, { Component } from "react";
import PageNotFound_404Img from '../Images/PageNotFound_404Img.jpg';
import { Container, CardColumns } from 'react-bootstrap';

import { useTranslation, withTranslation, Trans } from 'react-i18next';
import {
        NavLink
} from "react-router-dom";

class PageNotFound extends Component {


        render = () => {
                const { t } = this.props;
                return (
                        <>
                                <Container>
                                        <img className=""
                                                width='100%'
                                                height='auto'
                                                alt="poster"
                                                src={PageNotFound_404Img}
                                        />
                                        <NavLink style={{ margin: '3%' }} exact to="/" style={{ width: 'fit-content' }} className="pagenotFoundBtn mx-auto d-block">

                                                ...{t('404')}...
                                        </NavLink>

                                </Container>
                        </>
                )
        }
}



export default withTranslation()(PageNotFound);

