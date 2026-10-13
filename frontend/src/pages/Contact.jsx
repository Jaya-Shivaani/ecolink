import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send, Leaf } from 'lucide-react';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert('Please fill in all required fields.');
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-[#FBFBFA] min-h-screen pb-20">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-emerald-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Leaf className="h-4 w-4 mr-1 animate-pulse" /> Reach Out
          </span>
          <h1 id="contact-title" className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight leading-tight">
            {t('contact.title')}
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Have questions about local nurseries, bulk orders, swapping plants, or account setup? Our support team is here to help.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Panel */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white border border-organic-200 p-8 rounded-3xl shadow-xl shadow-organic-100/50 space-y-6">
              <h2 className="font-display font-bold text-2xl text-slate-900">Contact Information</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Connect with our local Kovilpatti office. We typically respond to messages and inquiries within 24 hours.
              </p>

              <div className="h-px bg-organic-100"></div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-sm">Our Head Office</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Main Road, <br />
                      Kovilpatti, Tamil Nadu - 628501
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-sm">Email Enquiries</h4>
                    <p className="text-xs text-slate-500 mt-1">support@ecolink.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-950 text-sm">Customer Helpline</h4>
                    <p className="text-xs text-slate-500 mt-1">+91 98765 43210</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded static/placeholder Map Frame */}
            <div className="rounded-3xl overflow-hidden border border-organic-200 shadow-lg h-64 bg-slate-100 relative">
              <iframe
                title="EcoLink Office Map"
                src="https://maps.google.com/maps?q=Kovilpatti,%20Tamil%20Nadu,%20India&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 grayscale opacity-80"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Interactive Form Panel */}
          <div className="lg:col-span-7 bg-white border border-organic-200 p-8 sm:p-10 rounded-3xl shadow-xl shadow-organic-100/50">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="bg-emerald-100 text-emerald-800 p-4 rounded-full">
                  <Leaf className="h-10 w-10 animate-bounce" />
                </div>
                <h3 className="font-display font-bold text-2xl text-slate-900">{t('contact.messageSent')}</h3>
                <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
                  Thank you for contacting EcoLink. A representative will get back to you at the email address provided shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-primary-800 hover:bg-primary-950 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-1">{t('contact.sendMessage')}</h3>
                  <p className="text-slate-500 text-sm">Please fill out this form to send a support request or feedback.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="name-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t('contact.yourName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t('contact.yourEmail')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. rahul@gmail.com"
                      required
                      className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="e.g. Bulk ordering enquiry"
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('contact.message')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message-input"
                    name="message"
                    rows="5"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe your inquiry in detail..."
                    required
                    className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-slate-900"
                  ></textarea>
                </div>

                <button
                  id="btn-contact-submit"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-700/10 hover:shadow-emerald-700/20 flex items-center justify-center space-x-2 text-sm"
                >
                  <Send className="h-4 w-4" />
                  <span>{t('contact.sendMessage')}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
