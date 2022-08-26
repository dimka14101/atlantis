import React from 'react'
import { Tabs, Tab, Container } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import MultiRangeSlider from "../MultiRangeSlider/MultiRangeSlider";
import Cookies from 'universal-cookie';


const BathDeviceLimits = () => {
    const { t, i18n } = useTranslation();
    const cookies = new Cookies();
    const BathDeviceLimitsCookie = {
        ComfTemp: { min: 20, max: 35 },
        ComfHmdt: { min: 30, max: 60 },
        NormWaterLvl: { min: 3200, max: 4095 },
        ComfLmnst: { min: 1000, max: 20000 },
        NormMQ135: { min: 0, max: 200 },
        NormMQ9: { min: 0, max: 300 }
    };


    const updateCookie = (key, min, max) => {
        //console.log(`BathLimits--->key= ${key}, min = ${min}, max = ${max}`)
        BathDeviceLimitsCookie[key].min = min;
        BathDeviceLimitsCookie[key].max = max;
        cookies.set('BathDeviceLimitsCookie', BathDeviceLimitsCookie, { path: '/' });
        // console.log(cookies.get('BathDeviceLimitsCookie'));
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
                                <MultiRangeSlider min={0} max={100} minDef={30} maxDef={60} onChange={({ min, max }) => updateCookie('ComfHmdt', min, max)} />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">Water range</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4095} minDef={3200} maxDef={4095} onChange={({ min, max }) => updateCookie('NormWaterLvl', min, max)} />
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



export default BathDeviceLimits;