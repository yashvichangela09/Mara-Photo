'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, Layout, Globe, Search, MessageSquare, ChevronDown } from 'lucide-react';

export default function Page() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Layout className="w-6 h-6 text-[#c5a880]" />,
      title: "Elegant Masonry Grid Layouts",
      desc: "Present your best shoots in premium visual grids that support high-resolution image zoom, smooth transitions, and lightboxes."
    },
    {
      icon: <Globe className="w-6 h-6 text-[#c5a880]" />,
      title: "Custom Domain Mapping",
      desc: "Remove the platform branding. Securely connect your own custom domain name (e.g., yourstudio.com) with one click."
    },
    {
      icon: <Search className="w-6 h-6 text-[#c5a880]" />,
      title: "Built-in SEO Optimizations",
      desc: "Optimized clean HTML, fast image lazy-loading, and metadata attributes that help your portfolio rank higher on local Google searches."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[#c5a880]" />,
      title: "Integrated Lead Inquiries",
      desc: "Incorporate client contact forms directly on your portfolio page. Inquiries route instantly into your studio CRM manager."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Select Theme Style",
      desc: "Pick from our curated, minimal photography portfolio templates that emphasize your visual storytelling style."
    },
    {
      num: "02",
      title: "Upload & Categorize",
      desc: "Upload your select images and organize them into folders like Wedding, Pre-Wedding, Portrait, and Fashion."
    },
    {
      num: "03",
      title: "Map Domain & Publish",
      desc: "Bind your custom domain name, hit publish, and share your fast new website with prospect leads."
    }
  ];

  const faqs = [
    {
      q: "Can I map my own domain name like photographyname.com?",
      a: "Yes. You can point your custom domain name easily by modifying your DNS records according to our settings guide."
    },
    {
      q: "How does the lead capture form notify me?",
      a: "When a potential client submits an inquiry on your portfolio website, you receive instant email and SMS notifications, and a record is created in the Customers tab of your dashboard."
    },
    {
      q: "Are the images optimized for mobile speed?",
      a: "Yes. Our engine dynamically processes and serves resized web-optimized versions of your uploaded images to guests, ensuring the portfolio loads fast on mobile connections."
    },
    {
      q: "Can I password-protect specific portfolio galleries?",
      a: "Yes. You can toggle privacy locks on selected albums, requiring a direct client passcode before they are visible."
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
              Custom Portfolios
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-7xl font-light text-[#09090b] leading-[1.15] mb-6 max-w-4xl mx-auto">
              Luxury Customizable Websites for <span className="italic text-[#c5a880]">Modern Photographers</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Stand out in the digital landscape. Showcase your curated masterpieces on an editorial portfolio website designed to attract high-end, premium booking clients.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Build Your Portfolio Website
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
                Premium Visual Presentations for <span className="italic text-[#c5a880]">Elite Visual Artists</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                Ditch complex website builders. Deploy a fast, fully-integrated portfolio page in minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((f, i) => (
                <div key={i} className="bg-[#faf9f6] border border-[#e3d8c8]/30 p-8 rounded-3xl text-left hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#e3d8c8]/40 flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#09090b] group-hover:text-white transition-all">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#09090b] mb-3">{f.title}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">{f.desc}</p>
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
                Build Your Brand in <span className="italic text-[#c5a880]">Three Steps</span>
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
              Generic Builders vs <span className="italic text-[#c5a880]">Mara Photo Portfolios</span>
            </h2>

            <div className="border border-[#e3d8c8]/40 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse font-poppins">
                <thead>
                  <tr className="bg-[#09090b] text-white">
                    <th className="p-6 text-sm font-bold uppercase tracking-wider">Feature</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider text-center">WordPress / Generic Builders</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider text-center text-[#c5a880]">Mara Photo Portfolios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3d8c8]/20">
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Deployment Time</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Days of coding & configuration</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Under 5 minutes</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Image Speed Optimization</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Needs third-party plugins</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Automated mobile CDN resizing</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Booking Lead Flow</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Disconnected contact pages</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Routes straight to studio dashboard</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Hosting & SSL Costs</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Paid extra monthly packages</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Free SSL & cloud hosting</td>
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
