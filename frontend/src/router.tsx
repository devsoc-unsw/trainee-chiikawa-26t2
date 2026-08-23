import { createBrowserRouter } from "react-router";
import Landing, { loginAction, loginLoader } from "./pages/landing/Landing";
import Dashboard, { dashboardLoader } from "./pages/dashboard/Dashboard";
import DeckPage from "./pages/decks/DeckPage";
import { logoutAction } from "./lib/auth";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/login", Component: Landing, action: loginAction, loader: loginLoader },
  { path: "/dashboard", Component: Dashboard, loader: dashboardLoader },
  { path: "/decks/:deckId", Component: DeckPage },
  { path: "/logout", action: logoutAction }
]);