import React from "react";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1c1b2f] via-[#3b1f1b] to-[#8b3a18] text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Disclaimer
          </h1>

          <p className="text-xl text-gray-200">
            Please read this Disclaimer carefully before using AdWall India.
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

          <Section title="Disclaimer">
            <p>
              Welcome to <strong>AdWall India</strong> ("AdWall India", "we",
              "our", or "us").
            </p>

            <p className="mt-4">
              This Disclaimer applies to the AdWall India website, mobile
              application and all related services. By using our Platform, you
              acknowledge that you have read, understood and agreed to this
              Disclaimer.
            </p>
          </Section>

          <Section title="1. Platform Nature">

            <p>
              AdWall India is an online marketplace connecting:
            </p>

            <List
              items={[
                "Advertisers",
                "Property Owners",
                "Media Owners",
                "Advertising Agencies",
              ]}
            />

            <p className="mt-6 font-semibold">
              Supported Outdoor Advertising Media
            </p>

            <List
              items={[
                "Hoardings",
                "Billboards",
                "LED Screens",
                "Wall Paintings",
                "Bus Branding",
                "Auto Branding",
                "Metro Advertising",
                "Railway Advertising",
                "Airport Advertising",
                "Mall Branding",
                "Transit Advertising",
                "Retail Branding",
                "Digital Displays",
                "Other Outdoor Media",
              ]}
            />

            <div className="bg-blue-50 border rounded-xl p-4 mt-5">
              AdWall India is a technology platform and does not own or control
              every advertising location listed on the Platform unless
              expressly stated.
            </div>

          </Section>

          <Section title="2. Information Accuracy">

            <p>
              While we strive to keep information accurate and updated, we do
              not guarantee the completeness, reliability or accuracy of:
            </p>

            <List
              items={[
                "Property Listings",
                "Pricing",
                "Availability",
                "Images",
                "Dimensions",
                "Campaign Performance",
                "Business Information",
                "User Content",
              ]}
            />

            <div className="bg-yellow-50 border rounded-xl p-4 mt-5">
              Users should independently verify all information before making
              business decisions.
            </div>

          </Section>

          <Section title="3. Property Listings">

            <p>Property owners are solely responsible for:</p>

            <List
              items={[
                "Ownership of listed properties",
                "Legal authority to list properties",
                "Pricing",
                "Availability",
                "Property Images",
                "Measurements",
                "Required Government Permissions",
                "Compliance with applicable laws",
              ]}
            />

          </Section>

          <Section title="4. Advertisements">

            <p>Advertisers are responsible for all advertisement content.</p>

            <List
              items={[
                "Images",
                "Videos",
                "Logos",
                "Brand Claims",
                "Product Information",
                "Promotional Messages",
                "Copyright Permissions",
                "Government Approvals",
              ]}
            />

            <p className="mt-4">
              AdWall India may reject, suspend or remove advertisements that
              violate laws or Platform policies.
            </p>

          </Section>

          <Section title="5. No Advertising Performance Guarantee">

            <p>
              AdWall India does not guarantee:
            </p>

            <List
              items={[
                "Sales",
                "Leads",
                "Customer Growth",
                "Brand Awareness",
                "Campaign Performance",
                "Return on Investment (ROI)",
              ]}
            />

            <div className="bg-red-50 border rounded-xl p-4 mt-5">
              Advertising results depend on factors such as location, audience,
              timing, market conditions and creative quality.
            </div>

          </Section>

          <Section title="6. Third-Party Services">

            <List
              items={[
                "Google Maps",
                "Google Play Services",
                "Firebase",
                "Payment Gateways",
                "SMS Providers",
                "Cloud Hosting",
                "Analytics Providers",
              ]}
            />

            <p className="mt-4">
              These services operate independently under their own terms and
              privacy policies.
            </p>

          </Section>

          <Section title="7. Payments">

            <p>
              Payments are processed through secure third-party providers.
            </p>

            <List
              items={[
                "Banking Delays",
                "Payment Gateway Failures",
                "UPI Issues",
                "Card Network Failures",
                "Bank Processing Delays",
              ]}
            />

          </Section>

          <Section title="8. User Responsibility">

            <List
              items={[
                "Provide accurate information",
                "Protect account credentials",
                "Maintain password confidentiality",
                "Comply with applicable laws",
                "Use the Platform responsibly",
              ]}
            />

            <p className="mt-4">
              Activities performed through your account remain your
              responsibility.
            </p>

          </Section>

          <Section title="9. Intellectual Property">

            <p>
              All trademarks, logos, graphics, software, text and content are
              protected by applicable intellectual property laws.
            </p>

            <p className="mt-4">
              No content may be copied, reproduced or commercially exploited
              without written permission from AdWall India.
            </p>

          </Section>

          <Section title="10. Limitation of Liability">

            <List
              items={[
                "Business Losses",
                "Loss of Profits",
                "Advertising Losses",
                "Data Loss",
                "Service Interruptions",
                "Technical Failures",
                "Network Issues",
                "User Disputes",
                "Third-Party Actions",
                "Indirect or Consequential Damages",
              ]}
            />

            <div className="bg-red-50 border rounded-xl p-4 mt-5">
              Your use of the Platform is entirely at your own risk.
            </div>

          </Section>

          <Section title="11. External Links">

            <p>
              Our Platform may contain links to third-party websites.
            </p>

            <p className="mt-4">
              AdWall India does not endorse or control these websites and is
              not responsible for their content, privacy practices or services.
            </p>

          </Section>

          <Section title="12. Changes to This Disclaimer">

            <p>
              We may update or modify this Disclaimer at any time without prior
              notice.
            </p>

            <p className="mt-4">
              Continued use of the Platform constitutes acceptance of the
              updated Disclaimer.
            </p>

          </Section>

          <Section title="13. Contact Us">

            <div className="bg-orange-50 border rounded-xl p-6">

              <p className="font-bold text-lg">
                AdWall India
              </p>

              <p className="mt-4">
                📧 contact@adwallindia.com
              </p>

              <p>
                🌐 https://www.adwallindia.com
              </p>

            </div>

          </Section>

          <Section title="14. Governing Law">

            <p>
              This Disclaimer shall be governed by and interpreted according to
              the laws of India.
            </p>

            <p className="mt-4">
              Any disputes shall be subject to the jurisdiction of the
              competent courts in <strong>Gaya, Bihar, India</strong>.
            </p>

          </Section>

          <Section title="Final Note">

            <div className="bg-green-50 border rounded-xl p-5">

              <p>
                By accessing or using the <strong>AdWall India</strong> website
                or mobile application, you acknowledge that you have read,
                understood and agreed to this Disclaimer.
              </p>

            </div>

          </Section>

          {/* Footer */}

          <div className="border-t pt-8 mt-12 text-center text-gray-500">

            <p>
              <strong>Last Updated:</strong> 01 August 2026
            </p>

            <p className="mt-3">
              © 2026 AdWall India. All Rights Reserved.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-12">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">
      {title}
    </h2>

    <div className="space-y-4 text-gray-700 leading-8">
      {children}
    </div>
  </div>
);

const List = ({ items }) => (
  <ul className="list-disc ml-6 space-y-2">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export default Disclaimer;