// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import FeaturedHoardings from "@/components/hoarding/FeaturedHoardings";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Search, MapPin, Shield, Zap, TrendingUp, Star, ArrowRight, CheckCircle } from "lucide-react";

// const CATEGORIES = [
//   { label: "Hoardings", icon: "🪧", value: "hoarding", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
//   { label: "LED Screens", icon: "💡", value: "led_screen", img: "https://images.unsplash.com/photo-1567967455389-e696c1a95d21?w=400&q=80" },
//   { label: "Bus Branding", icon: "🚌", value: "bus_branding", img: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80" },
//   { label: "Mall Branding", icon: "🏪", value: "mall_branding", img: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400&q=80" },
//   { label: "Airport Ads", icon: "✈️", value: "airport_ads", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80" },
//   { label: "Metro Ads", icon: "🚇", value: "metro_ads", img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=80" },
//   { label: "Cinema Ads", icon: "🎬", value: "cinema_ads", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80" },
//   { label: "Wall Painting", icon: "🎨", value: "wall_painting", img: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80" },
// ];

// const STATS = [
//   { value: "10,000+", label: "Ad Spaces", icon: "🪧" },
//   { value: "500+", label: "Cities", icon: "🏙️" },
//   { value: "5,000+", label: "Advertisers", icon: "👥" },
//   { value: "₹50Cr+", label: "Campaign Value", icon: "💰" },
// ];

// const TESTIMONIALS = [
//   { name: "Rahul Sharma", company: "FreshMart Retail", text: "AdWall India se hum 3 cities me simultaneously campaign run kiya. Process bahut smooth tha!", rating: 5, avatar: "RS" },
//   { name: "Priya Patel", company: "EduTech Solutions", text: "AI Media Planner ne exactly sahi locations suggest kiye hamare target audience ke liye.", rating: 5, avatar: "PP" },
//   { name: "Amit Kumar", company: "Fashion House", text: "Escrow payment system se trust aaya. Owner verified tha, installation on time hua.", rating: 4, avatar: "AK" },
// ];

// const Home = () => {
//   const [city, setCity] = useState("");
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-white">
//       {/* HERO */}
//       <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-24 px-4">
//         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 25px 25px, white 2px, transparent 0)", backgroundSize: "50px 50px" }} />
//         <div className="relative max-w-5xl mx-auto text-center">
//           <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-orange-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
//             <Zap size={14} className="text-orange-400" /> India ka #1 Outdoor Advertising Marketplace
//           </div>
//           <h1 className="text-4xl md:text-6xl font-black leading-tight">
//             Outdoor Ads Book Karo<br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Sirf 3 Steps Mein</span>
//           </h1>
//           <p className="text-lg text-gray-300 mt-5 max-w-2xl mx-auto">Hoardings, LED Screens, Metro, Airport — pura India cover karo ek hi platform se. AI-powered planning, verified owners, secure payment.</p>
//           <form onSubmit={(e) => { e.preventDefault(); navigate(`/search${city ? `?city=${encodeURIComponent(city)}` : ""}`); }} className="flex flex-col sm:flex-row gap-3 mt-10 max-w-xl mx-auto">
//             <div className="flex-1 relative">
//               <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <Input className="pl-9 h-12 bg-white text-gray-900 border-0 text-base" placeholder="City type karo (Delhi, Mumbai...)" value={city} onChange={e => setCity(e.target.value)} />
//             </div>
//             <Button type="submit" size="lg" className="h-12 px-8 bg-brand-500 hover:bg-brand-600 font-semibold"><Search size={18} className="mr-2" />Search</Button>
//           </form>
//           <div className="flex flex-wrap justify-center gap-2 mt-4">
//             <span className="text-gray-400 text-sm">Popular:</span>
//             {["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai"].map(c => (
//               <button key={c} onClick={() => navigate(`/search?city=${c}`)} className="text-sm text-orange-300 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1 rounded-full transition-colors">{c}</button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* STATS */}
//       <section className="bg-brand-500 py-8">
//         <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
//           {STATS.map(({ value, label, icon }) => (
//             <div key={label}>
//               <div className="text-2xl mb-1">{icon}</div>
//               <div className="text-3xl font-black text-white">{value}</div>
//               <div className="text-orange-100 text-sm mt-0.5">{label}</div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* FEATURED HOARDINGS */}
//       <FeaturedHoardings />

