import React from 'react'
import SettingsGeneralTab from './SettingsTabs/SettingsGeneralTab';
import SettingsMosquitoTab from './SettingsTabs/SettingsMosquitoTab';
import SettingsDevicesLimitsTab from './SettingsTabs/SettingsDevicesLimitsTab';
import SettingsAccountTab from './SettingsTabs/SettingsAccountTab';
import { Tabs, Tab, Container } from 'react-bootstrap';
import SettingsStyles from '../Styles/SettingsStyles.css';
import { useTranslation, withTranslation, Trans } from 'react-i18next';

const Settings = () => {
    const { t, i18n } = useTranslation();

    return (
        <>

            <div className="sidenav">
                <a href="#general">{t('Settings.TabsName.General')}</a>
                <a href="#mosquito">{t('Settings.TabsName.Mosquito')}</a>
                <a href="#account">{t('Settings.TabsName.Account')}</a>
                <a href="#limits">{t('Settings.TabsName.Limits')}</a>
            </div>

            <Container >


                <SettingsDevicesLimitsTab /> {/*TODO: move to end */}
                <SettingsGeneralTab />
                <SettingsMosquitoTab />
                <SettingsAccountTab />

            </Container>
        </>
    )
}



export default Settings;