import Navbar from "../components/layout/Nav";
import Hero from '../components/Hero'
import About from '../components/About'
import Services from '../components/Services'
import Dividends from '../components/Dividends'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

const Landing = () => {
  return (
    <div className="min-h-screen bg-navy-900 text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Dividends />
      <Testimonials />
      <CTA />
      <Contact />
      <Footer />
    </div>
  );
};

export default Landing;