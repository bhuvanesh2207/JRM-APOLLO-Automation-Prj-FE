import React, { useState, useEffect } from "react";

function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  return (
<footer className="mt-auto h-16 md:h-20 flex items-center justify-center text-sm text-black font-bold">
  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center">
    <span>{currentYear} © JRM Infotech</span> 
  </div>
</footer>
  );
}

export default Footer;
