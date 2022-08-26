import React, { Component } from 'react'

import { ThemeContext } from '../ThemeContext';
import '../../Styles/ThemeSwitch.css'

class ThemeSwitch extends Component {

    render = () => {
        return (
            <ThemeContext.Consumer>
                {
                    theme => (
                        <>
                            <div className="input-group mb-3">
                                <div className="input-group-prepend">
                                    <span className="input-group-text" htmlFor="inputGroupSelect01">🎨</span>
                                </div>
                                <select className="custom-select" id="inputGroupSelect01" onChange={theme.changeTheme()} value={theme.themeMode}>
                                    {/* <option selected>Choose...</option> */}
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="gray">gray-Coming soon</option>
                                </select>
                            </div>
                        </>
                    )
                }
            </ThemeContext.Consumer>
        )
    }
}

export default ThemeSwitch;
