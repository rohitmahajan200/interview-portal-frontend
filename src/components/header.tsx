import React from 'react'

const Header = () => {
  return (
<header className="w-full bg-[#F9FAFB] px-4">
  <div className="flex items-center space-x-3">
    <img
      src="https://www.change-networks.com/logo.png"
      alt="Company Logo"
      className="w-10 h-10 object-contain"
    />
    <span className="text-lg font-semibold text-gray-800">
      Welcome To Change Networks!
    </span>
  </div>
</header>
  )
}

export default Header