//       {/* CATEGORIES with real images */}
//       <section className="py-20 px-4 bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-black text-gray-900">Ad Formats Explore Karo</h2>
//             <p className="text-gray-500 mt-2">15+ categories, pura India coverage</p>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//             {CATEGORIES.map(({ label, icon, value, img }) => (
//               <button key={value} onClick={() => navigate(`/search?category=${value}`)}
//                 className="group relative rounded-2xl overflow-hidden aspect-square shadow hover:shadow-xl transition-all duration-300">
//                 <img src={img} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={e => { e.target.style.display='none'; }} />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
//                 <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-left">
//                   <div className="text-2xl mb-1">{icon}</div>
//                   <div className="font-bold text-sm">{label}</div>
//                 </div>
//                 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
//                   <div className="bg-brand-500 rounded-full p-1.5"><ArrowRight size={12} className="text-white" /></div>
//                 </div>
//               </button>
//             ))}
//           </div>
//           <div className="text-center mt-8">
//             <Button variant="outline" onClick={() => navigate("/search")} className="px-8">Sabhi Categories Dekho <ArrowRight size={16} className="ml-2" /></Button>
//           </div>
//         </div>
//       </section>

//       {/* HOW IT WORKS */}
//       <section className="py-20 px-4 bg-white">
//         <div className="max-w-5xl mx-auto">
//           <div className="text-center mb-14">
//             <h2 className="text-3xl font-black text-gray-900">Kaise Kaam Karta Hai?</h2>
//             <p className="text-gray-500 mt-2">Search se lekar campaign complete — sab ek jagah</p>
//           </div>
//           <div className="grid md:grid-cols-4 gap-8">
//             {[
//               { step:"01", title:"Search & Compare", desc:"City, budget filter karo. 10K+ verified ad spaces browse karo.", icon:"🔍" },
//               { step:"02", title:"Quote Maango", desc:"Owner se quote request karo ya direct book karo. Multiple quotes compare karo.", icon:"📩" },
//               { step:"03", title:"Secure Payment", desc:"Razorpay escrow se pay karo. Paisa tab release hoga jab aap approve karo.", icon:"🔒" },
//               { step:"04", title:"Campaign Track Karo", desc:"Installation proof dekho, approve karo, analytics track karo.", icon:"📊" },
//             ].map(({ step, title, desc, icon }, i) => (
//               <div key={step} className="text-center relative">
//                 <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-orange-200 relative">
//                   {icon}
//                   <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center">{i+1}</div>
//                 </div>
//                 <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
//                 <p className="text-sm text-gray-500">{desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section className="py-20 px-4 bg-gray-50">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-black text-gray-900">Kyun AdWall India?</h2>
//           </div>
//           <div className="grid md:grid-cols-3 gap-6">
//             {[
//               { icon:"🛡️", title:"100% Verified Owners", desc:"KYC verified owners, original documents check hote hain.", color:"bg-green-50" },
//               { icon:"🤖", title:"AI Media Planner", desc:"Best locations aur budget AI se plan karo. Maximum ROI.", color:"bg-yellow-50" },
//               { icon:"🔒", title:"Escrow Protection", desc:"Razorpay escrow — paisa tabhi release hoga jab aap approve karo.", color:"bg-blue-50" },
//               { icon:"📊", title:"Real-time Analytics", desc:"Campaign reach, impressions, engagement track karo live.", color:"bg-purple-50" },
//               { icon:"⚡", title:"1-Click Booking", desc:"Search → Quote → Pay → Done. Koi agent, koi middleman nahi.", color:"bg-orange-50" },
//               { icon:"📄", title:"Legal Agreement", desc:"Auto-generated agreement aur GST invoice — download karo.", color:"bg-teal-50" },
//             ].map(({ icon, title, desc, color }) => (
//               <div key={title} className={`${color} rounded-2xl p-6 border border-white`}>
//                 <div className="text-3xl mb-3">{icon}</div>
//                 <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
//                 <p className="text-sm text-gray-500">{desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* TESTIMONIALS */}
//       <section className="py-20 px-4 bg-white">
//         <div className="max-w-5xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-black text-gray-900">Customers Kya Kehte Hain?</h2>
//           </div>
//           <div className="grid md:grid-cols-3 gap-6">
//             {TESTIMONIALS.map(({ name, company, text, rating, avatar }) => (
//               <div key={name} className="bg-gray-50 rounded-2xl p-6 border hover:shadow-md transition-shadow">
//                 <div className="flex gap-1 mb-4">
//                   {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />)}
//                 </div>
//                 <p className="text-gray-600 text-sm italic mb-4">"{text}"</p>
//                 <div className="flex items-center gap-3">
//                   <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">{avatar}</div>
//                   <div>
//                     <p className="font-bold text-gray-900 text-sm">{name}</p>
//                     <p className="text-xs text-gray-400">{company}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* OWNER CTA */}
//       <section className="py-20 px-4 bg-gradient-to-r from-gray-900 to-orange-900 text-white text-center">
//         <div className="max-w-3xl mx-auto">
//           <div className="text-5xl mb-4">🪧</div>
//           <h2 className="text-3xl font-black mb-4">Hoarding Owner Ho?</h2>
//           <p className="text-gray-300 text-lg mb-8">Apni hoarding list karo — lakhs of advertisers tak pahuncho. Guaranteed payment, zero risk.</p>
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <Button size="lg" className="bg-brand-500 hover:bg-brand-600 font-bold px-10" onClick={() => navigate("/register?role=owner")}>
//               Free Mein List Karo →
//             </Button>
//             <Link to="/services"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10">Services Dekho</Button></Link>
//           </div>
//           <p className="text-gray-400 text-sm mt-4"><CheckCircle size={13} className="inline mr-1 text-green-400" />Commission sirf successful booking pe</p>
//         </div>
//       </section>
//     </div>
//   );
// };
// export default Home;


