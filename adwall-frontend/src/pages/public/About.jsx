import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Users, TrendingUp, Heart } from "lucide-react";

const About = () => (
  <div className="min-h-screen">
    {/* Hero */}
    <section className="bg-gradient-to-br from-gray-900 to-orange-900 text-white py-20 px-4 text-center">
      <h1 className="text-4xl font-black mb-4">AdWall India ke Baare Mein</h1>
      <p className="text-gray-300 text-lg max-w-2xl mx-auto">India ka sabse transparent aur tech-first outdoor advertising marketplace</p>
    </section>

    {/* Mission */}
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Hamara Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">AdWall India ek vision se bani hai — India mein outdoor advertising ko transparent, affordable aur accessible banana. Chhote business se lekar bade brands tak — sabke liye.</p>
          <p className="text-gray-600 leading-relaxed">Pehle outdoor advertising mein middlemen, opaque pricing aur no accountability tha. Hum ne isse badal diya — verified owners, fixed transparent pricing, escrow payment aur real-time tracking.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon:<Target size={24} />, label:"Mission", value:"Transparent OOH" },
            { icon:<Users size={24} />, label:"Community", value:"10K+ Users" },
            { icon:<TrendingUp size={24} />, label:"Growth", value:"500% YoY" },
            { icon:<Heart size={24} />, label:"Satisfaction", value:"4.8/5 Rating" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-brand-500 mb-2 flex justify-center">{icon}</div>
              <div className="font-black text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-12">Hamare Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon:"🔍", title:"Transparency", desc:"Har transaction visible. Koi hidden charges nahi, koi surprises nahi." },
            { icon:"🛡️", title:"Trust", desc:"KYC verified owners, escrow payments. Aapka paisa 100% safe." },
            { icon:"⚡", title:"Speed", desc:"Search to booking in minutes. No lengthy negotiations, no paperwork hassle." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-8 border">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="font-black text-gray-900 text-xl mb-3">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Founders</h2>
        <p className="text-gray-500 mb-12">AdWall India ek passionate team ne build ki hai jo outdoor advertising industry ko revolutionize karna chahti hai.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name:"Shivam Kumar", role:"Founder & CEO", emoji:"👨‍💻", bg:"bg-orange-100" },
            { name:"Nishant Raj", role:"CO-Founder", emoji:"👨‍💻", bg:"bg-orange-100" },
            { name:"Tech Team", role:"Engineering", emoji:"⚙️", bg:"bg-blue-100" },
            { name:"Sales Team", role:"Growth", emoji:"📈", bg:"bg-green-100" },
          ].map(({ name, role, emoji, bg }) => (
            <div key={name} className="text-center">
              <div className={`h-24 w-24 rounded-full ${bg} flex items-center justify-center text-4xl mx-auto mb-4`}>{emoji}</div>
              <h3 className="font-bold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-400">{role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-16 px-4 bg-brand-500 text-white text-center">
      <h2 className="text-2xl font-black mb-4">Join AdWall India Today</h2>
      <p className="text-orange-100 mb-8">Advertiser ya Owner — dono ke liye best platform</p>
      <Link to="/register"><Button size="lg" className="bg-white text-brand-600 hover:bg-orange-50 font-bold px-10">Get Started Free</Button></Link>
    </section>
  </div>
);
export default About;
