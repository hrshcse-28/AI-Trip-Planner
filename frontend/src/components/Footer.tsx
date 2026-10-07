import { Plane } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Plane className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg text-slate-900 dark:text-white">AI Trip Planner</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
              Intelligent Personalized Travel Planning & India Discovery Platform. Experience authentic travel across all 28 states & 8 union territories.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Discovery</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/explore-india" className="hover:text-primary font-medium text-amber-600 dark:text-amber-400">Explore India 🇮🇳</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><Link to="/create-trip" className="hover:text-primary">Plan a Trip</Link></li>
              <li><Link to="/my-trips" className="hover:text-primary">My Trips</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">India Safety & Culture</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/explore-india" className="hover:text-primary">112 Emergency Helpdesk</Link></li>
              <li><Link to="/explore-india" className="hover:text-primary">Festivals Calendar</Link></li>
              <li><Link to="/explore-india" className="hover:text-primary">Regional Cuisine & Jain Filters</Link></li>
              <li><Link to="/explore-india" className="hover:text-primary">Hidden Gems Finder</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} AI Trip Planner — Intelligent India Travel Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
