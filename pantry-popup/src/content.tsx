import ReactDOM from "react-dom/client";
import type { Asset } from "./background";
import { useState } from "react";
console.log("Content script loaded");

import { createClient, type User } from '@supabase/supabase-js'

const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseURL, supabaseAnonKey)

function MusePopup({ asset}: { asset: Asset}) {
  const [isSaved, setIsSaved] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  console.log("user",user)

  async function saveAsset() {
      console.log("saving asset")
      try{
          const {data, error} = await supabase.from('asset collection').insert({
              src_url: asset.url,
              asset_type: asset.type
            
          })
          console.log(data)
          setIsSaved(true)
          if(error) {
              throw error
          }

      }catch(error) {
          console.error(error)
      }
  }

  async function sendAuthMessage(){
    const response = await chrome.runtime.sendMessage({action: "auth-message"}, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        return;
      }
            
      if (response && response.action === "auth-success") {
        console.log("Authentication successful:", response.userInfo);
        setUser(response.userInfo);
      } else if (response && response.action === "auth-error") {
        console.error("Authentication failed:", response.error);
      }
    });
    console.log("auth response received", response);
  }
  
  function sendLogoutMessage(){
    chrome.runtime.sendMessage({action: "logout-message"});
  }
  return (
      <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          display: 'flex',
          zIndex: 999999,
          border: '1px solid black',
          margin: '10px',
          backgroundColor: 'white',
          borderRadius: '8px',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px'
      }}>
    
          
         { user ?
         <>
         <h1 style={{ 
              color: '#333',
              fontSize: '24px',
              fontWeight: 'bold'
          }}>Muse</h1>
          <img style={{height: '200px', width: 'auto'}} src={asset.url} alt="Asset" />

          <button style={{
              backgroundColor: 'blue',
              color: 'white',
              padding: '10px',
              borderRadius: '5px'
          }} onClick={saveAsset}>Save</button>
          {isSaved && <p>Asset saved</p>}
          </>
          
          :<button onClick={sendAuthMessage}>{"login at muse"}</button>}

          <button onClick={sendLogoutMessage}>{"logout"}</button>
      </div>
  )
}




function injectModal(asset: Asset) {
    if (document.getElementById("my-extension-modal")) return;
  
    const container = document.createElement("div");
    container.id = "my-extension-modal";
    document.body.appendChild(container);
  
    const root = ReactDOM.createRoot(container);
    root.render(<MusePopup asset={asset} />);
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

