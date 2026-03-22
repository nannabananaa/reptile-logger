import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AddReptile from './pages/AddReptile';
import ReptileDetail from './pages/ReptileDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddReptile />} />
        <Route path="/reptile/:id" element={<ReptileDetail />} />
      </Route>
    </Routes>
  );
}
