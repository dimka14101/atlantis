import axios from "axios";

const API_URL = "https://localhost/AtlantisApi/account/";

const register = (UserName, Email, Password,PasswordConfirm, Year) => {
  return axios.post(API_URL + "register", {
    UserName,
    Email,
    Password,
    PasswordConfirm,
    Year
  });
};

const login = (username, password, rememberme = true, returnurl = 'somewhere') => {
  return axios
    .post(API_URL + "login", {
      username,
      password,
      rememberme,
      returnurl
    })
    .then((response) => {
      if (response.data  && response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
        return response.data;
      } else {
        response.error = "login error";
      }

     
    }).catch((error) => {
      // Error
      if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          // console.log(error.response.data);
          // console.log(error.response.status);
          // console.log(error.response.headers);
      } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the 
          // browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
      } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
      }
      console.log(error.config);
      return Promise.reject(error);
  });
};

const logout = () => {
  localStorage.removeItem("user");
};

export default {
  register,
  login,
  logout,
};