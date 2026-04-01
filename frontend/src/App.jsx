import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import AdminPage from "./pages/AdminPage";
import ContinentsPage from "./pages/ContinentsPage";
import CountriesPage from "./pages/CountriesPage";
import GeminiPage from "./pages/GeminiPage";
import HomePage from "./pages/HomePage";
import WorldPage from "./pages/WorldPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gemini" element={<GeminiPage />} />
        <Route path="/world" element={<WorldPage />} />
        <Route path="/continents" element={<ContinentsPage />} />
        <Route path="/countries" element={<CountriesPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  );
}
