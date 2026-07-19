'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, Sparkles, QrCode, Shield, CheckCircle2, ChevronDown } from 'lucide-react';

export default function Page() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const benefits = [
    {
      icon: <Sparkles className="w-6 h-6 text-[#c5a880]" />,
      title: "Real-time AI Matching",
      desc: "Delight attendees by serving their photos live during the event. High-precision algorithms match faces in 0.5 seconds."
    },
    {
      icon: <QrCode className="w-6 h-6 text-[#c5a880]" />,
      title: "Scan-to-View Simplicity",
      desc: "Friction-free guest access. Guests scan QR codes on standees or screens and find their photos without app downloads."
    },
    {
      icon: <Shield className="w-6 h-6 text-[#c5a880]" />,
      title: "Dynamic Watermarking",
      desc: "Protect your images automatically. Guests view low-res previews and can unlock clean high-resolution files."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-[#c5a880]" />,
      title: "Marketing Lead Capture",
      desc: "Build your studio email database. Capture guest information like email and phone numbers during gallery registration."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Create Live Event Folder",
      desc: "Define the event parameters, customize branding elements, and generate custom QR standee prints."
    },
    {
      num: "02",
      title: "Shoot & Sync Live",
      desc: "Candid photographers capture moments and sync them directly to the matching engine dashboard."
    },
    {
      num: "03",
      title: "Instant Guest Delivery",
      desc: "Attendees scan the QR code, upload a selfie, and view their personalized event photo album immediately."
    }
  ];

  const faqs = [
    {
      q: "Does it support bib number recognition for sports events?",
      a: "Yes. Our advanced indexing engine can recognize and match both faces and bib numbers, making it ideal for marathons and sports events."
    },
    {
      q: "How long are the event photos hosted in the cloud?",
      a: "By default, event galleries are hosted securely for 90 days. You can choose to extend hosting or archive them to local storage from your settings dashboard."
    },
    {
      q: "Can I charge guests to download their photos?",
      a: "Absolutely. You can set download unlock fees for the event gallery, and guests can pay directly online to retrieve their high-resolution pictures."
    },
    {
      q: "Can we link multiple photographers to a single event?",
      a: "Yes. You can invite team members and assign them upload permissions, allowing multiple shooters to sync photos to the same event simultaneously."
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
              Event Photography
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-7xl font-light text-[#09090b] leading-[1.15] mb-6 max-w-4xl mx-auto">
              Live AI Photo Matching for marathons, <span className="italic text-[#c5a880]">sports & festivals</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Take event photography to the next level. Deliver high-quality guest photos in real-time, driving brand engagement and social media shares instantly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Create Event Gallery Free
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
                Deliver Value to Both Organizers <span className="italic text-[#c5a880]">and Attendees</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                No more manual sorting or CD distributions. Deliver photos live at your next event.
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
                From Camera to <span className="italic text-[#c5a880]">Guest Gallery</span>
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
