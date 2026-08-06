import React from "react";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1c1b2f] via-[#3b1f1b] to-[#8b3a18] text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Terms & Conditions
          </h1>

          <p className="text-xl text-gray-200">
            Please read these Terms & Conditions carefully before using AdWall India.
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

          <Section title="1. Acceptance of Terms">
            <p>
              Welcome to <b>AdWall India</b>. These Terms & Conditions govern your
              access to and use of our website, mobile application and related
              services.
            </p>

            <p className="mt-4">
              By accessing or using our Platform, you agree to comply with these
              Terms. If you do not agree, please do not use the Platform.
            </p>
          </Section>

          <Section title="2. About AdWall India">
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
              Outdoor Advertising Categories
            </p>

            <List
              items={[
                "Hoardings",
                "Billboards",
                "LED Screens",
                "Wall Paintings",
                "Transit Advertising",
                "Bus Branding",
                "Auto Branding",
                "Metro Advertising",
                "Railway Advertising",
                "Airport Advertising",
                "Mall Branding",
                "Digital Displays",
                "Other Outdoor Media",
              ]}
            />

            <div className="bg-blue-50 border rounded-xl p-4 mt-5">
              AdWall India acts as a technology platform and does not own every
              advertising space listed on the Platform.
            </div>
          </Section>

          <Section title="3. Eligibility">
            <List
              items={[
                "Be at least 18 years old",
                "Be legally capable of entering into a binding contract",
                "Provide accurate registration information",
                "Comply with applicable laws",
              ]}
            />
          </Section>

          <Section title="4. User Account">
            <p>To access certain features, users must create an account.</p>

            <List
              items={[
                "Provide accurate information",
                "Keep login credentials confidential",
                "Notify unauthorized account access",
                "Be responsible for account activities",
              ]}
            />

            <p className="mt-4">
              AdWall India may suspend or terminate accounts violating these Terms.
            </p>
          </Section>

          <Section title="5. KYC Verification">

            <p>Certain services may require Know Your Customer (KYC).</p>

            <List
              items={[
                "Aadhaar (where legally permitted)",
                "PAN Card",
                "Passport",
                "Driving License",
                "Voter ID",
                "Business Registration Documents",
              ]}
            />
          </Section>

          <Section title="6. Property Listings">

            <List
              items={[
                "Legal ownership of property",
                "Accurate listing information",
                "Updated property images",
                "Correct pricing",
                "Availability updates",
              ]}
            />

            <p className="mt-4">
              AdWall India may remove listings violating these Terms.
            </p>
          </Section>

          <Section title="7. Advertising Bookings">

            <List
              items={[
                "Lawful advertisement content",
                "Respect intellectual property rights",
                "Follow advertising regulations",
                "Complete payment obligations",
              ]}
            />

            <p className="mt-4">
              Booking requests are subject to verification and availability.
            </p>
          </Section>

          <Section title="8. Prohibited Content">

            <List
              items={[
                "Illegal content",
                "Hate speech",
                "Violence or terrorism",
                "Defamatory material",
                "Adult content",
                "Illegal products",
                "Copyright infringement",
                "Malware or harmful software",
              ]}
            />
          </Section>

          <Section title="9. Payments">
            <p>
              Payments are processed through secure third-party payment providers.
            </p>

            <List
              items={[
                "Pay applicable charges",
                "Provide accurate payment details",
                "Authorize payment processing",
              ]}
            />
          </Section>

          <Section title="10. Cancellation">
            <p>
              Cancellation policies depend on the booking type. Refunds and
              cancellation charges are governed by our Refund & Cancellation
              Policy.
            </p>
          </Section>

          <Section title="11. Intellectual Property">

            <List
              items={[
                "Logo",
                "Software",
                "Graphics",
                "Design",
                "Text",
                "Source Code",
                "Databases",
                "Platform Features",
              ]}
            />

            <p className="mt-4">
              Users may not reproduce or distribute Platform content without
              written permission.
            </p>
          </Section>

          <Section title="12. User Responsibilities">

            <List
              items={[
                "No fake accounts",
                "No impersonation",
                "No false property information",
                "No misuse of services",
                "No unauthorized access",
                "No automated bots without permission",
              ]}
            />
          </Section>

          <Section title="13. Suspension & Termination">

            <List
              items={[
                "Violation of Terms",
                "False information",
                "Fraudulent activity",
                "Platform misuse",
                "Violation of laws",
              ]}
            />
          </Section>

          <Section title="14. Limitation of Liability">

            <List
              items={[
                "Business losses",
                "Loss of profits",
                "Advertising losses",
                "Technical interruptions",
                "Third-party delays",
                "Unauthorized account access",
              ]}
            />
          </Section>

          <Section title="15. Indemnification">
            <p>
              Users agree to indemnify and hold harmless AdWall India, its
              employees, affiliates and partners against claims arising from use
              of the Platform or violation of these Terms.
            </p>
          </Section>

          <Section title="16. Third-Party Services">

            <List
              items={[
                "Payment Providers",
                "Google Maps",
                "Firebase",
                "SMS Services",
                "Email Providers",
                "Cloud Hosting",
              ]}
            />
          </Section>

          <Section title="17. Privacy">
            <p>
              Your use of AdWall India is also governed by our Privacy Policy.
            </p>
          </Section>

          <Section title="18. Changes to Terms">
            <p>
              We may revise these Terms from time to time. Continued use of the
              Platform indicates acceptance of updated Terms.
            </p>
          </Section>

          <Section title="19. Governing Law">
            <p>
              These Terms are governed by the laws of India. Disputes shall be
              subject to the jurisdiction of the competent courts located in
              Gaya, Bihar.
            </p>
          </Section>

          <Section title="20. Contact Us">

            <div className="bg-orange-50 border rounded-xl p-6">

              <p><strong>AdWall India</strong></p>

              <p className="mt-3">🌐 https://www.adwallindia.com</p>

              <p>📧 contact@adwallindia.com</p>

              <p>📞 +91 8409880339</p>

              <p className="mt-3">
                Village Siyanandpur<br />
                Post Tekari<br />
                Gaya, Bihar – 824236<br />
                India
              </p>

            </div>

          </Section>

          <Section title="21. Grievance Officer">

            <div className="bg-gray-100 rounded-xl p-6">

              <p><strong>Grievance Officer</strong></p>

              <p>AdWall India</p>

              <p className="mt-2">📧 grievance@adwallindia.com</p>

              <p>📍 Gaya, Bihar – 824236, India</p>

            </div>

          </Section>

          <Section title="22. Entire Agreement">
            <p>
              These Terms & Conditions, together with the Privacy Policy and any
              additional policies published on the Platform, constitute the
              entire agreement between you and AdWall India regarding your use of
              the Platform.
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

const List = ({ items }) => (
  <ul className="list-disc ml-6 space-y-2">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export default TermsConditions;