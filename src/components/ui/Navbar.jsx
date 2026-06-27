import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, LayoutDashboard, Calculator, History, BarChart3, Calendar, Menu, X } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { name: 'Home', path: '/', icon: LayoutDashboard },
        { name: 'Teams', path: '/teams', icon: Users },
        { name: 'Matches', path: '/matches', icon: Calendar },
        { name: 'Predictions', path: '/predictions', icon: Calculator },
        { name: 'Stats', path: '/standings', icon: BarChart3 },
        { name: 'Simulator', path: '/simulator', icon: Trophy },
        { name: 'Historical', path: '/simulator/historical', icon: History },
    ];

    return (
        <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <Trophy className="w-8 h-8 text-green-500" />
                            <span className="text-white font-black text-xl tracking-tighter">WC 2026</span>
                        </Link>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="flex items-baseline space-x-4">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'text-green-500 bg-green-500/10'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hamburger Button (Mobile) */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none border-none bg-transparent cursor-pointer"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-800 bg-gray-950">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-bold transition-colors ${isActive
                                        ? 'text-green-500 bg-green-500/10'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
