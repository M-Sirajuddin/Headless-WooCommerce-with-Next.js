import React from "react";
import Link from "next/link";
import { MapPin, Award, BookOpen } from "lucide-react";

export const metadata = {
  title: "About Us | HEDY STORE",
  description: "Learn about our roots, commitment to education, and how we empower your retail business with premium cannabinoid and nicotine wholesale solutions.",
};

export default function AboutUsPage() {
  return (
    <div className="bg-white min-h-screen text-[#333333] font-sans pb-16">
      {/* Top Black Banner Banner */}
      <section className="bg-[#050505] text-white py-16 px-6 text-center select-none">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[0.25em] leading-none mb-3">
          ABOUT US
        </h1>
        <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
          Elevate Your Business with Dazed.Shop
        </p>
      </section>

      {/* Main Section */}
      <div className="mx-auto max-w-[1200px] px-6">
        
        {/* Core Values Section */}
        <section className="py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-wide mb-12">
            Our Roots and Commitment to Education
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-start">
            {/* Location Value */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full border border-black/15 flex items-center justify-center bg-white shadow-sm hover:scale-105 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                Location
              </h3>
              <p className="text-xs text-black/65 leading-relaxed max-w-[250px]">
                Based in Nashville with roots in Los Angeles.
              </p>
            </div>

            {/* Leadership Value */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full border border-black/15 flex items-center justify-center bg-white shadow-sm hover:scale-105 transition-transform duration-300">
                <Award className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                Industry Leadership
              </h3>
              <p className="text-xs text-black/65 leading-relaxed max-w-[250px]">
                Leaders in the recreational hemp industry.
              </p>
            </div>

            {/* Education Value */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full border border-black/15 flex items-center justify-center bg-white shadow-sm hover:scale-105 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">
                Commitment to Education
              </h3>
              <div className="text-xs text-black/65 leading-relaxed max-w-[280px] space-y-2">
                <p>
                  <strong>Purest Product:</strong> Providing the purest hemp-derived products.
                </p>
                <p>
                  <strong>Educational Approach:</strong> Empowering consumers through continuous education.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-black/10 my-4" />

        {/* Detailed Guidelines Section */}
        <section className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start text-left">
          
          {/* Column 1 */}
          <div className="space-y-8">
            <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-wide leading-tight">
              1. Partnering for Success: Your Gateway to Premium Wholesale Solutions
            </h3>
            
            <div className="space-y-6">
              {/* Introduction */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  A. Introduction
                </h4>
                <ul className="list-disc pl-5 text-xs text-black/65 space-y-1">
                  <li>Igniting Growth in Cannabinoid and Nicotine Industry</li>
                  <li>Your Gateway to Premium Wholesale Solutions</li>
                </ul>
              </div>

              {/* Creativity & Growth */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  B. Creativity and Growth
                </h4>
                <ul className="list-disc pl-5 text-xs text-black/65 space-y-1">
                  <li>
                    <strong>Canvas of Business:</strong> Positioning products as raw materials for business expression.
                  </li>
                  <li>
                    <strong>Scientific Excellence:</strong> Standing at the intersection of nature and innovation.
                  </li>
                </ul>
              </div>

              {/* Partnering details */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  C. Partnering for Success
                </h4>
                <ul className="list-disc pl-5 text-xs text-black/65 space-y-1">
                  <li>
                    <strong>Quality Assurance:</strong> Ensuring exceptional product quality.
                  </li>
                  <li>
                    <strong>Competitive Pricing:</strong> Offering pricing that outpaces industry standards.
                  </li>
                  <li>
                    <strong>Loyalty Program:</strong> Rewarding commitment with progressive discounts.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-8">
            <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-wide leading-tight">
              2. Empowering Your Business Journey: Partner Benefits and Support
            </h3>

            <div className="space-y-6">
              {/* Introduction */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  A. Introduction
                </h4>
                <ul className="list-disc pl-5 text-xs text-black/65 space-y-1">
                  <li>Unlocking Exclusive Advantages for Our Partners</li>
                  <li>Empowering Your Business Journey</li>
                </ul>
              </div>

              {/* Exclusive Access */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  B. Exclusive Access
                </h4>
                <ul className="list-disc pl-5 text-xs text-black/65 space-y-1">
                  <li>
                    <strong>Priority Access:</strong> Partners get exclusive access to new inventory.
                  </li>
                  <li>
                    <strong>Personalized Support:</strong> Dedicated account managers for a tailored experience.
                  </li>
                </ul>
              </div>

              {/* Collaborative Marketing */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  C. Collaborative Marketing
                </h4>
                <ul className="list-disc pl-5 text-xs text-black/65 space-y-1">
                  <li>
                    <strong>Joint Marketing Efforts:</strong> Opportunities for collaborative marketing efforts.
                  </li>
                  <li>
                    <strong>Boosting Visibility:</strong> Leveraging partnerships for increased visibility.
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
