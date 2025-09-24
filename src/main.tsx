import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import './index.css'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SubmitPharmacyPage from './pages/SubmitPharmacyPage'
import AdminPage from './pages/AdminPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <HomePage />
            </Layout>
          } />
          <Route path="/submit" element={
            <Layout>
              <SubmitPharmacyPage />
            </Layout>
          } />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
