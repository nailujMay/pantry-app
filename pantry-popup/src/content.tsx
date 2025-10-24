/* eslint-disable react-refresh/only-export-components */
import ReactDOM from "react-dom/client";
import type { Asset } from "./background";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./content.css";

// Create Supabase client in content script
const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseURL, supabaseAnonKey);

console.log("Content script loaded");

function MusePopup({ asset }: { asset: Asset }) {
  const [isSaved, setIsSaved] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check for session in chrome storage on mount
  useEffect(() => {
    chrome.storage.local.get(["session"], async (result) => {
      if (result.session) {
        console.log("Session found in storage:", result.session);
        const { data, error } = await supabase.auth.setSession(result.session);
        if (error) {
          console.error("Error setting session:", error);
        } else {
          console.log("Session set successfully:", data);
          setHasSession(true);
        }
      }
    });
  });

  async function saveAsset() {
    console.log("saving asset");
    try {
      const { data, error } = await supabase.from("asset collection").insert({
        src_url: asset.url,
        asset_type: asset.type,
      });

      if (error) {
        console.error("Error saving asset:", error);
        throw error;
      }

      console.log("Asset saved successfully:", data);
      setIsSaved(true);
    } catch (error) {
      console.error("Error in saveAsset:", error);
    }
  }

  async function handleLogout() {
    console.log("Logging out");
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase signOut error:", error);
      }

      // Remove session from Chrome storage
      await chrome.storage.local.remove(["session"]);

      // Update state
      setHasSession(false);
      console.log("Logout successful");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  return (
    <div className="muse-extension-modal">
      <div className="muse-extension-header">
        <button onClick={removeModal} className="muse-extension-close-btn">
          ✕
        </button>
        <button
          className="muse-extension-btn muse-extension-btn-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      {hasSession ? (
        <>
          <h1 className="muse-extension-title">Muse</h1>
          <img className="muse-extension-image" src={asset.url} alt="Asset" />

          <button
            className="muse-extension-btn muse-extension-btn-primary"
            onClick={saveAsset}
          >
            Save
          </button>
          {isSaved && <p className="muse-extension-success-msg">Asset saved</p>}
        </>
      ) : (
        <a
          href="http://localhost:3000"
          target="_blank"
          className="muse-extension-link"
        >
          {"login at muse"}
        </a>
      )}
    </div>
  );
}

let modalRoot: ReactDOM.Root | null = null;

function injectModal(asset: Asset) {
  let container = document.getElementById("my-extension-modal");

  // Create new modal container
  container = document.createElement("div");
  container.id = "my-extension-modal";
  document.body.appendChild(container);

  // Create root once and store it
  modalRoot = ReactDOM.createRoot(container);
  modalRoot.render(<MusePopup asset={asset} />);
}

function removeModal() {
  const container = document.getElementById("my-extension-modal");
  if (container) {
    modalRoot?.unmount();
    container.remove();
    modalRoot = null;
  }
}

// if message is received from background.ts
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "save-image") {
    console.log("Asset to save:", message.asset);
    // Send response back to confirm receipt
    injectModal(message.asset.asset);
  }
  // Return true to indicate we will send a response
  return true;
});
