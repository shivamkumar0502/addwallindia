import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1c1b2f] via-[#3b1f1b] to-[#8b3a18] text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Privacy Policy
          </h1>

          <p className="text-xl text-gray-200">
            Your privacy is important to us. Learn how AdWall India collects,
            uses and protects your information.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 -mt-16 pb-20">

        <div className="bg-white rounded-3xl shadow-xl p-10">

          {/* Header */}
          <div className="border-b pb-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              AdWall India
            </h2>

            <p className="text-gray-500 mt-3">
              <strong>Effective Date:</strong> 01 August 2026
            </p>

            <p className="text-gray-500">
              <strong>Last Updated:</strong> 01 August 2026
            </p>
          </div>

          {/* Section */}

          <Section title="1. Introduction">
            <p>
              Welcome to <b>AdWall India</b> ("AdWall India", "we", "our", "us",
              or "Company").
            </p>

            <p className="mt-4">
              AdWall India is India's Smart Outdoor Advertising Marketplace
              connecting advertisers with property owners through our website
              and mobile application.
            </p>

            <p className="mt-4">
              By using our Platform, you agree to this Privacy Policy.
            </p>
          </Section>

          <Section title="2. Scope">
            <ul className="list-disc ml-6 space-y-2">
              <li>AdWall India Website</li>
              <li>Android Application</li>
              <li>Future iOS Application</li>
              <li>Advertiser Dashboard</li>
              <li>Property Owner Dashboard</li>
              <li>Customer Support</li>
              <li>Marketing Communications</li>
              <li>APIs & Connected Services</li>
            </ul>
          </Section>

          <Section title="3. Information We Collect">

            <SubHeading text="Personal Information" />

            <List
              items={[
                "Full Name",
                "Mobile Number",
                "Email Address",
                "Encrypted Password",
                "Profile Photo",
                "Date of Birth (if required)",
                "Gender (optional)",
              ]}
            />

            <SubHeading text="Business Information" />

            <List
              items={[
                "Company Name",
                "GST Number",
                "PAN Number",
                "Business Address",
                "Website",
                "Brand Details",
              ]}
            />

            <SubHeading text="Property Owner Information" />

            <List
              items={[
                "Property Address",
                "GPS Location",
                "City",
                "State",
                "PIN Code",
                "Property Images",
                "Videos",
                "Space Dimensions",
                "Rental Price",
                "Availability",
              ]}
            />

            <SubHeading text="Identity Verification (KYC)" />

            <List
              items={[
                "Aadhaar (where legally permitted)",
                "PAN Card",
                "Driving License",
                "Passport",
                "Voter ID",
                "Selfie Verification",
                "Business Registration Documents",
              ]}
            />

            <SubHeading text="Payment Information" />

            <List
              items={[
                "UPI ID",
                "Bank Account Details",
                "Transaction ID",
                "GST Details",
              ]}
            />

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-5">
              <h4 className="font-semibold text-green-700 mb-2">
                We DO NOT Store
              </h4>

              <ul className="list-disc ml-5">
                <li>Debit Card Numbers</li>
                <li>Credit Card Numbers</li>
                <li>CVV</li>
                <li>UPI PIN</li>
                <li>Internet Banking Passwords</li>
              </ul>
            </div>
          </Section>

          <Section title="4. How We Use Your Information">

            <List
              items={[
                "Create your account",
                "Verify your identity",
                "Process KYC",
                "Display advertising spaces",
                "Connect advertisers with property owners",
                "Process bookings",
                "Send booking notifications",
                "Process payments",
                "Generate invoices",
                "Improve platform security",
                "Detect fraud",
                "Customer support",
                "Respond to legal requests",
              ]}
            />
          </Section>

          <Section title="5. Cookies & Tracking Technologies">
            <p>
              We use cookies to improve your browsing experience, keep you logged
              in, remember preferences, analyze traffic and improve security.
            </p>
          </Section>

          <Section title="6. Sharing of Information">

            <List
              items={[
                "Payment Gateway Providers",
                "Cloud Hosting Providers",
                "SMS Providers",
                "Email Providers",
                "KYC Partners",
                "Analytics Providers",
                "Government Authorities (where legally required)",
              ]}
            />

            <div className="bg-blue-50 rounded-xl p-4 mt-5 border">
              We do <strong>NOT</strong> sell your personal information to third
              parties.
            </div>
          </Section>

          <Section title="7. Data Security">
            <List
              items={[
                "SSL Encryption",
                "HTTPS",
                "Encrypted Password Storage",
                "Secure Cloud Infrastructure",
                "Access Controls",
                "Firewall Protection",
                "Regular Security Monitoring",
              ]}
            />
          </Section>

          <Section title="8. Data Retention">
            <p>
              We retain information only as long as necessary for providing
              services, resolving disputes, preventing fraud and complying with
              legal obligations.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <List
              items={[
                "Access your information",
                "Update incorrect information",
                "Request correction",
                "Delete your account",
                "Withdraw consent",
                "Download your data",
              ]}
            />
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              AdWall India is intended for users aged 18 years or above. We do
              not knowingly collect information from children.
            </p>
          </Section>

          <Section title="11. Third-Party Services">

            <List
              items={[
                "Google Maps",
                "Firebase",
                "Google Play Services",
                "Payment Gateway Providers",
                "Cloud Storage",
                "Analytics Services",
              ]}
            />
          </Section>

          <Section title="12. Changes to this Privacy Policy">
            <p>
              We may update this Privacy Policy periodically. Updates will be
              published on this page with a revised "Last Updated" date.
            </p>
          </Section>

          <Section title="13. Contact Us">

            <div className="bg-orange-50 rounded-xl p-6 border">

              <p><b>AdWall India</b></p>

              <p className="mt-3">
                🌐 https://www.adwallindia.com
              </p>

              <p>📧 contact@adwallindia.com</p>

              <p>📞 +91 8409880339</p>

              <p className="mt-3">
                Village Siyanandpur,
                <br />
                Post Tekari,
                <br />
                Gaya, Bihar – 824236,
                <br />
                India
              </p>

            </div>
          </Section>

          <Section title="14. Grievance Officer">

            <div className="bg-gray-100 rounded-xl p-6">

              <p><b>Grievance Officer</b></p>

              <p>AdWall India</p>

              <p className="mt-2">
                📧 grievance@adwallindia.com
              </p>

              <p>📍 Gaya, Bihar, India</p>

            </div>
          </Section>

          <Section title="15. Consent">
            <p>
              By using AdWall India, you acknowledge that you have read,
              understood and agreed to this Privacy Policy and consent to the
              collection, processing, storage and use of your information.
            </p>
          </Section>

        </div>

      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-12">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
    <div className="space-y-4 text-gray-700 leading-8">{children}</div>
  </div>
);

const SubHeading = ({ text }) => (
  <h3 className="text-xl font-semibold mt-8 mb-3 text-orange-600">{text}</h3>
);

const List = ({ items }) => (
  <ul className="list-disc ml-6 space-y-2">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default PrivacyPolicy;