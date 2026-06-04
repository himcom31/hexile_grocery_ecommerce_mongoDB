import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, ShoppingCart, Box, ShoppingBag,
  Layers, FileText, Tag, Zap, Megaphone,
  Ticket, ChevronDown, Maximize, User, Home,
  Bell, Newspaper, BarChart3, Store, Crown,
  Gift, Truck, Users, UserCog, PackageSearch, Briefcase,MessageSquare,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const isAnyActive = (paths) => paths.some((p) => location.pathname === p);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="w-[280px] h-screen bg-white border-r border-gray-100 flex flex-col overflow-y-auto custom-scrollbar">

      {/* Logo */}
      <div className="p-6 flex justify-center border-b border-gray-50">
        <img src="/logo.png" alt="Logo" className="h-16" />
      </div>

      <div className="flex-1 px-4 py-4 space-y-1">

        {/* Overview */}
        <Link to="/admin/dash">
          <div className={`rounded-xl p-3 flex items-center gap-3 cursor-pointer font-bold mb-4 transition-all
            ${isActive('/admin/dashboard')
              ? 'bg-[#D1F2D8] text-[#00B14F]'
              : 'text-[#64748B] hover:bg-gray-50'}`}>
            <LayoutGrid size={22} strokeWidth={2.5} />
            <span>Overview</span>
          </div>
        </Link>

        {/* ONLINE ORDERS */}
        <SectionHeader title="ONLINE ORDERS" />
        <NavItem
          to="/admin/Order-list"
          icon={<ShoppingCart size={20} />}
          label="Orders"
          active={isActive('/admin/Order-list')}
        />

        {/* PRODUCT MANAGEMENT */}
        <SectionHeader title="PRODUCT MANAGEMENT" />
        <DropdownNavItem
          icon={<Box size={20} />}
          label="Product Management"
          defaultOpen={isAnyActive([
            '/admin/productLis',
            '/admin/products/add',
            '/admin/products/my',
            '/admin/products/requests/new',
            '/admin/products/requests/update',
            '/admin/products/trash',
          ])}
          items={[
            { label: 'List Of Products', path: '/admin/productList' },
            { label: 'Add Product', path: '/admin/addProducts' },
          ]}
          isActive={isActive}
        />
        <NavItem
          to="/admin/category"
          icon={<Layers size={20} />}
          label="Categories"
          active={isActive('/admin/categories')}
        />






        <NavItem
          to="/admin/brandpage"
          icon={<Tag size={20} />}
          label="Brands"
          active={isActive('/admin/brands')}
        />


        {/* SALE MANAGEMENT */}
        <SectionHeader title="SALE MANAGEMENT" />
        <DropdownNavItem
          icon={<Zap size={20} />}
          label="Flash Sales"
          defaultOpen={isAnyActive([
            '/admin/productLis',
            '/admin/addFlashk'
          ])}
          items={[
            { label: 'List Of Flash-Sales', path: '/admin/viewflash' },
            { label: 'Add Flash-Sales', path: '/admin/addFlash' },
          ]}
          isActive={isActive}
        />

        <DropdownNavItem
          icon={<Megaphone size={20} />}
          label="Ads"
          defaultOpen={isAnyActive([
            '/admin/productLis',
            '/admin/addFlashk'
          ])}
          items={[
            { label: 'List Of Ads', path: '/admin/adlist' },
            { label: 'Add Ads', path: '/admin/addad' },
          ]}
          isActive={isActive}
        />

        <DropdownNavItem
          icon={<Ticket size={20} />}
          label="Coupan"
          defaultOpen={isAnyActive([
            '/admin/productLis',
            '/admin/addFlashk'
          ])}
          items={[
            { label: 'List Of Coupan', path: '/admin/coupanlist' },
            { label: 'Add Coupan', path: '/admin/Addcoupan' },
          ]}
          isActive={isActive}
        />


        <NavItem
          to="/admin/pusernotication"
          icon={<Bell size={20} />}
          label="Push Notification"
          active={isActive('/pusernotication')}
        />

        <DropdownNavItem
          icon={<Newspaper size={20} />}
          label="Blogs"
          defaultOpen={isAnyActive([
            '/admin/productLis',
            '/admin/addFlashk'
          ])}
          items={[
            { label: 'List Of Blogs', path: '/admin/listBlog' },
            { label: 'Add Blogs', path: '/admin/addBlogs' },
          ]}
          isActive={isActive}
        />
        <NavItem
          to="/admin/reports"
          icon={<BarChart3 size={20} />}
          label="Report"
          active={isActive('/admin/reports')}
          hasDropdown
          giftIcon
        />
        {/* Messages */}
        <SectionHeader title="Messages" />
        <NavItem
          to="/admin/support-tickets"
          icon={<MessageSquare size={20} />}
          label="Customer Query"
          active={isActive('/admin/support-tickets')}

        />



        {/* USER MANAGEMENT */}

        <SectionHeader title="USER MANAGEMENT" />

        <DropdownNavItem
          icon={<Truck size={20} />}
          label="Delivery Agent"
          defaultOpen={isAnyActive([
            '/admin/productLis',
            '/admin/addFlashk'
          ])}
          items={[
            { label: 'Delivery Agent', path: '/admin/allDriver' },
            { label: 'Add Deliver Agent', path: '/admin/addDriver' },
          ]}
          isActive={isActive}
        />
        <NavItem
          to="/admin/customers"
          icon={<Users size={20} />}
          label="Customers"
          active={isActive('/admin/customers')}
          hasDropdown
        />

        <SectionHeader title="Settings" />
        <NavItem
          to="/admin/ticket_issue"
          icon={<Users size={20} />}
          label="Ticket Issue Type"
          active={isActive('/admin/ticket_issue')}

        />

        <DropdownNavItem
          icon={<Briefcase size={20} />}
          label="Business Settings"

          items={[
            { label: 'Vat & taxes', path: '/admin/texs' },
            { label: 'Delivery Charge', path: '/admin/deliveryCharge' }            //delivery-charge
          ]}
          isActive={isActive}
        />

        <DropdownNavItem
          icon={<Briefcase size={20} />}
          label="Configure Dependence"

          items={[
            { label: 'Payment Gateway', path: '/admin/paymentgateway' },
            { label: 'SMS Gateway', path: '/admin/smsSetting' },
            { label: 'Social Auth', path: '/admin/socialAuth' },
            { label: 'Pusher Setup', path: '/admin/pusher' },
            { label: 'Mail Config', path: '/admin/mailConfig' },
            { label: 'Firebase Notification', path: '/admin/firebase' },





          ]}
          isActive={isActive}
        />


        {/* Logout */}
        <div className="pt-4 mt-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all group"
          >
            <LogOut size={20} className="text-[#243746] group-hover:text-red-500 transition-colors" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 p-4 flex justify-between items-center bg-white sticky bottom-0 z-20">
        <Maximize size={20} className="text-[#243746] cursor-pointer hover:text-[#00B14F]" />
        <User size={20} className="text-[#243746] cursor-pointer hover:text-[#00B14F]" />
        <Home size={20} className="text-[#243746] cursor-pointer hover:text-[#00B14F]" />
        <span className="text-gray-400 text-[10px] font-bold tracking-tighter">v1.0.0</span>
      </div>
    </div>
  );
};

