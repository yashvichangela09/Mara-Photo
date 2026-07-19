'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, GlassWater, Sparkles, Share2, Smartphone, ChevronDown } from 'lucide-react';

export default function Page() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const benefits = [
    {
      icon: <GlassWater className="w-6 h-6 text-[#c5a880]" />,
      title: "Interactive Party Vibe",
      desc: "Delight birthday, club, and concert guests by delivering their high-quality candids within seconds of them being shot."
    },
    {
      icon: <Share2 className="w-6 h-6 text-[#c5a880]" />,
      title: "Viral Instagram Shares",
      desc: "Pre-configure social tags and event hashtags so guests can upload directly to their Instagram Stories with one tap."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#c5a880]" />,
      title: "Fun Selfie Finder Filters",
      desc: "The selfie scanner is optimized to run smoothly on guests' mobile browsers under dark club/concert lighting."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#c5a880]" />,
      title: "SMS Event Marketing List",
      desc: "Collect verified guest phone numbers, helping party hosts build custom SMS/WhatsApp lists for future events."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Display Party QR",
      desc: "Show the event QR code at bar counters, DJ standees, or project it directly onto main screens."
    },
    {
      num: "02",
      title: "Shoot & Sync Live",
      desc: "Candid party photographers capture shots and sync them live to our high-speed cloud drive."
    },
    {
      num: "03",
      title: "Guests Scan & Post",
      desc: "Guests scan, match their selfies, grab their branded photos, and share them directly on social media."
    }
  ];

  const faqs = [
    {
      q: "Does the face recognition engine work in dim club lighting?",
      a: "Yes. Our AI models are optimized to match faces accurately in low-light conditions, colored neon party lights, and smoky club environments."
    },
    {
      q: "Can the event organizer collect guest contact information?",
      a: "Yes. You can configure a soft gate that asks for mobile numbers or Instagram handles before guests download their photos, generating marketing lists."
    },
    {
      q: "How fast do photos appear after being taken?",
      a: "Photos typically appear in the gallery within 2-5 minutes of the photographer taking the shot, depending on venue upload speeds."
    },
    {
      q: "Can we display the photos live on a TV screen?",
      a: "Absolutely. You can project the live slideshow cast directly on any smart TV or projector at the venue, updating live as you snap photos."
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
              Parties & Concerts
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-7xl font-light text-[#09090b] leading-[1.15] mb-6 max-w-4xl mx-auto">
              Live AI Photo Matching for <span className="italic text-[#c5a880]">Parties & Nightlife Events</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Turn parties and club nights into social media sensations. Deliver guest candids in real-time, encouraging guests to share branded photos instantly on Instagram.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Create Party Gallery Free
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
                Go Viral with Live <span className="italic text-[#c5a880]">Social Media Sharing</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                No more waiting for photo uploads. Let your party guests share their memories while the vibe is hot.
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
                Setup Workflow
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light mt-6">
                Seamless Nightlife <span className="italic text-[#c5a880]">Sharing Flow</span>
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
              Frequently Asked <span className="italic text-[#c5a880]">Questions</span>
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
