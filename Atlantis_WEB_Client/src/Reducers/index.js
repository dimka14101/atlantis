import { combineReducers } from "redux";
// import recommendationMovies from "./recommendations";
// import movies from "./movies";
import movie from "./movie";
import mqtt from './mqtt';
import atlantisHub from './AtlantisHub';
import auth from "./auth";
import message from "./message";


const rootReducer = combineReducers({
   movie,
   mqtt,
   atlantisHub,
   auth,
   message,
});

export default rootReducer;
