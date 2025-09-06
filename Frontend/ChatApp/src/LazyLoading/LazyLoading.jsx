import { lazy } from "react";

const LazyChat = lazy(() => import("../Main/Chat"));
const LazyProfile = lazy(() => import("../Main/Profile"));
const LazyHome = lazy(() => import("../Main/Home"));

export { LazyChat, LazyProfile, LazyHome };