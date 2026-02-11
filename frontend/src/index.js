import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
const hasSupabase =
  process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!hasSupabase) {
  root.render(
    <div
      style={{
        padding: 40,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 560,
        margin: "60px auto",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ marginBottom: 16 }}>Configuration required</h1>
      <p>
        Add these environment variables in Netlify (Site settings → Build & deploy → Environment variables):
      </p>
      <ul style={{ marginBottom: 24 }}>
        <li><strong>REACT_APP_SUPABASE_URL</strong></li>
        <li><strong>REACT_APP_SUPABASE_ANON_KEY</strong></li>
      </ul>
      <p>
        Get them from your Supabase project: Dashboard → Settings → API. Then trigger a new deploy.
      </p>
    </div>
  );
} else {
  import("./App").then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
