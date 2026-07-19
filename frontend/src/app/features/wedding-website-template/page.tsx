'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, Sparkles, MapPin, Heart, MessageSquareHeart, ChevronDown } from 'lucide-react';

export default function Page() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Heart className="w-6 h-6 text-[#c5a880]" />,
      title: "RSVP & Guest Tracker",
      desc: "Allow guests to easily submit RSVP confirmations online. Monitor guest lists, dietary needs, and welcome statuses."
    },
    {
      icon: <MapPin className="w-6 h-6 text-[#c5a880]" />,
      title: "Interactive Program Timeline",
      desc: "List your event ceremonies (e.g. Sangeet, Wedding, Reception) with maps, hotel guidelines, and calendar integration."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#c5a880]" />,
      title: "Linked Live Photo Streams",
      desc: "Connect the minisite directly to the event's live face-recognition matched photo gallery for immediate guest access."
    },
    {
      icon: <MessageSquareHeart className="w-6 h-6 text-[#c5a880]" />,
      title: "Digital Guestbook & Wishes",
      desc: "Let friends and family post digital blessings, notes, and wishes that couples can preserve forever in their archives."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Choose Template & Brand",
      desc: "Select a luxury layout that matches the couple's wedding theme, color scheme, and typography style."
    },
    {
      num: "02",
      title: "Input Love Story & Details",
      desc: "Add couple stories, venue directions, ceremony schedules, and custom RSVP inquiry questions."
    },
    {
      num: "03",
      title: "Launch & Share",
      desc: "Publish the minisite, download the print invitation cards with QR code, and send it to all guests."
    }
  ];

  const faqs = [
    {
      q: "Can I customize the wedding minisite domain?",
      a: "Yes. You can host the wedding minisite on a branded subdomain (e.g. couple.yourstudio.com) or map it directly to a custom event domain."
    },
    {
      q: "How does the RSVP reporting work?",
      a: "Couples can access their private RSVP dashboard where guest counts, hotel requirements, and diet notes are compiled into exportable spreadsheets."
    },
    {
      q: "Can guests upload their own pictures to the site?",
      a: "Yes. You can enable a guest upload folder, allowing guests to upload their casual mobile photos directly to a shared event workspace."
    },
    {
      q: "Is the wedding minisite responsive on mobile?",
      a: "Absolutely. The templates are designed mobile-first, ensuring an elegant user interface on all smartphones, tablets, and computers."
    }
  ];

  return (
    <PublicWrapper>
      <main className="bg-[#faf9f6] text-[#09090b] font-poppins">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-28 border-b border-[#e3d8c8]/30">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-[#e3d8c8]/25 opacity-40 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#c5a880]/10 opacity-30 blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 bg-[#f5f2eb] text-[#c5a880] border border-[#c5a880]/15 text-[11px] font-black uppercase tracking-widest rounded-full mb-6 shadow-sm">
              Wedding Minisites
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-7xl font-light text-[#09090b] leading-[1.15] mb-6 max-w-4xl mx-auto">
              Luxury Wedding Minisites and <span className="italic text-[#c5a880]">Live Guest RSVP</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Create an unforgettable digital experience for couples. Offer them bespoke wedding invitation websites complete with RSVP managers, schedules, and live photo sharing.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Create Wedding Minisite
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#09090b] border border-[#09090b]/20 px-9 py-4 rounded-full hover:bg-[#f5f2eb] transition-all duration-300"
              >
                Schedule Live Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Core Value Grid */}
        <section className="py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <div className="max-w-3xl mx-auto mb-16">
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light mb-6">
                Premium Digital Invitation Sites for <span className="italic text-[#c5a880]">Bespoke Couples</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                Deliver value that goes beyond the camera lens. Provide custom minisites that wedding guests will love.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div key={i} className="bg-[#faf9f6] border border-[#e3d8c8]/30 p-8 rounded-3xl text-left hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#e3d8c8]/40 flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#09090b] group-hover:text-white transition-all">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#09090b] mb-3">{f.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-24 bg-[#faf9f6] border-b border-[#e3d8c8]/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-widest bg-[#f5f2eb] px-3.5 py-1.5 rounded-full border border-[#c5a880]/15">
                Simple Setup
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light mt-6">
                Deploying the Digital Minisite <span className="italic text-[#c5a880]">Experience</span>
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

        {/* Comparison Table */}
        <section className="py-24 bg-white border-b border-[#e3d8c8]/30">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light text-center mb-16">
              Paper Invitations vs <span className="italic text-[#c5a880]">Wedding Minisites</span>
            </h2>

            <div className="border border-[#e3d8c8]/40 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse font-poppins">
                <thead>
                  <tr className="bg-[#09090b] text-white">
                    <th className="p-6 text-sm font-bold uppercase tracking-wider">Metrics</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider text-center">Printed Paper Invites</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider text-center text-[#c5a880]">Mara Photo Minisites</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3d8c8]/20">
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">RSVP Coordination</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Manual phone confirmations, chaotic tracking</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Automated spreadsheet list reports</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Photo Delivery Link</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">None (guests wait months for downloads)</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Integrated live face-matched stream</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Updates & Changes</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Requires re-printing cards (expensive)</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Edit and update details instantly</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Interactivity</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Static text layout</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Digital guestbook, timelines, maps</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 bg-[#faf9f6] border-b border-[#e3d8c8]/30">
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
