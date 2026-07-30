"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Phone, Mail, Clock, CheckCircle } from "lucide-react";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    isCaptchaChecked: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCaptchaToggle = () => {
    setFormData((prev) => ({
      ...prev,
      isCaptchaChecked: !prev.isCaptchaChecked,
    }));
    if (errors.captcha) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.captcha;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.isCaptchaChecked) {
      newErrors.captcha = "Please verify that you are not a robot";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Success response mockup
    setIsSubmitted(true);
  };

  return (
    <div className="bg-white min-h-screen text-[#333333] font-sans">
      {/* Breadcrumb Header */}
      <div className="border-b border-black/10 bg-[#f7f7f7]">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black/65">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-black transition">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-black">Contact Us</span>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-[1280px] px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 xl:gap-20 items-start">
          
          {/* Contact Form Area */}
          <div className="space-y-6">
            <h1 className="text-[4rem] font-bold tracking-tight text-[#111111] uppercase leading-none mb-8">
              Contact Us
            </h1>

            {isSubmitted ? (
              <div className="border border-green-200 bg-green-50/50 rounded-xl p-8 text-center space-y-4 shadow-sm animate-fade-in">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-black uppercase tracking-wide">
                  Message Sent Successfully!
                </h2>
                <p className="text-sm text-black/70 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out, {formData.name}. Our wholesale client services team will review your message and reply as soon as possible.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      subject: "",
                      message: "",
                      isCaptchaChecked: false,
                    });
                  }}
                  className="mt-4 inline-flex h-11 items-center justify-center bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-[#d93b2e] transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <label htmlFor="name-input" className="text-sm font-bold uppercase tracking-wider text-black/70">
                      Name <span className="text-[#d93b2e]">*</span>
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full h-12 border bg-white px-4 text-sm outline-none transition focus:border-black ${
                        errors.name ? "border-[#d93b2e]" : "border-black/15"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs font-semibold text-[#d93b2e]">{errors.name}</p>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label htmlFor="email-input" className="text-sm font-bold uppercase tracking-wider text-black/70">
                      Email <span className="text-[#d93b2e]">*</span>
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full h-12 border bg-white px-4 text-sm outline-none transition focus:border-black ${
                        errors.email ? "border-[#d93b2e]" : "border-black/15"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs font-semibold text-[#d93b2e]">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject field */}
                <div className="space-y-2">
                  <label htmlFor="subject-input" className="text-sm font-bold uppercase tracking-wider text-black/70">
                    Subject <span className="text-[#d93b2e]">*</span>
                  </label>
                  <input
                    id="subject-input"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full h-12 border bg-white px-4 text-sm outline-none transition focus:border-black ${
                      errors.subject ? "border-[#d93b2e]" : "border-black/15"
                    }`}
                  />
                  {errors.subject && (
                    <p className="text-xs font-semibold text-[#d93b2e]">{errors.subject}</p>
                  )}
                </div>

                {/* Message field */}
                <div className="space-y-2">
                  <label htmlFor="message-input" className="text-sm font-bold uppercase tracking-wider text-black/70">
                    Message
                  </label>
                  <textarea
                    id="message-input"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full border border-black/15 bg-white p-4 text-sm outline-none transition focus:border-black resize-y"
                  />
                </div>

                {/* ReCAPTCHA Box Mockup */}
                <div className="space-y-2">
                  <div
                    onClick={handleCaptchaToggle}
                    className={`inline-flex items-center justify-between border bg-[#f9f9f9] p-4 cursor-pointer select-none rounded-[3px] shadow-sm w-full max-w-[302px] h-[78px] transition ${
                      errors.captcha ? "border-[#d93b2e]" : "border-black/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-6 w-6 border rounded-[2px] flex items-center justify-center bg-white transition ${
                          formData.isCaptchaChecked
                            ? "border-green-500 bg-white"
                            : "border-black/20"
                        }`}
                      >
                        {formData.isCaptchaChecked && (
                          <svg
                            className="h-4 w-4 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-[13px] font-medium text-black/85">
                        I'm not a robot
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center pr-1 text-[8px] text-black/45 leading-tight font-bold">
                      <img
                        src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                        alt="reCAPTCHA"
                        className="h-6 w-6 mb-0.5 object-contain"
                      />
                      <span>reCAPTCHA</span>
                      <span className="text-[7px] text-black/35 font-normal hover:underline cursor-pointer">
                        Privacy - Terms
                      </span>
                    </div>
                  </div>
                  {errors.captcha && (
                    <p className="text-xs font-semibold text-[#d93b2e]">{errors.captcha}</p>
                  )}
                </div>

                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center bg-black px-10 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#d93b2e]"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar Section */}
          <div className="lg:border-l lg:border-black/10 lg:pl-12 xl:pl-20 space-y-10 py-2">
            
            {/* Get in touch */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold uppercase tracking-wide text-[#111111]">
                Get in touch
              </h3>
              <p className="text-sm leading-relaxed text-[#626262]">
                Feel free to reach out to us anytime – we'd love to hear from you!
              </p>
            </div>

            <hr className="border-black/10" />

            {/* The Office */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold uppercase tracking-wide text-[#111111]">
                The Office
              </h3>
              <div className="space-y-4">
                {/* Client services */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full border border-black/15 flex items-center justify-center bg-[#111111] text-white">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black/55">
                      Client Services
                    </h4>
                    <a
                      href="tel:+16152125807"
                      className="text-sm font-semibold hover:text-[#d93b2e] transition"
                    >
                      +1 (615)-212-5807
                    </a>
                  </div>
                </div>

                {/* Support Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full border border-black/15 flex items-center justify-center bg-[#111111] text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black/55">
                      Support Email
                    </h4>
                    <a
                      href="mailto:support@dazed8.com"
                      className="text-sm font-semibold hover:text-[#d93b2e] transition"
                    >
                      support@dazed8.com
                    </a>
                  </div>
                </div>

                {/* Sales Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full border border-black/15 flex items-center justify-center bg-[#111111] text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-black/55">
                      Sales Email
                    </h4>
                    <a
                      href="mailto:clientservices@dazed8.com"
                      className="text-sm font-semibold hover:text-[#d93b2e] transition"
                    >
                      clientservices@dazed8.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-black/10" />

            {/* Business Hours */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold uppercase tracking-wide text-[#111111]">
                Business Hours
              </h3>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border border-black/15 flex items-center justify-center bg-[#f7f7f7] text-[#626262]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black/55">
                    Operations
                  </h4>
                  <p className="text-sm font-semibold text-[#111111]">
                    Monday - Friday 9:00AM - 5:30PM CST
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
