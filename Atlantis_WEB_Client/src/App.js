import React, { Component, Suspense, useState, useEffect } from 'react';
import { Provider,  useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Route, Switch, Link } from "react-router-dom";
import { Home, Settings, PageNotFound} from "./Components";

import { I18nextProvider, useTranslation, withTranslation, Trans } from 'react-i18next';
import i18n from './i18n';
import logo from './Images/sitePreload.png';
import './App.css';
import { Button, Container } from 'react-bootstrap';
import TopPanel from './Components/TopPanel';

import { ThemeContext } from './Components/ThemeContext';


import Login from "./Components/Authentication/login";
import Register from "./Components/Authentication/register";
import AdminHome from "./Components/AdminPanel/home";
import Profile from "./Components/Authentication/profile";
import BoardUser from "./Components/AdminPanel/board.user";
import BoardModerator from "./Components/AdminPanel/board.moderator";
import BoardAdmin from "./Components/AdminPanel/board.admin";

import { logout } from "./Actions/auth";
import { clearMessage } from "./Actions/message";

import { history } from "./Helpers/history";
// page uses the hook
// function Page() {
//   const { t, i18n } = useTranslation();

//   const changeLanguage = (lng) => {
//     i18n.changeLanguage(lng);
//   };

//   const [theme, setTheme] = useState('light');
  
//   const toggleTheme = () => {
//     if (theme === 'light') {
//       setTheme('dark');
//     } else {
//       setTheme('light');
//     }
//   }

//   return (
   
// <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
//     <div className="App">
//       <div className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//       </div>
//       <>
//         {/* <GlobalStyles /> */}
//          Pass the toggle functionality to the button
//         <button onClick={toggleTheme}>Toggle theme</button>
//         <h1>It's a light theme!</h1>
//         <footer>
//         </footer>
//       </>
//       <div>{t('description.part2')}</div>
//     </div>
//     </ThemeProvider>

//   );
// }


// here app catches the suspense from page in case translations are not yet loaded
const App = () => {

	// state = {
  //   themeMode: 'light'
  // }
  

  const [themeMode, setThemeMode] = useState('light');

    
  const changeTheme = () => (event) => {
    var newTheme =  event.target.value;
   //this.setState({ themeMode: newTheme });
    setThemeMode(newTheme);
 }



    //const { themeMode } = this.state;
    //const { changeTheme } = this;

    
  const Loader = () => (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
      <div>loading...</div>
    </div>
  );


  return (
    <div  className={`body ${themeMode}`}>
  
      <I18nextProvider i18n={i18n}>
      <ThemeContext.Provider value={{ themeMode, changeTheme }}>

       <Suspense fallback={<Loader/>}>
    <BrowserRouter history={history}>

      <TopPanel/>
   
      
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/settings" component={Settings} />
        {/* <Route exact path="/theme" component={Page} /> */}
        {/* <Route exact path="/:id" component={Page} /> */}
        <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/profile" component={Profile} />
            <Route path="/admin_home" component={AdminHome} />
            <Route path="/user" component={BoardUser} />
            <Route path="/mod" component={BoardModerator} />
            <Route path="/admin" component={BoardAdmin} />
        <Route component={PageNotFound} />
      </Switch>
    </BrowserRouter>
    </Suspense>                    
    </ThemeContext.Provider>
    </I18nextProvider>

  </div>

  );
  }

export default App;