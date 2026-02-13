import { Link } from 'react-router-dom';
import { Menu, ChevronLeft } from 'lucide-react';
import './MobileHeader.css';

export const MobileHeader = ({ projectName, onMenuClick, showBack = true, children }) => {
    return (
        <header className="mobile-header md:hidden">
            <div className="mobile-header-top">
                {showBack && (
                    <Link to="/dashboard" className="mobile-back">
                        <ChevronLeft size={24} />
                    </Link>
                )}
                <h1 className="mobile-title">{projectName}</h1>
                <button className="mobile-menu-btn" onClick={onMenuClick}>
                    <Menu size={24} />
                </button>
            </div>
            {children && <div className="mobile-header-extra">{children}</div>}
        </header>
    );
};
