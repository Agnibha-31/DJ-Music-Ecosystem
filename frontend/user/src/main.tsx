
  import { createRoot } from "react-dom/client";
  import { Suspense, StrictMode } from "react";
  import App from "./App.tsx";
  import "./index.css";

  // Loading fallback component
  const LoadingFallback = () => (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to br, #581c87 via-blue-950 to-pink-950)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'system-ui',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '24px',
          marginBottom: '20px',
          animation: 'pulse 1.5s infinite'
        }}>Loading...</div>
      </div>
    </div>
  );

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <StrictMode>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </StrictMode>
  );
  