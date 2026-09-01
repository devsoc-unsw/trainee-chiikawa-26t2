import { createBrowserRouter } from "react-router";
import Landing, { loginAction, loginLoader } from "./pages/landing/Landing";
import Dashboard, { dashboardLoader } from "./pages/dashboard/Dashboard";
import DeckPage from "./pages/decks/DeckPage";
import CardScreen from "./pages/cards/CardScreen";
import { logoutAction } from "./lib/auth";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/login", Component: Landing, action: loginAction, loader: loginLoader },
  { path: "/dashboard", Component: Dashboard, loader: dashboardLoader, hydrateFallbackElement: <div>Loading...</div> },
  { path: "/decks/:deckId", Component: DeckPage },
  { path: "/decks/:deckId/play", Component: CardScreen },
  { path: "/logout", action: logoutAction }
]);