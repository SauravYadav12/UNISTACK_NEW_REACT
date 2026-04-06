import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import { useEffect, useState } from 'react';
import './layout.css';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import FloatingAiChat from '../aiChat/FloatingAiChat';
import { RequirementAiChatProvider } from '../../context/RequirementAiChatContext';

function Layout() {
  const location = useLocation();
  const { syncIUser, accessControlState, myProfileState } = useAuth();
  const [toggleSidebar, setTogglesidebar] = useState(false);

  const handleSidebarToggle = () => {
    setTogglesidebar(!toggleSidebar);
  };

  useEffect(() => {
    !myProfileState.data && myProfileState.loadData();
    // syncIUser();
    // accessControlState?.loadData();
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 970) {
        setTogglesidebar(true);
      } else {
        setTogglesidebar(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <RequirementAiChatProvider>
      <div className="layout">
        <Navbar sidebar={handleSidebarToggle} toggleSideBar={toggleSidebar} />
        <div className="sidebar-layout">
          <Sidebar toggleSideBar={toggleSidebar} />
          <div className="outlet-layout">
            <Outlet />
          </div>
        </div>
        {location.pathname === '/requirements' && <FloatingAiChat />}
      </div>
    </RequirementAiChatProvider>
  );
}

export default Layout;
