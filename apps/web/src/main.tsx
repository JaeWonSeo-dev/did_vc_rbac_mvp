import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OverviewPage } from "./pages/OverviewPage";
import { IssuerPage } from "./pages/IssuerPage";
import { WalletPage } from "./pages/WalletPage";
import { VerifierPage } from "./pages/VerifierPage";
import { ProtectedPage } from "./pages/ProtectedPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="issuer" element={<IssuerPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="verifier" element={<VerifierPage />} />
          <Route path="admin" element={<ProtectedPage title="Admin Console" endpoint="/api/admin/data" />} />
          <Route path="audit" element={<ProtectedPage title="Audit Console" endpoint="/api/audit/data" />} />
          <Route path="dev" element={<ProtectedPage title="Developer Console" endpoint="/api/dev/data" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
