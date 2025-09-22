
import { createClient, type User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import type { Asset } from '../background'

const supabaseURL = "https://oqawdekjzxidfkqrgsot.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseURL, supabaseAnonKey)


export function ExtPopup({ asset, sendAuthMessage,sendLogoutMessage }: { asset: Asset, sendAuthMessage: () => void, sendLogoutMessage: () => void }) {

    const [isSaved, setIsSaved] = useState(false)

    const [user, setUser] = useState<User | null>(null)
    console.log("user",user)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("event",event)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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

    // function redirectToMuse() {
    //     // local host for now, muse.com later
    //     window.open('http://localhost:3000', '_blank');
    // }

    console.log("rendering popup")
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