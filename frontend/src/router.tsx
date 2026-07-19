import { createBrowserRouter } from "react-router";
import Landing from "./pages/landing/Landing";
import Dashboard from "./pages/dashboard/Dashboard";
import DeckPage from "./pages/decks/DeckPage";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/dashboard", Component: Dashboard },
  { path: "/decks/:deckId", Component: DeckPage }
]);