import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import Landing from './routes/Landing'
import FanApp from './routes/FanApp'
import OpsApp from './routes/OpsApp'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/fan" element={<FanApp />} />
        <Route path="/ops" element={<OpsApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
