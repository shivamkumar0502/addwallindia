import React from "react";

const RefundCancellation = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1c1b2f] via-[#3b1f1b] to-[#8b3a18] text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Refund & Cancellation Policy
          </h1>

          <p className="text-xl text-gray-200">
            Learn about refunds, cancellations, payments and our Cookie Policy.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 -mt-16 pb-20">

        <div className="bg-white rounded-3xl shadow-xl p-10">

          {/* Header */}
          <div className="border-b pb-8 mb-8">
            <h2 className="text-3xl font-bold">
              AdWall India
            </h2>

            <p className="text-gray-500 mt-3">
              <strong>Effective Date:</strong> 01 August 2026
            </p>

            <p className="text-gray-500">
              <strong>Last Updated:</strong> 01 August 2026
            </p>
          </div>

          {/* Refund Policy */}

          <Section title="1. Introduction">
            <p>
              This Refund & Cancellation Policy explains the rules governing
              cancellations, refunds, bookings, payments and advertising
              services provided through AdWall India.
            </p>

            <p className="mt-4">
              By using AdWall India, you agree to this Policy.
            </p>
          </Section>

          <Section title="2. Nature of Services">
            <p>AdWall India is an online marketplace connecting:</p>

            <List
              items={[
                "Advertisers",
                "Property Owners",
                "Media Owners",
              ]}
            />

            <p className="mt-5 font-semibold">
              Platform Services
            </p>

            <List
              items={[
                "Book outdoor advertising spaces",
                "List advertising properties",
                "Connect with verified advertisers",
                "Manage advertising campaigns",
              ]}
            />

            <div className="bg-blue-50 border rounded-xl p-4 mt-5">
              Refunds depend on booking type, payment stage and campaign status.
            </div>
          </Section>

          <Section title="3. Booking Cancellation by Advertiser">
            <p>Cancellation may be requested before campaign confirmation.</p>

            <List
              items={[
                "Campaign status",
                "Payment status",
                "Third-party commitments",
                "Installation status",
              ]}
            />

            <p className="mt-4">
              Once the campaign has started, refunds may not be available.
            </p>
          </Section>

          <Section title="4. Cancellation by Property Owner">

            <List
              items={[
                "Listing suspension",
                "Reduced visibility",
                "Temporary account restriction",
                "Permanent account suspension",
              ]}
            />

          </Section>

          <Section title="5. Cancellation by AdWall India">

            <List
              items={[
                "Fraud detection",
                "False property information",
                "Payment verification failure",
                "KYC failure",
                "Government restrictions",
              ]}
            />

          </Section>

          <Section title="6. Refund Eligibility">

            <List
              items={[
                "Duplicate payment",
                "Failed payment",
                "Booking unavailable after payment",
                "Technical error",
                "Incorrect transaction processing",
              ]}
            />

          </Section>

          <Section title="7. Non-Refundable Situations">

            <List
              items={[
                "Campaign already started",
                "Advertisement already displayed",
                "Creative approval delays",
                "Incorrect booking information",
                "Policy violations",
                "Services already delivered",
              ]}
            />

          </Section>

          <Section title="8. Refund Processing Time">

            <div className="bg-green-50 border rounded-xl p-5">

              <h3 className="font-bold text-green-700 text-xl">
                5–10 Business Days
              </h3>

              <p className="mt-2">
                Processing time depends on your Bank, UPI provider, Credit Card
                provider and Payment Gateway.
              </p>

            </div>

          </Section>

          <Section title="9. Payment Gateway">
            <p>
              Payments are processed through secure third-party payment
              providers.
            </p>

            <List
              items={[
                "Banks",
                "UPI Providers",
                "Card Networks",
                "Payment Gateway Partners",
              ]}
            />
          </Section>

          <Section title="10. Failed Transactions">
            <p>
              If money is deducted but booking is not confirmed, please wait up
              to <strong>48 hours</strong>. If unresolved, contact our support
              team.
            </p>
          </Section>

          <Section title="11. Chargebacks">
            <p>
              Users should contact AdWall India before initiating chargebacks.
            </p>

            <List
              items={[
                "Account suspension",
                "Booking cancellation",
                "Legal action where applicable",
              ]}
            />
          </Section>

          <Section title="12. Refund Method">
            <p>
              Approved refunds will be processed through the original payment
              method whenever possible.
            </p>
          </Section>

          <Section title="13. Contact">

            <div className="bg-orange-50 rounded-xl border p-6">

              <p><strong>AdWall India</strong></p>

              <p className="mt-3">
                📧 contact@adwallindia.com
              </p>

              <p>
                🌐 www.adwallindia.com
              </p>

            </div>

          </Section>

          {/* Divider */}

          <div className="my-16 border-t pt-16">

            <h1 className="text-4xl font-bold mb-10">
              Cookie Policy
            </h1>

            <Section title="1. What are Cookies?">
              <p>
                Cookies are small text files stored on your device to improve
                your browsing experience and help our Platform function
                efficiently.
              </p>
            </Section>

            <Section title="2. Types of Cookies We Use">

              <List
                items={[
                  "Essential Cookies",
                  "Security Cookies",
                  "Login Cookies",
                  "Analytics Cookies",
                  "Performance Cookies",
                  "Preference Cookies",
                ]}
              />

            </Section>

            <Section title="3. Why We Use Cookies">

              <List
                items={[
                  "Keep users logged in",
                  "Improve website performance",
                  "Remember preferences",
                  "Analyze traffic",
                  "Detect suspicious activity",
                  "Improve security",
                  "Personalize user experience",
                ]}
              />

            </Section>

            <Section title="4. Third-Party Cookies">
              <p>
                Third-party services like analytics and payment providers may
                also use cookies under their own privacy policies.
              </p>
            </Section>

            <Section title="5. Managing Cookies">
              <p>
                Users can disable cookies through browser settings, although
                some Platform features may not function properly.
              </p>
            </Section>

            <Section title="6. Cookie Consent">
              <p>
                By continuing to use AdWall India, you consent to the use of
                cookies in accordance with this Cookie Policy.
              </p>
            </Section>

            <Section title="7. Updates">
              <p>
                We may update this Cookie Policy periodically. The latest
                version will always be available on our website.
              </p>
            </Section>

            <Section title="Contact">

              <div className="bg-gray-100 rounded-xl p-6">

                <p>📧 contact@adwallindia.com</p>

                <p>🌐 www.adwallindia.com</p>

              </div>

            </Section>

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

export default RefundCancellation;