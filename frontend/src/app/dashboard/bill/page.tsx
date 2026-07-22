'use client';
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { apiClient } from '@/lib/api';
import {
  Camera, LayoutDashboard, Calendar, Settings, CreditCard, HelpCircle,
  LogOut, Plus, Upload, Trash2, Download, ExternalLink, Shield,
  RefreshCw, Send, CheckCircle, AlertCircle, Loader, ChevronRight, FolderUp,
  X, ChevronLeft, CheckSquare, Square, ImageIcon, Film, Edit, Printer, Search,
  Users, Users2, FileText, QrCode, User, BookOpen, Receipt, FileSpreadsheet, Briefcase
} from 'lucide-react';
import CustomDatePicker from '../../../components/CustomDatePicker';


export default function BillPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    customers, setCustomers,
    team, setTeam,
    bookings, setBookings,
    quotations, setQuotations,
    bills, setBills,
    studio, setStudio,
    sessionUser,
    tickets, setTickets,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg

    
  } = context;

  const [billSubView, setBillSubView] = useState('list');
  const [newBillClient, setNewBillClient] = useState('');
  const [newBillEmail, setNewBillEmail] = useState('');
  const [newBillMobile, setNewBillMobile] = useState('');
  const [newBillEventName, setNewBillEventName] = useState('');
  const [newBillEvent, setNewBillEvent] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [selectedEventCodeForBill, setSelectedEventCodeForBill] = useState('');
  const [newBillDate, setNewBillDate] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newTokenPaymentDate, setNewTokenPaymentDate] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Cash');
  const [newBillAdvance, setNewBillAdvance] = useState('');
  const [newBillStatus, setNewBillStatus] = useState('Pending');
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingBill, setEditingBill] = useState<any>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/event/my');
        if (res.data && res.data.events) {
          setEventsData(res.data.events);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (bill: any) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiClient.delete(`/dashboard/bills/${bill._id}`);
        setBills(bills.filter((b: any) => b._id !== bill._id));
        setSuccessMsg('Invoice deleted successfully');
      } catch (err) {
        setErrorMsg('Failed to delete invoice');
      }
    }
  };

  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    setNewBillClient(bill.clientName || bill.client || '');
    setNewBillEmail(bill.clientEmail || '');
    setNewBillMobile(bill.clientMobile || '');
    setNewBillEventName(bill.eventName || '');
    setNewEventDate(bill.eventDate ? bill.eventDate.split('T')[0] : '');
    setNewBillDate(bill.issueDate ? bill.issueDate.split('T')[0] : (bill.date || ''));
    setNewBillAmount(bill.amount?.toString() || '');
    setNewBillAdvance(bill.advance?.toString() || '');
    setNewTokenPaymentDate(bill.tokenPaymentDate ? bill.tokenPaymentDate.split('T')[0] : '');
    setNewPaymentMethod(bill.paymentMethod || 'Cash');
    setNewBillStatus(bill.status || 'Pending');
    setBillSubView('edit');
  };

  const printBill = (billData: any) => {
    const studioName = studio?.name || 'Mara Photo';
    const studioLogo = studio?.logoUrl || '';
    const studioEmail = sessionUser?.email || '';
    const studioPhone = sessionUser?.phone || sessionUser?.mobile || '';
    const clientName = billData.clientName || billData.client || '';
    const amount = billData.amount || 0;
    const advance = billData.advance || 0;
    const balance = Math.max(0, amount - advance);
    const billDate = new Date(billData.issueDate || billData.date || Date.now());
    const billNumber = billData.invoiceNo || billData.id || `INV-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    const eventName = billData.eventName || 'Photography / Videography Services';
    const status = billData.status || 'Pending';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill - ${clientName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Inter', -apple-system, sans-serif; background: #f8f7f4; color: #1e293b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .invoice-page { max-width: 800px; margin: 0 auto; background: white; min-height: 100vh; position: relative; }
              .invoice-header { background: linear-gradient(135deg, #0c0c0e 0%, #1a1a2e 100%); color: white; padding: 40px 48px; display: flex; justify-content: space-between; align-items: flex-start; }
              .studio-info { display: flex; align-items: center; gap: 16px; }
              .studio-logo { width: 56px; height: 56px; border-radius: 14px; object-fit: contain; background: rgba(255,255,255,0.08); padding: 6px; border: 1px solid rgba(197,168,128,0.3); }
              .studio-name { font-size: 22px; font-weight: 800; letter-spacing: 0.02em; }
              .studio-email { font-size: 11px; font-weight: 500; color: #c5a880; margin-top: 4px; letter-spacing: 0.03em; }
              .invoice-badge { text-align: right; }
              .invoice-badge h2 { font-size: 28px; font-weight: 900; letter-spacing: 0.08em; color: #c5a880; text-transform: uppercase; }
              .invoice-badge .quote-num { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.5); margin-top: 6px; letter-spacing: 0.05em; }
              .invoice-meta { display: flex; justify-content: space-between; padding: 32px 48px; border-bottom: 1px solid #f1f0ed; }
              .meta-block h4 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; margin-bottom: 8px; }
              .meta-block p { font-size: 14px; font-weight: 600; color: #1e293b; }
              .invoice-table { padding: 0 48px; margin-top: 24px; }
              table { width: 100%; border-collapse: collapse; }
              thead th { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; padding: 12px 16px; text-align: left; border-bottom: 2px solid #f1f0ed; }
              thead th:last-child { text-align: right; }
              tbody td { padding: 16px 16px; border-bottom: 1px solid #f8f7f4; vertical-align: top; }
              tbody td:last-child { text-align: right; font-weight: 700; white-space: nowrap; }
              .item-name { font-size: 14px; font-weight: 600; color: #1e293b; }
              .item-num { font-size: 12px; font-weight: 500; color: #94a3b8; }
              .item-price { font-size: 14px; font-weight: 700; color: #1e293b; }
              .invoice-total { padding: 24px 48px; margin-top: 16px; }
              .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
              .total-row.grand { border-top: 2px solid #0c0c0e; margin-top: 8px; padding-top: 16px; }
              .total-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
              .total-value { font-size: 14px; font-weight: 700; color: #1e293b; }
              .grand .total-label { font-size: 14px; font-weight: 800; color: #0c0c0e; }
              .grand .total-value { font-size: 28px; font-weight: 900; color: #c5a880; }
              .invoice-footer { margin-top: 48px; padding: 32px 48px; border-top: 1px solid #f1f0ed; display: flex; justify-content: space-between; align-items: flex-end; }
              .footer-note { font-size: 11px; font-weight: 500; color: #94a3b8; line-height: 1.7; max-width: 340px; }
              .footer-brand { text-align: right; }
              .footer-brand .brand-name { font-size: 16px; font-weight: 800; color: #c5a880; letter-spacing: 0.04em; }
              .footer-brand .brand-tagline { font-size: 9px; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 4px; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
              .status-pending { background: #fef3c7; color: #92400e; }
              .status-paid { background: #d1fae5; color: #065f46; }
              .status-overdue { background: #fee2e2; color: #991b1b; }
              @media print { @page { margin: 0; } body { padding: 15mm; background: white; } .invoice-page { max-width: 100%; box-shadow: none; } }
            </style>
          </head>
          <body>
            <div class="invoice-page">
              <div class="invoice-header">
                <div class="studio-info">
                  ${studioLogo ? `<img src="${studioLogo}" class="studio-logo" alt="Logo" />` : `<div class="studio-logo" style="display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#c5a880;">${studioName.charAt(0)}</div>`}
                  <div>
                    <div class="studio-name">${studioName}</div>
                    ${studioEmail ? `<div class="studio-email">${studioEmail}</div>` : ''}
                    ${studioPhone ? `<div class="studio-email">${studioPhone}</div>` : ''}
                  </div>
                </div>
                <div class="invoice-badge">
                  <h2>Bill</h2>
                  <div class="quote-num">${billNumber}</div>
                </div>
              </div>
              <div class="invoice-meta">
                <div class="meta-block">
                  <h4>Client Name</h4>
                  <p>${clientName}</p>
                </div>
                <div class="meta-block">
                  <h4>Bill Date</h4>
                  <p>${billDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <div class="meta-block">
                  <h4>Status</h4>
                  <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                </div>
              </div>
              <div class="invoice-table">
                <table>
                  <thead>
                    <tr>
                      <th style="width:40px">#</th>
                      <th>Description</th>
                      <th style="text-align:right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="item-num">01</td>
                      <td>
                        <div class="item-name">${eventName}</div>
                      </td>
                      <td class="item-price">₹${Number(amount).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="invoice-total">
                <div class="total-row">
                  <span class="total-label">Subtotal</span>
                  <span class="total-value">₹${Number(amount).toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                  <span class="total-label" style="color: #065f46">Advance / Token Paid</span>
                  <span class="total-value" style="color: #065f46">- ₹${Number(advance).toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row grand">
                  <span class="total-label">Balance Due</span>
                  <span class="total-value">₹${Number(balance).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div class="invoice-footer">
                <div class="footer-note">
                  Thank you for choosing <strong>${studioName}</strong>.<br/>
                  This is a computer-generated bill for <strong>${clientName}</strong>. For any queries, please contact us at <strong>${studioEmail || 'our studio'}</strong>.
                </div>
                <div class="footer-brand">
                  <div class="brand-name">${studioName}</div>
                  <div class="brand-tagline">Professional Photography</div>
                </div>
              </div>
            </div>
            <script>window.onload = () => window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrintExisting = (bill: any) => {
    printBill(bill);
  };

  const resetForm = () => {
    setEditingBill(null);
    setNewBillClient(''); setNewBillEmail(''); setNewBillMobile(''); setNewBillEventName('');
    setNewEventDate(''); setNewTokenPaymentDate(''); setNewPaymentMethod('Cash');
    setNewBillDate(''); setNewBillAmount(''); setNewBillAdvance(''); 
    setSelectedEventCodeForBill('');
    setBillSubView('list');
  };

  const filteredBills = bills.filter((bill: any) => {
    const searchLower = searchQuery.toLowerCase();
    const dateStr = (bill.issueDate || bill.date || '').split('T')[0];
    const amountStr = (bill.amount || 0).toString();
    const matchesSearch = (bill.clientName || bill.client || '').toLowerCase().includes(searchLower) ||
                          (bill.invoiceNo || bill.id || '').toLowerCase().includes(searchLower) ||
                          (bill.status || '').toLowerCase().includes(searchLower) ||
                          dateStr.includes(searchLower) ||
                          amountStr.includes(searchLower);
    
    const matchesFilter = filterStatus === 'All' || bill.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const pendingAmount = bills.filter((b: any) => b.status === 'Pending').reduce((acc: number, b: any) => acc + (b.balance || 0), 0);
  const overdueAmount = bills.filter((b: any) => b.status === 'Overdue').reduce((acc: number, b: any) => acc + (b.balance || 0), 0);
  const paidAmount = bills.reduce((acc: number, b: any) => {
    if (b.status === 'Paid') return acc + (b.amount || 0);
    return acc + (b.advance || 0);
  }, 0);

  const handleSaveInvoice = async (shouldPrint: boolean) => {
    if (!newBillClient) return;
    const totalVal = parseFloat(newBillAmount) || 0;
    const advVal = parseFloat(newBillAdvance) || 0;
    const balVal = Math.max(0, totalVal - advVal);
    
    try {
      const reqBody = {
        clientName: newBillClient,
        clientEmail: newBillEmail,
        clientMobile: newBillMobile,
        eventName: newBillEventName,
        eventDate: newEventDate ? newEventDate : undefined,
        invoiceNo: `INV-2026-${String(bills.length + 101).padStart(3, '0')}`,
        amount: totalVal,
        advance: advVal,
        tokenPaymentDate: newTokenPaymentDate ? newTokenPaymentDate : undefined,
        paymentMethod: newPaymentMethod,
        balance: balVal,
        issueDate: newBillDate ? newBillDate : undefined,
        status: newBillStatus || 'Pending'
      };
      
      let finalData;
      if (billSubView === 'edit' && editingBill) {
        const res = await apiClient.put(`/dashboard/bills/${editingBill._id}`, reqBody);
        setBills(bills.map((b: any) => b._id === editingBill._id ? res.data : b));
        finalData = res.data;
      } else {
        const res = await apiClient.post('/dashboard/bills', reqBody);
        setBills([res.data, ...bills]);
        finalData = res.data;
      }
      
      if (shouldPrint) {
        printBill(finalData);
        resetForm();
      } else {
        setSuccessMsg(billSubView === 'edit' ? 'Invoice updated successfully!' : 'Invoice created successfully!');
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(billSubView === 'edit' ? 'Failed to update invoice' : 'Failed to create invoice');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8">
      <div className="flex flex-col gap-6 font-poppins text-left">
            {billSubView === 'list' ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Invoices & Billing Log</h1>
                    <p className="text-xs text-slate-450 mt-1 font-semibold">Generate professional invoices, track due balances, and log client payouts.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] shadow-sm transition-colors cursor-pointer"
                      >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search bills..."
                        className="w-full sm:w-56 bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-9 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] pr-8 shadow-sm transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-400 focus:outline-none cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => setBillSubView('add')} className="bg-[#c5a880] hover:bg-white text-[#09090b] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0 w-full sm:w-auto">
                      <Receipt className="h-4 w-4" /> Create Invoice
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/40 border border-amber-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{pendingAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/40 border border-emerald-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Paid Amount (Received)</p>
                    <p className="text-2xl font-black text-slate-900">₹{paidAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/40 border border-rose-200 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Overdue Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{overdueAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white/30 border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-center border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/[0.03] text-slate-350 uppercase tracking-wider font-black">
                        <th className="p-4 text-center">Invoice ID</th>
                        <th className="p-4 text-center">Billed Client</th>
                        <th className="p-4 text-center">Issue Date</th>
                        <th className="p-4 text-center">Total Amount</th>
                        <th className="p-4 text-slate-900 text-center">Token Paid</th>
                        <th className="p-4 text-rose-450 text-center">Balance Left</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredBills.map((invoice: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#c5a880] text-center">{invoice.invoiceNo || invoice.id}</td>
                          <td className="p-4 font-bold text-slate-900 text-center">{invoice.clientName || invoice.client}</td>
                          <td className="p-4 font-semibold text-slate-600 text-center">{(invoice.issueDate || invoice.date)?.split('T')[0]}</td>
                          <td className="p-4 font-black text-slate-900 text-center">₹{invoice.amount?.toLocaleString()}</td>
                          <td className="p-4 font-bold text-[#c5a880] text-center">₹{(invoice.advance || 0).toLocaleString()}</td>
                          <td className="p-4 font-black text-rose-400 text-center">₹{(invoice.balance || 0).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => handlePrintExisting(invoice)} className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm" title="Print Invoice">
                              <Printer className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(invoice)} className="p-1.5 bg-slate-100 text-slate-400 hover:text-[#c5a880] hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm" title="Edit Invoice">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(invoice)} className="p-1.5 bg-rose-50 text-rose-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-rose-200 shadow-sm" title="Delete Invoice">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredBills.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            No invoices found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full relative">
                <button onClick={resetForm} className="absolute top-0 left-0 inline-flex w-fit items-center gap-1.5 px-4 py-2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 hover:text-slate-700 text-[11px] font-black uppercase tracking-wider rounded-xl border border-transparent transition-all duration-300 shadow-md hover:shadow-lg group cursor-pointer z-10">
                  <span className="group-hover:-translate-x-1 transition-transform duration-300 text-base leading-none">←</span> 
                  <span>Back to Bills</span>
                </button>
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 pt-14">
                  <div className="flex items-center justify-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 text-center">{billSubView === 'edit' ? 'Edit Invoice' : 'Create Invoice'}</h1>
                  </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveInvoice(false); }} className=" bg-[#f8f7f4] text-slate-900 border border-slate-200 p-8 rounded-2xl flex flex-col gap-4 text-left shadow-sm">
                  
                  {/* Select Event */}
                  {billSubView !== 'edit' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select Event</label>
                    <select
                      value={selectedEventCodeForBill}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedEventCodeForBill(val);
                        const ev = eventsData.find(event => event._id === val || event.code === val);
                        if (ev) {
                          setNewBillClient(ev.clientName || '');
                          setNewBillEmail(ev.clientEmail || '');
                          setNewBillMobile(ev.clientMobile || '');
                          setNewBillEventName(ev.name || '');
                          setNewBillDate(new Date().toISOString().split('T')[0]);
                          setNewEventDate(ev.date ? ev.date.split('T')[0] : '');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option className="bg-[#f8f7f4] text-slate-900" value="">Select Event...</option>
                      {eventsData.map((ev) => (
                        <option className="bg-[#f8f7f4] text-slate-900" key={ev._id} value={ev._id}>{ev.name} ({ev.clientName})</option>
                      ))}
                    </select>
                  </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client Name</label>
                    <input type="text" required value={newBillClient} onChange={(e) => setNewBillClient(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client Email</label>
                      <input type="email" value={newBillEmail} onChange={(e) => setNewBillEmail(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Client Mobile</label>
                      <input type="tel" value={newBillMobile} onChange={(e) => setNewBillMobile(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Event Name</label>
                      <input type="text" value={newBillEventName} onChange={(e) => setNewBillEventName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Event Date</label>
                      <CustomDatePicker type="date" value={newEventDate} onChange={(val) => setNewEventDate(val)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Invoice Date</label>
                      <CustomDatePicker type="date" required value={newBillDate} onChange={(val) => setNewBillDate(val)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Amount (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input type="number" required value={newBillAmount} onChange={(e) => setNewBillAmount(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Token / Advance Paid (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input type="number" value={newBillAdvance} onChange={(e) => setNewBillAdvance(e.target.value)}  className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Token Date</label>
                      <CustomDatePicker type="date" value={newTokenPaymentDate} onChange={(val) => setNewTokenPaymentDate(val)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Method</label>
                      <select value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Balance Left / Due (Auto)</label>
                      <div className="w-full bg-white/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-350 font-bold font-mono">
                        ₹{(Math.max(0, (parseFloat(newBillAmount) || 0) - (parseFloat(newBillAdvance) || 0))).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Invoice status</label>
                      <select value={newBillStatus} onChange={(e) => setNewBillStatus(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#c5a880]">
                        <option className="bg-[#f8f7f4] text-slate-900" value="Pending">Pending</option>
                        <option className="bg-[#f8f7f4] text-slate-900" value="Paid">Paid</option>
                        <option className="bg-[#f8f7f4] text-slate-900" value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-900 font-bold py-3.5 rounded-lg text-xs cursor-pointer transition-colors shadow-md">
                      Save Invoice
                    </button>
                    <button type="button" onClick={() => handleSaveInvoice(true)} className="flex-1 bg-[#c5a880] hover:bg-[#b09672] text-[#09090b] font-bold py-3.5 rounded-lg text-xs cursor-pointer transition-colors shadow-md">
                      Save & Print Invoice
                    </button>
                  </div>
                </form>
              </div>
              </div>
            )}



          </div>
    </div>
  );
}
