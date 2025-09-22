
import ReactDOM from "react-dom/client";
import { ExtPopup } from "./components/ExtPopup"; // your modal component
import type { Asset } from "./background";
console.log("Content script loaded");


async function sendAuthMessage(){
  const response = await chrome.runtime.sendMessage({action: "auth-message"}, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
      return;
    }
    
    console.log("auth response received", response);
    
    if (response && response.action === "auth-success") {
      console.log("Authentication successful:", response.userInfo);
      // Handle successful authentication
    } else if (response && response.action === "auth-error") {
      console.error("Authentication failed:", response.error);
      // Handle authentication error
    }
  });
  console.log("auth response received", response);
}

function sendLogoutMessage(){
  chrome.runtime.sendMessage({action: "logout-message"});
}


function injectModal(asset: Asset) {
  console.log("injecting modal");
    if (document.getElementById("my-extension-modal")) return;
  
    const container = document.createElement("div");
    container.id = "my-extension-modal";
    document.body.appendChild(container);
  
    const root = ReactDOM.createRoot(container);
    console.log("rendering modal");
    root.render(<ExtPopup asset={asset} sendAuthMessage={sendAuthMessage} sendLogoutMessage={sendLogoutMessage} />);
  }


  
// if message is received from background.ts
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "save-image") {
        console.log("Asset to save:", message.asset);
        // Send response back to confirm receipt
        injectModal(message.asset);
    }
    // Return true to indicate we will send a response
    return true;
});

