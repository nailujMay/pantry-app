/* eslint-disable react-refresh/only-export-components */
import ReactDOM from "react-dom/client";
import type { Asset } from "./background";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client in content script
const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseURL, supabaseAnonKey);

console.log("Content script loaded");

function MusePopup({ asset, userAuth }: { asset: Asset; userAuth: boolean }) {
  const [isSaved, setIsSaved] = useState(false);
  const [hasSession, setHasSession] = useState(userAuth);

  // Check for session in chrome storage on mount
  useEffect(() => {
    chrome.storage.local.get(["session"], async (result) => {
      if (result.session) {
        console.log("Session found in storage:", result.session);
        try {
          // Set the session in the supabase client
          const { data, error } = await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });

          if (error) {
            console.error("Error setting session:", error);
            setHasSession(false);
            // Clear invalid session
            await chrome.storage.local.remove(["session"]);
          } else {
            console.log("Session set successfully:", data);
            setHasSession(true);
          }
        } catch (error) {
          console.error("Error setting session:", error);
          setHasSession(false);
        }
      } else {
        console.log("No session found");
        setHasSession(false);
      }
    });
  }, []);

  async function saveAsset() {
    console.log("saving asset");

    // Check if session is still valid
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("Current session:", session);

    if (!session) {
      console.error("No valid session found");
      setHasSession(false);
      return;
    }

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
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        display: "flex",
        zIndex: 999999,
        border: "1px solid black",
        margin: "10px",
        backgroundColor: "white",
        borderRadius: "8px",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px",
      }}
    >
      {/* Close button */}
      <button
        onClick={() => {
          const container = document.getElementById("my-extension-modal");
          if (container) {
            modalRoot?.unmount();
            container.remove();
            modalRoot = null;
          }
        }}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          background: "transparent",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          color: "#666",
        }}
      >
        ✕
      </button>
      {hasSession ? (
        <>
          <h1
            style={{
              color: "#333",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            Muse
          </h1>
          <img
            style={{ height: "200px", width: "auto" }}
            src={asset.url}
            alt="Asset"
          />

          <button
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "10px",
              borderRadius: "5px",
            }}
            onClick={saveAsset}
          >
            Save
          </button>
          {isSaved && <p>Asset saved</p>}
        </>
      ) : (
        <a href="http://localhost:3000" target="_blank">
          {"login at muse"}
        </a>
      )}

      <button
        style={{
          backgroundColor: "red",
          color: "white",
          padding: "8px",
          borderRadius: "5px",
          marginTop: "10px",
        }}
        onClick={handleLogout}
      >
        Logout
      </button>
      <button
        style={{
          backgroundColor: "red",
          color: "white",
          padding: "8px",
          borderRadius: "5px",
          marginTop: "10px",
        }}
        onClick={removeModal}
      >
        Close
      </button>
    </div>
  );
}

// Store the root so we can reuse it
let modalRoot: ReactDOM.Root | null = null;

function injectModal(asset: Asset, userAuth: boolean) {
  let container = document.getElementById("my-extension-modal");

  // If modal already exists, update it instead of creating new one
  if (container && modalRoot) {
    modalRoot.render(<MusePopup asset={asset} userAuth={userAuth} />);
    return;
  }

  // Create new modal container
  container = document.createElement("div");
  container.id = "my-extension-modal";
  document.body.appendChild(container);

  // Create root once and store it
  modalRoot = ReactDOM.createRoot(container);
  modalRoot.render(<MusePopup asset={asset} userAuth={userAuth} />);
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
    injectModal(message.asset.asset, message.asset.auth);
  }
  // Return true to indicate we will send a response
  return true;
});
