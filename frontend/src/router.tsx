import { createBrowserRouter } from "react-router";
import Landing, { loginAction, loginLoader } from "./pages/landing/Landing";
import Dashboard, { dashboardLoader } from "./pages/dashboard/Dashboard";
import DeckPage from "./pages/deckpage/DeckPage";
import CardScreen, { cardScreenLoader } from "./pages/cards/CardScreen";
import { logoutAction } from "./lib/auth";
import Decks, { decksLoader } from "./pages/decks/Decks";
export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/login", Component: Landing, action: loginAction, loader: loginLoader },
  { path: "/dashboard", Component: Dashboard, loader: dashboardLoader, hydrateFallbackElement: <div>Loading...</div> },
  { path: "/decks", Component: Decks, loader: decksLoader, hydrateFallbackElement: <div>Loading...</div> },
  { path: "/decks/:deckId", Component: DeckPage },
  { path: "/decks/:deckId/play", Component: CardScreen, loader: cardScreenLoader, hydrateFallbackElement: <div>Loading...</div> },
  { path: "/logout", action: logoutAction }
]);