import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../Navbar.jsx';
import Footer from '../Footer.jsx';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>
        {children || <Outlet />}
      </main>
      <Footer />
    </>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
};

export default Layout;