/* ── Helper Components ── */

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-2 mt-6 mb-2 px-2">
    <span className="text-[9px] font-black text-gray-400 tracking-widest whitespace-nowrap uppercase">{title}</span>
    <div className="h-[1px] w-full bg-gray-100" />
  </div>
);

// NavItem — uses Link + active highlight
const NavItem = ({ to, icon, label, active, hasDropdown, giftIcon }) => (
  <Link to={to}>
    <div className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group
      ${active ? 'bg-[#D1F2D8] text-[#00B14F]' : 'text-[#64748B] hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <span className={`transition-colors ${active ? 'text-[#00B14F]' : 'text-[#243746] group-hover:text-[#00B14F]'}`}>
          {icon}
        </span>
        <span className={`text-sm font-semibold ${active ? 'text-[#00B14F]' : 'group-hover:text-[#243746]'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {giftIcon && <Gift size={16} className="text-[#243746]/70" />}
        {hasDropdown && (
          <ChevronDown size={16} className={active ? 'text-[#00B14F]' : 'text-gray-400 group-hover:text-[#243746]'} />
        )}
      </div>
    </div>
  </Link>
);

// DropdownNavItem — uses Link per sub-item + active highlight per item
const DropdownNavItem = ({ icon, label, items, isActive, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const parentActive = items.some((item) => isActive(item.path));

  return (
    <div>
      <div
        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group
          ${parentActive || open ? 'bg-[#D1F2D8] text-[#00B14F]' : 'text-[#64748B] hover:bg-gray-50'}`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className={parentActive || open ? 'text-[#00B14F]' : 'text-[#243746] group-hover:text-[#00B14F]'}>
            {icon}
          </span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? 'rotate-180 text-[#00B14F]' : 'text-gray-400'}`}
        />
      </div>

      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-[#D1F2D8] pl-3">
          {items.map((item) => (
            <Link key={item.path} to={item.path}>
              <div className={`text-sm rounded-lg px-3 py-2 cursor-pointer transition-all font-medium
                ${isActive(item.path)
                  ? 'text-[#00B14F] bg-[#F0FBF4] font-semibold'
                  : 'text-[#64748B] hover:text-[#00B14F] hover:bg-[#F0FBF4]'}`}>
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;