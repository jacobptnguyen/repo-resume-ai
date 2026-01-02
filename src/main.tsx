import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// StrictMode removed to prevent double renders and refresh on focus
// Can be re-enabled in production if needed: import.meta.env.PROD ? <React.StrictMode><App /></React.StrictMode> : <App />
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)

