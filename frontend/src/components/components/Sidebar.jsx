import React, { useState } from 'react'
import { FaBars } from "react-icons/fa"
import {
    FaCommentAlt,
    FaRegChartBar,
    FaTh,
    FaThList,
    FaUserAlt,
} from "react-icons/fa"
import { MdEvent } from 'react-icons/md';
import { NavLink } from 'react-router-dom'

export default function Sidebar({children}) {

    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    const menuItems = [
        {
            path:"/",
            name:"dashboard",
            icon:<FaTh/>
        },
        {
            path:"/about",
            name:"About",
            icon:<FaUserAlt/>
        },
        {
            path:"/analytics",
            name:"Analytics",
            icon:<FaRegChartBar/>
        },
        {
            path:"/comment",
            name:"Comment",
            icon:<FaCommentAlt/>
        },
        {
            path:"/product",
            name:"Events",
            icon:<MdEvent/>
        },
        {
            path:"/productList",
            name:"ProductList",
            icon:<FaThList/>
        }
    ]

    return (
        <div className='container'>
            <div style={{width: isOpen ? "250px" : "50px"}} className="sidebar">
                <div className="top_section">
                    <h1 style={{display: isOpen ? "block" : "none"}} className='logo'>Logo</h1>
                    <div style={{marginLeft: isOpen ? "50px" : "0px"}} className="bars">
                        <FaBars onClick={toggle} />
                    </div>
                </div>
                {
                    menuItems.map((item, index) => (
                        <NavLink to={item.path} key={index} className="link" activeClassName="active">
                            <div className="icon">{item.icon}</div>
                            <div style={{display: isOpen ? "block" : "none"}} className="link_text">{item.name}</div>
                        </NavLink>
                    ))
                }
            </div>
            <main>{children}</main>
        </div>
    )
}
