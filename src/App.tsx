import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/index'
import MapPage from './pages/map'
import FavoritesPage from './pages/favorites'
import DetailPage from './pages/detail'
import NavigationBar from './components/NavigationBar'

function App() {
  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/detail/:id" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
