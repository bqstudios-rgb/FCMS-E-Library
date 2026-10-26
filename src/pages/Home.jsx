import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const hide = (e) => { e.currentTarget.style.display = 'none'; };

const FEATURES = [
  { img: '/image/about-students.jpg', alt: 'Students studying together', title: 'Created by students, for students.', text: 'This library is created and contributed by students to make access to materials easier for everyone.' },
  { img: '/image/about-verified.jpg', alt: 'Reviewing study materials', title: 'Verified for Accuracy.', text: 'Every piece of content is verified by delegated admins and seniors to ensure accuracy and factual materials.' },
  { img: '/image/about-download.jpg', alt: 'Downloading study materials on a phone', title: 'Easy Downloads.', text: 'All materials are downloadable for your convenience.' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      <SEO title="Home" description="FCMS Library: all your PDFs, class materials and past questions in one digital library." />
      <section className="hero">
        <img className="hero-img" src="/image/hero.jpg" alt="" onError={hide} />
        <div className="hero-content">
          <h1>FCMS Library: All Your PDFs, Class Materials & Past Questions in One Digital Library.</h1>
          <h2>No account required. Just search away.</h2>
          <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 24 }} onClick={() => navigate('/library')}>Get Started</button>
        </div>
      </section>
      <div className="container">
        <div className="features">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="feature-media"><img src={f.img} alt={f.alt} onError={hide} /></div>
              <div className="feature-body"><h3>{f.title}</h3><p>{f.text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
