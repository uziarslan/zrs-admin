import React, { useState, useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import Flash from "./Flash";

export default function Login() {
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({});
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const v = e.target.value;
    setFormData((prev) => ({ ...prev, username: v }));
    setIsEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage({});
    if (!formData.password) return setMessage({ error: "Password is required" });

    try {
      const { status } = await login(formData);
      if (status === 201) navigate("/");
    } catch (error) {
      if (error.response?.data?.error) setMessage(error.response.data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Flash message={message} />

      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary-700 relative overflow-hidden">
        {/* Layered gradients */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 0% 0%, #bd925c 0%, transparent 50%), radial-gradient(circle at 100% 100%, #295860 0%, transparent 50%)",
          }}
        />
        {/* Dotted pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        {/* Top corner — Z monogram large watermark */}
        <div className="absolute -top-10 -right-16 text-[24rem] font-black text-white/[0.04] leading-none select-none pointer-events-none">
          Z
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-accent">
              Z
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight leading-none">ZRS Trading</h2>
              <p className="text-[10px] text-primary-200/80 mt-1.5 tracking-[0.25em] uppercase">
                Premium Cars · Dubai
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-600/20 border border-accent-500/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              <p className="text-[11px] font-semibold text-accent-200 tracking-[0.2em] uppercase">
                Admin Portal
              </p>
            </div>

            <h1 className="text-4xl xl:text-6xl font-bold leading-[1.05] tracking-tight">
              Steward the<br />
              <span className="text-accent-400">finest</span> garage<br />
              in the region.
            </h1>

            <p className="text-primary-100/90 text-base xl:text-lg max-w-md leading-relaxed">
              Manage inventory, customer leads, and editorial content from one elegant command center.
            </p>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-md">
              <div>
                <p className="text-3xl font-bold text-accent-400 tracking-tight">500+</p>
                <p className="text-[10px] text-primary-200/70 uppercase tracking-[0.2em] mt-1.5">
                  Vehicles
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent-400 tracking-tight">15+</p>
                <p className="text-[10px] text-primary-200/70 uppercase tracking-[0.2em] mt-1.5">
                  Years
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent-400 tracking-tight">4.9★</p>
                <p className="text-[10px] text-primary-200/70 uppercase tracking-[0.2em] mt-1.5">
                  Rating
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-primary-200/60 tracking-wider">
            <p>© {new Date().getFullYear()} ZRS Car Trading. All rights reserved.</p>
            <p className="hidden xl:block">Dubai Investment Park-1, UAE</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black">
              Z
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none text-gray-900">ZRS Trading</h2>
              <p className="text-[10px] text-gray-500 mt-1 tracking-[0.25em] uppercase">Admin Portal</p>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-xs font-semibold text-accent-700 tracking-[0.25em] uppercase mb-3">
              Sign In
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Welcome back.
            </h1>
            <p className="text-gray-500 text-base">
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-[0.15em] mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="admin@zrscarstrading.com"
                  value={formData.username}
                  onChange={handleEmailChange}
                  className="input-base !py-3.5 pr-10"
                  autoComplete="username"
                />
                {isEmailValid && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-[0.15em]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-base !py-3.5"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={!isEmailValid || !formData.password}
              className="w-full btn btn-primary !py-3.5 !text-base disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              <span>Sign In</span>
              <span className="ml-1">→</span>
            </button>
          </form>

          <div className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 tracking-wider">
              Authorized personnel only · All actions are logged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
