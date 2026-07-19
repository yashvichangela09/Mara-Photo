'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, Heart, Sparkles, Tv, Camera, Check, ChevronDown } from 'lucide-react';

export default function Page() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const benefits = [
    {
      icon: <Heart className="w-6 h-6 text-[#c5a880]" />,
      title: "Wow the Couple & Guests",
      desc: "Delight guests by delivering their high-quality candid pictures on the wedding day itself, turning your photography into an interactive talking point."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#c5a880]" />,
      title: "Massive Brand Exposure",
      desc: "Every guest who receives their photos sees your studio's logo, watermark, and direct links to book you, driving organic referrals."
    },
    {
      icon: <Tv className="w-6 h-6 text-[#c5a880]" />,
      title: "Cast Live to Reception Smart Screens",
      desc: "Run a live slideshow of matched family moments, pre-wedding shots, and reception candids during the dinner."
    },
    {
      icon: <Camera className="w-6 h-6 text-[#c5a880]" />,
      title: "Organized Multi-Day Shoots",
      desc: "Manage multiple functions (Haldi, Mehendi, Sangeet, Wedding Reception) under a single event folder with sub-gallery splits."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Create Wedding Gallery",
      desc: "Set up the wedding event in your dashboard, add function folders, and customize the branded QR standees."
    },
    {
      num: "02",
      title: "Shoot & Upload Live",
      desc: "Your shooters upload photos directly via the web dashboard or FTP interface, which indexes faces automatically."
    },
    {
      num: "03",
      title: "Guests Scan & Enjoy",
      desc: "Guests scan QR codes placed around the reception, take a selfie, and instantly save their photos."
    }
  ];

  const faqs = [
    {
      q: "Can the couple choose to hide certain private photos?",
      a: "Yes. Our admin panel allows the studio or the couple to review uploaded photos, hide specific directories, or restrict download permissions as needed."
    },
    {
      q: "Can I sell printed albums or prints directly from the gallery?",
      a: "Yes. You can link custom call-to-action buttons or payment gateways, letting guests order physical prints of their favorite candids."
    },
    {
      q: "Is there a guest size limit for wedding galleries?",
      a: "No. Our enterprise servers can handle thousands of concurrent scans and photo deliveries without slowdown."
    },
    {
      q: "What if there is poor internet speed at the wedding venue?",
      a: "You can shoot normally and upload the photos at the end of the day or from the hotel. The AI will index and send all notifications instantly once connected."
    }
  ];

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b] font-poppins font-medium">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28 border-b border-[#e3d8c8]/30">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-6 shadow-sm">
              Wedding Photography
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-7xl font-light text-[#09090b] leading-[1.15] mb-6 max-w-4xl mx-auto">
              Delight Guests with Live AI <span className="italic text-[#c5a880]">Wedding Photo Delivery</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Turn wedding guests into advocates. Eliminate months of waiting by delivering guest photos on the wedding day. Let them scan, snap a selfie, and save.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Set Up Wedding Event Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-9 py-4 rounded-full hover:bg-[#f5f2eb] transition-all duration-300"
              >
                Consult Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto mb-16">
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light mb-6">
                Redefining the <span className="italic text-[#c5a880]">Wedding Photography Experience</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                Traditional delivery takes months. Mara Photo processes, tags, and delivers matches live on the wedding day.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((b, i) => (
                <div key={i} className="bg-[#faf9f6] border border-[#e3d8c8]/30 p-8 rounded-3xl text-left hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#e3d8c8]/40 flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#09090b] group-hover:text-white transition-all">
                    {b.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#09090b] mb-3">{b.title}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-[#faf9f6] border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full border border-[#c5a880]/15">
                Simple Setup
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light mt-6">
                From Shutter to <span className="italic text-[#c5a880]">Guest Gallery</span>
              </h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-12 relative">
              {steps.map((s, i) => (
                <div key={i} className="relative bg-white border border-[#e3d8c8]/20 p-10 rounded-3xl shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-6 right-8 text-5xl font-serif-luxury font-bold text-[#c5a880]/20 select-none">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-bold text-[#09090b] mb-4 mt-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-center mb-16">
              Wedding Guest <span className="italic text-[#c5a880]">Queries</span>
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-[#e3d8c8]/25 rounded-2xl overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full p-6 flex justify-between items-center text-left font-bold text-slate-800 hover:text-[#c5a880] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFaq === i && (
                    <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call To Action Banner */}
        <section className="bg-[#09090b] py-24 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[250px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-white">
              Ready to elevate your <span className="italic text-[#c5a880]">client experience?</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto font-medium leading-relaxed">
              Join thousands of premium studios. Deliver photos live at your next event.
            </p>
            <div className="pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] bg-[#c5a880] hover:bg-white px-9 py-4 rounded-full transition-all duration-300 shadow-md"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </PublicWrapper>
  );
}
