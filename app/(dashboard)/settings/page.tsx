"use client";

import BottomNavigation from "../../../components/bottom-navigation";

export default function SettingsPage() {
  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors">
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Settings</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <main className="p-4 pb-24">
          {/* Profile Section */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">John Doe</h3>
                  <p className="text-sm text-gray-600">john.doe@example.com</p>
                </div>
                <button className="text-blue-600 text-sm font-medium">Edit</button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Full Name</span>
                  <span className="text-sm text-gray-900">John Doe</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Email</span>
                  <span className="text-sm text-gray-900">john.doe@example.com</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Phone</span>
                  <span className="text-sm text-gray-900">+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Preferences</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Currency</span>
                    <p className="text-xs text-gray-500">USD - US Dollar</p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Change</button>
              </div>
              
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Language</span>
                    <p className="text-xs text-gray-500">English</p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Change</button>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Time Zone</span>
                    <p className="text-xs text-gray-500">UTC-5 (Eastern Time)</p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Change</button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Notifications</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Push Notifications</span>
                    <p className="text-xs text-gray-500">Get notified about transactions</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="push-notifications" defaultChecked />
                  <label htmlFor="push-notifications" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="block bg-gray-300 w-12 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-6"></div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                    <p className="text-xs text-gray-500">Receive weekly reports</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="email-notifications" />
                  <label htmlFor="email-notifications" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="block bg-gray-300 w-12 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"></div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Budget Alerts</span>
                    <p className="text-xs text-gray-500">Warn when over budget</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="budget-alerts" defaultChecked />
                  <label htmlFor="budget-alerts" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="block bg-gray-300 w-12 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-6"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Security</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Change Password</span>
                    <p className="text-xs text-gray-500">Update your password</p>
                  </div>
                </div>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
              </button>
              
              <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Two-Factor Authentication</span>
                    <p className="text-xs text-gray-500">Add extra security</p>
                  </div>
                </div>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
              </button>
            </div>
          </section>

          {/* Account Actions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors text-red-600">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Delete Account</span>
                    <p className="text-xs text-red-500">Permanently delete your account</p>
                  </div>
                </div>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-red-400">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}