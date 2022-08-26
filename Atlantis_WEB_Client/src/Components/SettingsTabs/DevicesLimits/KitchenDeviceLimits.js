import React from 'react'
import { Tabs, Tab, Container } from 'react-bootstrap';
import { useTranslation, withTranslation, Trans } from 'react-i18next';
import MultiRangeSlider from "../MultiRangeSlider/MultiRangeSlider";
import Cookies from 'universal-cookie';

const KitchenDeviceLimits = () => {
    const { t, i18n } = useTranslation();
    const cookies = new Cookies();
    const KitchenDeviceLimitsCookie = {
        ComfTemp: { min: 20, max: 35 },
        ComfHmdt: { min: 30, max: 60 },
        NormVibro: { min: 0, max: 1000 },
        ComfLmnst: { min: 1000, max: 20000 },
        MQ2: { min: 0, max: 300 },
        MQ5: { min: 0, max: 200 },
        MQ9: { min: 0, max: 200 },
        MQ135: { min: 0, max: 300 }
    };


    const updateCookie = (key, min, max) => {
        console.log(`KitchenLimits--->key= ${key}, min = ${min}, max = ${max}`)
        KitchenDeviceLimitsCookie[key].min = min;
        KitchenDeviceLimitsCookie[key].max = max;
        cookies.set('KitchenDeviceLimitsCookie', KitchenDeviceLimitsCookie, { path: '/' });
        console.log(cookies.get('KitchenDeviceLimitsCookie'));
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
                                <MultiRangeSlider min={0} max={10000} minDef={0} maxDef={1000} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className="col-sm-4" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">Comfortable luminosity</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={100000} minDef={1000} maxDef={20000} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className="col-sm-3" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">MQ2 sensor</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4000} minDef={0} maxDef={300} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                        <div className="col-sm-3" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">MQ5 sensor</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4000} minDef={0} maxDef={200} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                        <div className="col-sm-3" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">MQ9 sensor</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4000} minDef={0} maxDef={200} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                        <div className="col-sm-3" style={{ marginBottom: '10px' }}>
                            <label htmlFor="basic-url">MQ135 sensor</label>
                            <div className="input-group mb-3">
                                <MultiRangeSlider min={0} max={4000} minDef={0} maxDef={300} onChange={({ min, max }) => updateCookie('ComfTemp', min, max)} />
                            </div>
                        </div>
                    </div>
                </div>

            </Container>
        </>
    )
}



export default KitchenDeviceLimits;