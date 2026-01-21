import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <div className="content-container">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
