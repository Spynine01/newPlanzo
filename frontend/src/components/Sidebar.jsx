import React, { useState, useEffect } from 'react'
import { FaBars } from "react-icons/fa"
import {
    FaCommentAlt,
    FaRegChartBar,
    FaTh,
    FaThList,
    FaUserAlt,
    FaUsers,
    FaBriefcase,
    FaClipboardList,
    FaCog,
    FaCreditCard,
    FaSignOutAlt
} from "react-icons/fa"
import { MdEvent, MdDashboard, MdAdminPanelSettings } from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom'

export const Sidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState('');
    
    const toggle = () => setIsOpen(!isOpen);
    
    useEffect(() => {
        // Check auth status and role on component mount
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        
        setIsAuthenticated(!!token);
        setUserRole(role || '');
    }, []);
    
    // Common menu items for all users
    const commonMenuItems = [
        {
            path:"/events",
            name:"Events",
            icon:<MdEvent/>,
            visible: true
        },
        {
            path:"/wallet",
            name:"Wallet",
            icon:<FaCreditCard/>,
            visible: isAuthenticated
        },
        {
            path:"/profile",
            name:"Profile",
            icon:<FaUserAlt/>,
            visible: isAuthenticated
        }
    ];
    
    // Admin-only menu items
    const adminMenuItems = [
        {
            path:"/admin",
            name:"Admin Dashboard",
            icon:<MdAdminPanelSettings/>,
            visible: true
        },
        {
            path:"/dashboard",
            name:"Analytics",
            icon:<MdDashboard/>,
            visible: true
        },
        {
            path:"/users",
            name:"Users",
            icon:<FaUsers/>,
            visible: true
        },
        {
            path:"/recommendations",
            name:"Recommendations",
            icon:<FaClipboardList/>,
            visible: true
        },
        {
            path:"/settings",
            name:"Settings",
            icon:<FaCog/>,
            visible: true
        }
    ];
    
    // Event organizer specific items
    const organizerMenuItems = [
        {
            path:"/events/add",
            name:"Create Event",
            icon:<MdEvent/>,
            visible: userRole === 'organizer'
        },
        {
            path:"/my-events",
            name:"My Events",
            icon:<FaBriefcase/>,
            visible: userRole === 'organizer'
        },
        {
            path:"/analytics",
            name:"Sales Analytics",
            icon:<FaRegChartBar/>,
            visible: userRole === 'organizer'
        }
    ];
    
    // Combine all menu items and filter based on visibility
    const allMenuItems = [...commonMenuItems, ...adminMenuItems, ...organizerMenuItems]
        .filter(item => item.visible);
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        navigate('/login');
        window.location.reload();
    };

    return (
        <div className="sidebar-container">
            <div style={{width: isOpen ? "250px" : "50px"}} className="sidebar">
                <div className="top_section">
                    <h1 style={{display: isOpen ? "block" : "none"}} className='logo'>Planzo</h1>
                    <div style={{marginLeft: isOpen ? "50px" : "0px"}} className="bars">
                        <FaBars onClick={toggle} />
                    </div>
                </div>
                {
                    allMenuItems.map((item, index) => (
                        <NavLink 
                            to={item.path} 
                            key={index} 
                            className={({ isActive }) => `link ${isActive ? 'active' : ''}`}
                        >
                            <div className="icon">{item.icon}</div>
                            <div style={{display: isOpen ? "block" : "none"}} className="link_text">{item.name}</div>
                        </NavLink>
                    ))
                }
                
                {isAuthenticated && (
                    <div 
                        className="link" 
                        onClick={handleLogout}
                        style={{cursor: 'pointer'}}
                    >
                        <div className="icon"><FaSignOutAlt/></div>
                        <div style={{display: isOpen ? "block" : "none"}} className="link_text">Logout</div>
                    </div>
                )}
            </div>
        </div>
    )
}
