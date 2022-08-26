import { MOVIE_REQ, MOVIE_RES, MOVIE_ERR } from "../Constants";

const initialState = {
  movie: {},
  movieLoaded: false,
  movieErrors: [],
};

const movieReducer = (state = initialState, action) => {
  switch (action.type) {
    case MOVIE_REQ:
      return {
        ...state,
        movieLoaded: false,
      };
    case MOVIE_RES:
      return {
        ...state,
        movieLoaded: true,
        movie: action.payload,
      };
    case MOVIE_ERR:
      return {
        ...state,
        movieErrors: [...state.movieErrors, action.error],
      };
    default:
      return state;
  }
};

export default movieReducer;
