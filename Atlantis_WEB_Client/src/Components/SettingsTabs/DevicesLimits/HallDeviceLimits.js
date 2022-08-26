import React from 'react'
import { Tabs, Tab, Container } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import MultiRangeSlider from "../MultiRangeSlider/MultiRangeSlider";
import Cookies from 'universal-cookie';

const HallDeviceLimits = () => {
    const { t, i18n } = useTranslation();
    const cookies = new Cookies();
    const HallDeviceLimitsCookie = {
        ComfTemp: { min: 20, max: 35 },
        ComfHmdt: { min: 30, max: 60 },
        NormVibro: { min: 0, max: 1000 },
        ComfLmnst: { min: 1000, max: 20000 },
        NormMQ135: { min: 0, max: 200 },
        NormMQ9: { min: 0, max: 300 }
    };


    const updateCookie = (key, min, max) => {
        console.log(`HallLimits--->key= ${key}, min = ${min}, max = ${max}`)
        HallDeviceLimitsCookie[key].min = min;
        HallDeviceLimitsCookie[key].max = max;
        cookies.set('HallDeviceLimitsCookie', HallDeviceLimitsCookie, { path: '/' });
        console.log(cookies.get('HallDeviceLimitsCookie'));
    }

    return (
        <>

            <Container >
                <div className='col'>
                    <div className='row'>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">Comfortable temperature</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={-50} max={50} minDef={20} maxDef={35} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">Comfortable humidity</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={100} minDef={30} maxDef={60} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">Window vibro range</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={10000} minDef={0} maxDef={1000} onChange={({ min, max }) => updateCookie('NormVibro', min, max)} />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">Comfortable luminosity</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={100000} minDef={1000} maxDef={20000} onChange={({ min, max }) => updateCookie('ComfLmnst', min, max)} />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">MQ9 sensor</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4000} minDef={0} maxDef={200} onChange={({ min, max }) => updateCookie('NormMQ9', min, max)} />
                            </div>
                        </div>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">MQ135 sensor</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4000} minDef={0} maxDef={300} onChange={({ min, max }) => updateCookie('NormMQ135', min, max)} />
                            </div>
                        </div>
                    </div>
                </div>

            </Container>
        </>
    )
}



export default HallDeviceLimits;