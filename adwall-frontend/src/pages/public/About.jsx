import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, ShieldCheck, Zap, Linkedin, Mail, GraduationCap } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Founder photos

   Add your photos here: adwall-frontend/public/team/
     - nishant.jpg
     - shivam.jpg

   Use square images (1:1), at least 400x400px — smaller images
   will look blurry inside the rounded frame.

   No photo yet? The card falls back to an initials avatar
   automatically, so nothing breaks.
───────────────────────────────────────────────────────── */

const FOUNDERS = [
  {
    name: "Nishant Raj",
    role: "Founder & Chief Executive Officer",
    photo: "/team/nishant.jpg",
    education: "NIT Delhi — Graduate",
    bio:
      "Nishant leads product direction, partnerships and day-to-day operations at " +
      "AdWall India. After studying how outdoor advertising is bought and sold across " +
      "Tier-2 and Tier-3 cities, he found the core problem was information: advertisers " +
      "had no reliable way to discover available inventory or verify fair pricing. " +
      "AdWall India was built to close that gap.",
    focus: ["Product Strategy", "Partnerships", "Operations"],
    linkedin: "",
    email: "",
  },
  {
    name: "Shivam Kumar",
    role: "Co-Founder & Chief Technology Officer",
    photo: "/team/shivam.jpg.jpeg",
    education: "NIT Sikkim — Undergraduate",
    bio:
      "Shivam owns the engineering side of the platform, from geospatial search and " +
      "mapping to escrow payments, identity verification and infrastructure. His focus " +
      "is accessibility: a shop owner in a small town should be able to list a wall as " +
      "easily as an agency books a nationwide campaign.",
    focus: ["Engineering", "Platform Architecture", "Payments & Security"],
    linkedin: "",
    email: "",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const FounderCard = ({ f }) => {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col sm:flex-row gap-6">
      <div className="shrink-0 mx-auto sm:mx-0">
        {imgOk ? (
          <img
            src={f.photo}
            alt={f.name}
            onError={() => setImgOk(false)}
            className="h-28 w-28 rounded-2xl object-cover bg-gray-100"
          />
        ) : (
          <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-black">
            {initials(f.name)}
          </div>
        )}
      </div>

      <div className="text-center sm:text-left">
        <h3 className="text-xl font-bold text-gray-900">{f.name}</h3>
        <p className="text-sm font-semibold text-orange-500 mt-0.5">{f.role}</p>

        {f.education && (
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 justify-center sm:justify-start">
            <GraduationCap size={13} className="text-gray-400" />
            {f.education}
          </p>
        )}

        <p className="text-sm text-gray-600 leading-relaxed mt-3">{f.bio}</p>

        <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
          {f.focus.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {(f.linkedin || f.email) && (
          <div className="flex gap-3 mt-4 justify-center sm:justify-start">
            {f.linkedin && (
              <a
                href={f.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-blue-600 transition"
                aria-label={`${f.name} on LinkedIn`}
              >
                <Linkedin size={18} />
              </a>
            )}
            {f.email && (
              <a
                href={`mailto:${f.email}`}
                className="text-gray-400 hover:text-orange-500 transition"
                aria-label={`Email ${f.name}`}
              >
                <Mail size={18} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const About = () => (
  <div className="min-h-screen bg-white">
    {/* ── Hero ── */}
    <section className="bg-gradient-to-br from-gray-900 via-gray-900 to-orange-900 text-white py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-orange-400 font-semibold text-sm tracking-wide uppercase mb-3">
          About Us
        </p>
        <h1 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
          Outdoor advertising, without the middlemen
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed">
          AdWall India connects hoarding owners directly with advertisers — verified
          listings, transparent pricing and secure payments.
        </p>
      </div>
    </section>

    {/* ── Story ── */}
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 mb-6">Why we are building this</h2>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>
            Outdoor advertising in India still runs on phone calls and personal contacts.
            A business owner looking to advertise in their own city has no reliable way to
            find out what a hoarding should cost, while property owners leave inventory
            empty for months because the right advertiser never hears about it.
          </p>
          <p>
            Both sides lose, and the intermediaries in between profit from that information
            gap. AdWall India exists to close it. Every listing is verified, every rate is
            published upfront, and payments are held in escrow until the campaign goes live.
          </p>
          <p>
            We are in our early days and the platform improves every week. Feedback from
            the advertisers and owners who use it shapes what we build next.
          </p>
        </div>
      </div>
    </section>

    {/* ── Values ── */}
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 mb-12 text-center">
          What we optimise for
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              Icon: Target,
              title: "Transparency",
              desc: "Published rates on every listing. No hidden charges, no back-and-forth negotiation.",
            },
            {
              Icon: ShieldCheck,
              title: "Trust",
              desc: "KYC-verified owners and escrow payments. Funds stay protected until your campaign begins.",
            },
            {
              Icon: Zap,
              title: "Speed",
              desc: "From search to booking in minutes — no long calls, no paperwork.",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-7 border border-gray-100">
              <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                <Icon size={20} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Founders ── */}
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Founders</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            AdWall India was founded by two NIT engineers who believe small businesses
            deserve the same advertising access that large brands take for granted.
          </p>
        </div>

        <div className="grid gap-6">
          {FOUNDERS.map((f) => (
            <FounderCard key={f.name} f={f} />
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="py-16 px-4 bg-brand-500 text-white text-center">
      <h2 className="text-2xl font-black mb-3">Join AdWall India</h2>
      <p className="text-orange-100 mb-8">
        Whether you advertise or own space — the platform is ready for you
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/register">
          <Button size="lg" className="bg-white text-brand-600 hover:bg-orange-50 font-bold px-10">
            Get Started Free
          </Button>
        </Link>
        <Link to="/contact">
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 font-bold px-10"
          >
            Talk to Us
          </Button>
        </Link>
      </div>
    </section>
  </div>
);

export default About;