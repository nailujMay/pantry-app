
import ReactDOM from "react-dom/client";
import { ExtPopup } from "./components/ExtPopup"; // your modal component
import type { Asset } from "./background";
console.log("Content script loaded");
// content.js
function injectModal(asset: Asset) {
  console.log("injecting modal");
    if (document.getElementById("my-extension-modal")) return;
  
    const container = document.createElement("div");
    container.id = "my-extension-modal";
    document.body.appendChild(container);
  
    const root = ReactDOM.createRoot(container);
    console.log("rendering modal");
    root.render(<ExtPopup asset={asset} />);
  }
  
  // Listen for messages from background.js
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "open_modal") {
      injectModal(msg.asset);
    }
  });

// if message is received from background.ts
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "save-image") {
        console.log("Save image to pantry----------------------");
        console.log("Asset to save:", message.asset);
        // Send response back to confirm receipt
        injectModal(message.asset);
    }
    // Return true to indicate we will send a response
    return true;
});