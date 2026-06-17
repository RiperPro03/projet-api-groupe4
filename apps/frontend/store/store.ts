import { configureStore } from "@reduxjs/toolkit";
import likesReducer from "./likesSlice";

export const store = configureStore({
  reducer: {
    likes: likesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
