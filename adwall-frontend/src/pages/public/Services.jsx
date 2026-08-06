import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const SERVICES = [
  { icon:"🪧", title:"Hoarding & Billboard Booking", desc:"Prime locations pe hoardings aur billboards book karo. Highway, city center, residential areas — sab available.", features:["Verified locations","Negotiable pricing","Digital proof","GST invoice"] },
  { icon:"💡", title:"LED Screen Advertising", desc:"High-impact LED screens — malls, airports, highways. Video content support.", features:["HD display","24/7 visibility","Multiple slots","Analytics"] },
  { icon:"🚌", title:"Transit Media", desc:"Bus, auto, cab branding — city bhhar mein moving billboard bano.", features:["City-wide reach","Cost effective","Multiple formats","Real-time tracking"] },
  { icon:"🤖", title:"AI Media Planning", desc:"Budget batao, city batao — AI best locations aur media mix suggest karega.", features:["ROI optimization","Multi-city planning","Budget allocation","Campaign analytics"] },
  { icon:"📋", title:"Campaign Management", desc:"End-to-end campaign management — booking se lekar installation proof aur analytics tak.", features:["Dedicated manager","Weekly reports","Photo proof","Performance review"] },
  { icon:"🎨", title:"Design & Print Services", desc:"Creative design aur printing bhi AdWall se. Professional team, fast delivery.", features:["Creative design","High-quality print","Fast turnaround","Pan India delivery"] },
];

const Services = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-orange-900 text-white py-20 px-4 text-center">
        <h1 className="text-4xl font-black mb-4">Hamare Services</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">Outdoor advertising ka complete ecosystem — planning se lekar execution tak</p>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon, title, desc, features }) => (
              <div key={title} className="border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm mb-4">{desc}</p>
                <ul className="space-y-1.5">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={13} className="text-green-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-16 px-4 bg-orange-50 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Ready to Start?</h2>
        <p className="text-gray-500 mb-8">Abhi search karo aur apna campaign shuru karo</p>
        <Button size="lg" className="px-10" onClick={() => navigate("/search")}>Ad Space Search Karo <ArrowRight size={16} className="ml-2" /></Button>
      </section>
    </div>
  );
};
export default Services;
