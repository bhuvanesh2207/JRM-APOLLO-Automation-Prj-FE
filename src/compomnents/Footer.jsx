import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-16 md:h-20 bg-gray-100 border-t border-gray-300 flex items-center justify-center">
      <div className="w-full max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-700 font-medium">
        
        {/* Left */}
        <span>© {currentYear} JRM Infotech</span>
      </div>
    </footer>
  );
}

export default Footer;