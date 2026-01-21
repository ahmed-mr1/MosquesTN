import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Key, MapPin, MessageSquare, Star, Edit3, Shield } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <BookOpen className="logo-icon" size={28} />
                <h1 className="logo-text">MosquesTN API</h1>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">🏠</span> Introduction
                </NavLink>
                <NavLink to="/auth" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Key size={18} /> Authentication
                </NavLink>

                <div className="nav-group">Resources</div>

                <NavLink to="/mosques" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <MapPin size={18} /> Mosques
                </NavLink>
                <NavLink to="/suggestions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <MessageSquare size={18} /> Suggestions
                </NavLink>
                <NavLink to="/reviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Star size={18} /> Reviews
                </NavLink>
                <NavLink to="/edits" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Edit3 size={18} /> Edits
                </NavLink>

                <div className="nav-group">Admin</div>

                <NavLink to="/moderation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Shield size={18} /> Moderation
                </NavLink>
            </nav>
            <div className="sidebar-footer">
                <div>v1.0.0</div>
                <div className="developer-credit">Developed by Ahmed Mrabet</div>
            </div>
        </aside>
    );
};

export default Sidebar;
