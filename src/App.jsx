import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import Browse from './pages/Browse';
import CourseDetail from './pages/CourseDetail';
import Search from './pages/Search';
import { ErrorState } from './components/States';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="library" element={<Library />} />
          <Route path="browse" element={<Browse />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="*" element={<div className="container"><ErrorState message="Page not found." /></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
