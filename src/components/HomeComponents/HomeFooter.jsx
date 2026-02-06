import gamebarLogo from "../../assets/images/gamebar-logo.avif";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import ContactDeveloper from "./ContactDeveloper";
import { useDarkMode } from "../../context/DarkModeContext";

const socialIcons = [
  { 
    icon: <FaFacebook />, 
    label: "Facebook", 
    link: 'https://www.facebook.com/share/1D1YW6GQBm/' 
  },
  { 
    icon: <FaInstagram />, 
    label: "Instagram", 
    link: 'https://www.instagram.com/gamebar.in?igsh=MTIyangzYXo5MXkweQ==' 
  },
  { 
    icon: <FaTwitter />, 
    label: "Twitter", 
    link: 'https://twitter.com/gamebarofficial'  // ← Fixed empty link
  },
  { 
    icon: <FaYoutube />, 
    label: "YouTube", 
    link: 'https://youtube.com/@gamebarofficial-g?si=rjBAIqxw1imv4z2N' 
  },
];

const footerLinks = [
  "Support",
  "Terms of Service",
  "Contact us",
  "Privacy Policy",
  "About us",
  "Refund Policy",
];

function Footer() {
  const { isDarkMode } = useDarkMode();

  return (
    <footer
      className={`flex flex-col mt-10 sm:flex-row sm:gap-10 py-10 px-6 sm:items-center justify-center border-t ${
        isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
      }`}
    >
      <div>
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10 sm:mb-0">
          <div className="flex items-center sm:flex-col gap-4">
            <img
              src={gamebarLogo}
              alt="Logo"
              className="w-30 h-30 rounded object-contain"
            />
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                GAMEBAR
              </h1>
              <h2 className={`text-lg tracking-[4px] ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                OFFICIAL
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Socials */}
      <div>
        <div className="flex flex-wrap items-center justify-start gap-4 mb-8">
          <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Follow us on:
          </p>
          {socialIcons.map(({ icon, label, link }, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xl transition-colors duration-300 hover:${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
              title={label}
              aria-label={label}
            >
              {icon}
            </a>
          ))}
        </div>

        {/* Footer Links */}
        <div
          className={`flex flex-wrap sm:grid grid-cols-3 items-center justify-start gap-6 text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {footerLinks.map((link, index) => (
            <p
              key={index}
              className={`cursor-pointer transition-colors duration-300 hover:${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              {link}
            </p>
          ))}
        </div>

        <ContactDeveloper />
      </div>
    </footer>
  );
}

export default Footer;