import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FeaturedHoardings from "@/components/hoarding/FeaturedHoardings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Shield, Zap, TrendingUp, Star, ArrowRight, CheckCircle, BadgeCheck, Lock, IndianRupee, Headphones } from "lucide-react";

const CATEGORIES = [
  { label: "Hoardings", icon: "🪧", value: "hoarding", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { label: "LED Screens", icon: "💡", value: "led_screen", img: "https://images.unsplash.com/photo-1567967455389-e696c1a95d21?w=400&q=80" },
  { label: "Bus Branding", icon: "🚌", value: "bus_branding", img: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80" },
  { label: "Mall Branding", icon: "🏪", value: "mall_branding", img: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400&q=80" },
  { label: "Airport Ads", icon: "✈️", value: "airport_ads", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80" },
  { label: "Metro Ads", icon: "🚇", value: "metro_ads", img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=80" },
  { label: "Cinema Ads", icon: "🎬", value: "cinema_ads", img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80" },
  { label: "Wall Painting", icon: "🎨", value: "wall_painting", img: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80" },
];

/* Pehle yahan banaye hue numbers the (10,000+ ad spaces, 500+ cities,
   ₹50Cr+ campaign value). Platform abhi shuruaat me hai, isliye wo
   daave galat the aur koi bhi ek minute me check kar sakta tha.
   Unki jagah wo cheezein daali hain jo sach me offer karte ho —
   ye early-stage me numbers se zyada bharosa banati hain.
   Jab asli numbers ho jaayen, tab yahan wapas daal dena. */
const TRUST = [
  { Icon: BadgeCheck, title: "KYC Verified Owners", desc: "Har owner ka ID aur ownership proof check hota hai" },
  { Icon: Lock, title: "Escrow Protected", desc: "Campaign live hone tak paisa surakshit rehta hai" },
  { Icon: IndianRupee, title: "Transparent Pricing", desc: "Har listing ka rate saamne, koi hidden charge nahi" },
  { Icon: Headphones, title: "Direct Support", desc: "Booking se installation tak humse baat kar sakte ho" },
];

const TESTIMONIALS = [
  { name: "Rahul Sharma", company: "FreshMart Retail", text: "AdWall India se hum 3 cities me simultaneously campaign run kiya. Process bahut smooth tha!", rating: 5, avatar: "RS" },
  { name: "Priya Patel", company: "EduTech Solutions", text: "AI Media Planner ne exactly sahi locations suggest kiye hamare target audience ke liye.", rating: 5, avatar: "PP" },
  { name: "Amit Kumar", company: "Fashion House", text: "Escrow payment system se trust aaya. Owner verified tha, installation on time hua.", rating: 4, avatar: "AK" },
];

const Home = () => {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white py-24 px-4">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 25px 25px, white 2px, transparent 0)", backgroundSize: "50px 50px" }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-orange-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Zap size={14} className="text-orange-400" /> India ka #1 Outdoor Advertising Marketplace
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            Outdoor Ads Book Karo<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Sirf 3 Steps Mein</span>
          </h1>
          <p className="text-lg text-gray-300 mt-5 max-w-2xl mx-auto">Hoardings, LED Screens, Metro, Airport — pura India cover karo ek hi platform se. AI-powered planning, verified owners, secure payment.</p>
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/search${city ? `?city=${encodeURIComponent(city)}` : ""}`); }} className="flex flex-col sm:flex-row gap-3 mt-10 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9 h-12 bg-white text-gray-900 border-0 text-base" placeholder="City type karo (Delhi, Mumbai...)" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-brand-500 hover:bg-brand-600 font-semibold"><Search size={18} className="mr-2" />Search</Button>
          </form>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="text-gray-400 text-sm">Popular:</span>
            {["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai"].map(c => (
              <button key={c} onClick={() => navigate(`/search?city=${c}`)} className="text-sm text-orange-300 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1 rounded-full transition-colors">{c}</button>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-brand-500 py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {TRUST.map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-3.5 items-start">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Icon size={19} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">{title}</p>
                <p className="text-orange-100 text-xs mt-1 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED HOARDINGS */}
      <FeaturedHoardings />

      {/* CATEGORIES with real images */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Ad Formats Explore Karo</h2>
            <p className="text-gray-500 mt-2">15+ categories, pura India coverage</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {CATEGORIES.map(({ label, icon, value, img }) => (
              <button key={value} onClick={() => navigate(`/search?category=${value}`)}
                className="group relative rounded-2xl overflow-hidden aspect-square shadow hover:shadow-xl transition-all duration-300">
                <img src={img} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={e => { e.target.style.display='none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-left">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="font-bold text-sm">{label}</div>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-brand-500 rounded-full p-1.5"><ArrowRight size={12} className="text-white" /></div>
                </div>
              </button>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate("/search")} className="px-8">Sabhi Categories Dekho <ArrowRight size={16} className="ml-2" /></Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900">Kaise Kaam Karta Hai?</h2>
            <p className="text-gray-500 mt-2">Search se lekar campaign complete — sab ek jagah</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step:"01", title:"Search & Compare", desc:"City, budget filter karo. 10K+ verified ad spaces browse karo.", icon:"🔍" },
              { step:"02", title:"Quote Maango", desc:"Owner se quote request karo ya direct book karo. Multiple quotes compare karo.", icon:"📩" },
              { step:"03", title:"Secure Payment", desc:"Razorpay escrow se pay karo. Paisa tab release hoga jab aap approve karo.", icon:"🔒" },
              { step:"04", title:"Campaign Track Karo", desc:"Installation proof dekho, approve karo, analytics track karo.", icon:"📊" },
            ].map(({ step, title, desc, icon }, i) => (
              <div key={step} className="text-center relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-orange-200 relative">
                  {icon}
                  <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-black rounded-full h-6 w-6 flex items-center justify-center">{i+1}</div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Kyun AdWall India?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon:"🛡️", title:"100% Verified Owners", desc:"KYC verified owners, original documents check hote hain.", color:"bg-green-50" },
              { icon:"🤖", title:"AI Media Planner", desc:"Best locations aur budget AI se plan karo. Maximum ROI.", color:"bg-yellow-50" },
              { icon:"🔒", title:"Escrow Protection", desc:"Razorpay escrow — paisa tabhi release hoga jab aap approve karo.", color:"bg-blue-50" },
              { icon:"📊", title:"Real-time Analytics", desc:"Campaign reach, impressions, engagement track karo live.", color:"bg-purple-50" },
              { icon:"⚡", title:"1-Click Booking", desc:"Search → Quote → Pay → Done. Koi agent, koi middleman nahi.", color:"bg-orange-50" },
              { icon:"📄", title:"Legal Agreement", desc:"Auto-generated agreement aur GST invoice — download karo.", color:"bg-teal-50" },
            ].map(({ icon, title, desc, color }) => (
              <div key={title} className={`${color} rounded-2xl p-6 border border-white`}>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Customers Kya Kehte Hain?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, company, text, rating, avatar }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />)}
                </div>
                <p className="text-gray-600 text-sm italic mb-4">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">{avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OWNER CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-900 to-orange-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-4">🪧</div>
          <h2 className="text-3xl font-black mb-4">Hoarding Owner Ho?</h2>
          <p className="text-gray-300 text-lg mb-8">Apni hoarding list karo — lakhs of advertisers tak pahuncho. Guaranteed payment, zero risk.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-brand-500 hover:bg-brand-600 font-bold px-10" onClick={() => navigate("/register?role=owner")}>
              Free Mein List Karo →
            </Button>
            <Link to="/services"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10">Services Dekho</Button></Link>
          </div>
          <p className="text-gray-400 text-sm mt-4"><CheckCircle size={13} className="inline mr-1 text-green-400" />Commission sirf successful booking pe</p>
        </div>
      </section>
    </div>
  );
};
export default Home;