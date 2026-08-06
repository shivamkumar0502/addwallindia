import React from "react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1c1b2f] via-[#3b1f1b] to-[#8b3a18] text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Cookie Policy
          </h1>

          <p className="text-xl text-gray-200">
            Learn how AdWall India uses cookies and similar technologies to improve your experience.
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

          <Section title="1. Introduction">
            <p>
              Welcome to <strong>AdWall India</strong> ("AdWall India", "we",
              "our", or "us").
            </p>

            <p className="mt-4">
              This Cookie Policy explains how we use cookies and similar
              technologies when you use our website or mobile application.
            </p>

            <p className="mt-4">
              By using our Platform, you consent to the use of cookies as
              described in this Policy.
            </p>
          </Section>

          <Section title="2. What Are Cookies?">
            <p>
              Cookies are small text files stored on your computer, smartphone,
              tablet or other device when you visit a website.
            </p>

            <p className="mt-4">
              Cookies help remember your preferences, improve performance,
              enhance security and provide a better user experience.
            </p>
          </Section>

          <Section title="3. Why We Use Cookies">

            <List
              items={[
                "Keep you logged into your account",
                "Remember your preferences",
                "Improve website speed and performance",
                "Analyze website traffic",
                "Personalize your browsing experience",
                "Detect suspicious activity",
                "Enhance security",
                "Improve our products and services",
              ]}
            />

          </Section>

          <Section title="4. Types of Cookies We Use">

            <SubHeading title="Essential Cookies" />

            <p>
              These cookies are required for the Platform to function properly.
            </p>

            <List
              items={[
                "User Login",
                "Authentication",
                "Session Management",
                "Security",
              ]}
            />

            <div className="bg-yellow-50 border rounded-xl p-4 mt-5">
              Without these cookies, some Platform features may not work
              correctly.
            </div>

            <SubHeading title="Performance Cookies" />

            <List
              items={[
                "Pages Visited",
                "Time Spent",
                "Navigation Patterns",
                "Website Performance",
              ]}
            />

            <SubHeading title="Functional Cookies" />

            <List
              items={[
                "Language",
                "Location",
                "Display Settings",
                "Login Preferences",
              ]}
            />

            <SubHeading title="Analytics Cookies" />

            <List
              items={[
                "Website Traffic",
                "User Engagement",
                "Device Information",
                "Browser Information",
                "Popular Pages",
              ]}
            />

            <SubHeading title="Advertising Cookies" />

            <List
              items={[
                "Campaign Performance",
                "Relevant Advertisements",
                "Limit Repetitive Ads",
                "Marketing Analytics",
              ]}
            />

          </Section>

          <Section title="5. Third-Party Cookies">

            <p>
              Some third-party services integrated with AdWall India may also
              place cookies on your device.
            </p>

            <List
              items={[
                "Google Analytics",
                "Google Maps",
                "Firebase",
                "Payment Gateway Providers",
                "Cloud Hosting Services",
                "Customer Support Tools",
              ]}
            />

          </Section>

          <Section title="6. Managing Cookies">

            <p>
              You can manage cookies through your browser settings.
            </p>

            <List
              items={[
                "View Stored Cookies",
                "Delete Cookies",
                "Block Cookies",
                "Restrict Third-Party Cookies",
              ]}
            />

            <div className="bg-red-50 border rounded-xl p-4 mt-5">
              Disabling cookies may affect certain features and functionality of
              the Platform.
            </div>

          </Section>

          <Section title="7. Mobile Applications">

            <p>
              Our mobile application may use technologies similar to cookies.
            </p>

            <List
              items={[
                "Device Identifiers",
                "Local Storage",
                "App Preferences",
                "Firebase Tokens",
                "Push Notification Tokens",
              ]}
            />

          </Section>

          <Section title="8. Data Collected Through Cookies">

            <List
              items={[
                "IP Address",
                "Browser Type",
                "Device Information",
                "Operating System",
                "Language Preferences",
                "Screen Resolution",
                "Date & Time",
                "Referring Website",
                "Pages Visited",
                "Click Activity",
              ]}
            />

            <div className="bg-green-50 border rounded-xl p-4 mt-5">
              <strong>Cookies do NOT collect:</strong>

              <ul className="list-disc ml-6 mt-3">
                <li>Passwords</li>
                <li>Debit/Credit Card Details</li>
                <li>UPI PIN</li>
              </ul>
            </div>

          </Section>

          <Section title="9. Cookie Retention">

            <p>
              Some cookies are deleted automatically when you close your browser
              (Session Cookies).
            </p>

            <p className="mt-4">
              Others remain until they expire or are manually deleted
              (Persistent Cookies).
            </p>

          </Section>

          <Section title="10. Updates to This Cookie Policy">

            <p>
              We may update this Cookie Policy from time to time. Changes become
              effective immediately after publication.
            </p>

            <p className="mt-4">
              We encourage users to review this page periodically.
            </p>

          </Section>

          <Section title="11. Your Consent">

            <p>
              By continuing to use AdWall India, you acknowledge that you have
              read and understood this Cookie Policy and consent to the use of
              cookies described herein.
            </p>

          </Section>

          <Section title="12. Contact Us">

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

          {/* Footer */}

          <div className="border-t pt-8 mt-10 text-center text-gray-500">

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

const SubHeading = ({ title }) => (
  <h3 className="text-xl font-semibold text-orange-600 mt-8 mb-3">
    {title}
  </h3>
);

const List = ({ items }) => (
  <ul className="list-disc ml-6 space-y-2">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

export default CookiePolicy;