import { Link } from "react-router-dom";
import {
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";

const Footer = () => {
  const socialLinks = [
    {
      icon: Linkedin,
      url: "https://www.linkedin.com/company/adwallindia",
      label: "LinkedIn",
    },
    {
      icon: Instagram,
      url: "https://www.instagram.com/adwallindia_official/",
      label: "Instagram",
    },
    {
      icon: Facebook,
      url: "https://www.facebook.com/profile.php?id=61592024391188",
      label: "Facebook",
    },
    {
      icon: Twitter,
      url: "https://x.com/adwallindia",
      label: "Twitter",
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">AW</span>
            </div>

            <span className="text-white font-bold text-xl">
              AdWall India
            </span>
          </div>

          <p className="text-sm text-gray-400 mb-5">
            India ka sabse bada Outdoor Advertising Marketplace.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map(({ icon: Icon, url, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold mb-4">
            Company
          </h4>

          <div className="space-y-2">
            <Link
              to="/about"
              className="block text-sm hover:text-brand-400 transition"
            >
              About
            </Link>

            <Link
              to="/blog"
              className="block text-sm hover:text-brand-400 transition"
            >
              Blog
            </Link>

            <Link
              to="/careers"
              className="block text-sm hover:text-brand-400 transition"
            >
              Careers
            </Link>

            <Link
              to="/contact"
              className="block text-sm hover:text-brand-400 transition"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Advertisers */}
        <div>
          <h4 className="text-white font-semibold mb-4">
            For Advertisers
          </h4>

          <div className="space-y-2">
            <Link
              to="/search"
              className="block text-sm hover:text-brand-400 transition"
            >
              Search Hoardings
            </Link>

            <Link
              to="/search"
              className="block text-sm hover:text-brand-400 transition"
            >
              Broadcast Campaign
            </Link>

            <Link
              to="/search"
              className="block text-sm hover:text-brand-400 transition"
            >
              AI Media Planner
            </Link>

            <Link
              to="/pricing"
              className="block text-sm hover:text-brand-400 transition"
            >
              Pricing
            </Link>
          </div>
        </div>

        {/* Owners */}
        <div>
          <h4 className="text-white font-semibold mb-4">
            For Owners
          </h4>

          <div className="space-y-2">
            <Link
              to="/register"
              className="block text-sm hover:text-brand-400 transition"
            >
              List Your Hoarding
            </Link>

            <Link
              to="/kyc"
              className="block text-sm hover:text-brand-400 transition"
            >
              KYC Verification
            </Link>

            <Link
              to="/dashboard"
              className="block text-sm hover:text-brand-400 transition"
            >
              Earnings Dashboard
            </Link>

            <Link
              to="/support"
              className="block text-sm hover:text-brand-400 transition"
            >
              Support
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-white font-semibold mb-4">
            Legal
          </h4>

          <div className="space-y-2">
            <Link
              to="/privacy-policy"
              className="block text-sm hover:text-brand-400 transition"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="block text-sm hover:text-brand-400 transition"
            >
              Terms & Conditions
            </Link>

            <Link
              to="/refund-cancellation-policy"
              className="block text-sm hover:text-brand-400 transition"
            >
              Refund & Cancellation Policy
            </Link>

            <Link
              to="/cookie-policy"
              className="block text-sm hover:text-brand-400 transition"
            >
              Cookie Policy
            </Link>

            <Link
              to="/disclaimer"
              className="block text-sm hover:text-brand-400 transition"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="text-white font-semibold">
              AdWall India
            </span>
            . All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/privacy-policy"
              className="hover:text-brand-400 transition"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="hover:text-brand-400 transition"
            >
              Terms
            </Link>

            <Link
              to="/contact"
              className="hover:text-brand-400 transition"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;