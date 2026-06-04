import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // 1. Navigate import kiya

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 2. Navigate hook initialize kiya
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      role: "admin"
    };

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', payload);

      if (res.data.success) {
        toast.success('Admin Authenticated Successfully!');

        // Data Save karna
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(res.data.user));

        // 3. Navigate use kiya refresh ke bajaye
        setTimeout(() => {
          navigate('/admin/dashboard'); // Is URL ko apne App.js ke route se match karein
        }, 1500);
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorMsg = error.response?.data?.message || "Connection Error! Check if Backend is running.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center lg:justify-end bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop')` }}
    >
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="absolute inset-0 bg-black/40 lg:hidden transition-opacity"></div>

      <div className="bg-transparent lg:bg-white w-full h-screen lg:h-[95vh] lg:max-w-[500px] lg:mr-10 lg:rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col justify-center items-center relative z-10 text-left">
        
        <div className="w-full max-w-[420px] lg:max-w-none bg-white/20 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none rounded-3xl lg:rounded-none border border-white/30 lg:border-none p-8 lg:p-0 flex flex-col shadow-2xl lg:shadow-none">
          
          <div className="absolute top-8 left-10 right-10 hidden sm:flex justify-between items-center text-[10px] font-medium z-10">
            <p className="text-white lg:text-gray-400 italic">
              Powered by <span className="text-[#00B14F] font-bold">RazinSoft</span> ©2026
            </p>
            <span className="bg-[#FFE5EF] text-[#FF5A9E] px-2 py-1 rounded font-bold">v1.2.2</span>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#00B14F] p-4 rounded-2xl shadow-xl shadow-green-500/20 mb-4">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-white lg:text-[#243746] tracking-tighter text-center">
              Ready<span className="text-white lg:text-[#00B14F]">Grocery</span>
            </h1>
            <p className="text-white/70 lg:text-gray-400 text-sm mt-1">Authorized Personnel Only</p>
          </div>

          <h2 className="text-2xl font-bold text-white lg:text-[#1E293B] mb-8 text-center">Login To Admin</h2>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-white lg:text-gray-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@readygrocery.com"
                className="w-full px-5 py-4 border border-white/20 lg:border-gray-200 rounded-2xl outline-none transition-all bg-white/10 lg:bg-gray-50 focus:ring-4 focus:ring-[#00B14F]/10 text-white lg:text-gray-800 placeholder:text-white/40 lg:placeholder:text-gray-400"
              />
            </div>

            <div className="relative">
              <label className="block text-white lg:text-gray-600 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-5 py-4 border border-white/20 lg:border-gray-200 rounded-2xl outline-none transition-all bg-white/10 lg:bg-gray-50 focus:ring-4 focus:ring-[#00B14F]/10 text-white lg:text-gray-800 placeholder:text-white/40 lg:placeholder:text-gray-400"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-[42px] text-white/50 lg:text-gray-400 hover:text-[#00B14F]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-[#00B14F] hover:bg-[#009643] text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-green-500/20 mt-4 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;