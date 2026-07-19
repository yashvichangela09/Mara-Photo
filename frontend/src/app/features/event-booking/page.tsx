'use client';

import React, { useState } from 'react';
import PublicWrapper from '../../../components/PublicWrapper';
import Link from 'next/link';
import { ArrowRight, Calendar, CreditCard, Clock, CheckCircle2, ChevronDown } from 'lucide-react';

export default function Page() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Calendar className="w-6 h-6 text-[#c5a880]" />,
      title: "Interactive Client Calendar",
      desc: "Allow clients to view your studio's live availability calendar and schedule their events directly without telephone tag."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-[#c5a880]" />,
      title: "Secure Payment Gateways",
      desc: "Accept advance token bookings and installment payments safely online using Stripe, Razorpay, or credit cards."
    },
    {
      icon: <Clock className="w-6 h-6 text-[#c5a880]" />,
      title: "Smart Booking Reminders",
      desc: "Send automated email and SMS notification schedules to clients, reminding them of photoshoot dates and remaining payments."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-[#c5a880]" />,
      title: "Digital Contract Signatures",
      desc: "Protect your shoots. Embed legal terms and agreements in the checkout page that clients digitally sign upon booking."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Share Booking Link",
      desc: "Embed the scheduling portal link on your portfolio website or share it directly with potential leads."
    },
    {
      num: "02",
      title: "Choose Package & Date",
      desc: "The client selects their desired photography package, checks your live availability calendar, and picks a date."
    },
    {
      num: "03",
      title: "Sign & Secure Booking",
      desc: "They review your shoot terms, sign digitally, pay the advance token value, and confirm the shoot immediately."
    }
  ];

  const faqs = [
    {
      q: "Can I sync the scheduler with my personal Google Calendar?",
      a: "Yes. Our booking portal supports bi-directional sync with Google Calendar, Outlook, and Apple Calendar, ensuring you never double-book."
    },
    {
      q: "How does the token payment system work?",
      a: "You can define the custom advance payment percentage or a flat token rate for each photoshoot package. The client pays this token to reserve the date, and the balance due is automatically updated."
    },
    {
      q: "Can I offer custom coupon codes or discounts?",
      a: "Yes. You can create promotional coupon codes directly from your studio dashboard to give percentage or flat-rate discounts on booking checkout."
    },
    {
      q: "Can I manage reschedule and cancellation requests?",
      a: "Absolutely. You can define your rescheduling rules and cancellation windows. Clients can request changes online within your set parameters."
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
              Online Bookings
            </span>
            <h1 className="font-serif-luxury text-4xl sm:text-5xl lg:text-7xl font-light text-[#09090b] leading-[1.15] mb-6 max-w-4xl mx-auto">
              Automate Client Bookings and <span className="italic text-[#c5a880]">Token Payments</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              Ditch the back-and-forth emails. Give clients a luxury, self-service booking portal to view photography packages, select open calendar slots, and pay tokens securely.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#09090b] hover:bg-[#c5a880] hover:text-[#09090b] px-9 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
              >
                Set Up Booking Calendar
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
                Streamlined Bookings to Keep Your <span className="italic text-[#c5a880]">Schedule Packed</span>
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                Deliver an effortless, premium client experience right from the first point of contact.
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
                Easy Booking
              </span>
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-light mt-6">
                The Friction-free Booking <span className="italic text-[#c5a880]">Workflow</span>
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
              Comparing Booking <span className="italic text-[#c5a880]">Workflows</span>
            </h2>

            <div className="border border-[#e3d8c8]/40 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse font-poppins">
                <thead>
                  <tr className="bg-[#09090b] text-white">
                    <th className="p-6 text-sm font-bold uppercase tracking-wider">Metric</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider text-center">Manual Scheduling</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider text-center text-[#c5a880]">Mara Photo Scheduler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3d8c8]/20">
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Booking Time</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">1-3 Days of Emails/Calls</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Under 3 Minutes</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Advance Deposit</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Manual checks or cash tracking</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Instant secure online gateway</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">Double Bookings</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Frequent calendar slipups</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Zero (automatic blocking)</td>
                  </tr>
                  <tr>
                    <td className="p-6 text-sm font-bold text-slate-800">No-show Reminders</td>
                    <td className="p-6 text-sm text-gray-500 text-center font-medium">Manual typing on WhatsApp</td>
                    <td className="p-6 text-sm text-center font-bold text-emerald-600 bg-emerald-50/20">Automated SMS/Email schedules</td>
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
