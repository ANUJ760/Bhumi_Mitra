'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Shield, BarChart3, FileText, ArrowRight, Building2, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: FileText,
      title: 'End-to-End Workflow',
      desc: 'Digital lifecycle management from proposal submission to final possession of acquired land.',
    },
    {
      icon: MapPin,
      title: 'GIS & Geo-Tagging',
      desc: 'Interactive maps with geo-tagged land parcels using MapLibre GL and PostGIS spatial data.',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      desc: 'Secure RBAC for Central Ministries, State Govts, District Authorities & Project Agencies.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      desc: 'Real-time KPIs, project tracking, compensation monitoring & R&R progress indicators.',
    },
    {
      icon: Building2,
      title: 'Multi-Agency Coordination',
      desc: 'Seamless coordination between land requiring bodies, acquiring authorities & implementing agencies.',
    },
    {
      icon: Landmark,
      title: 'Government Integration Ready',
      desc: 'API gateway placeholders for DILRMP, Bhu-Naksha, ULPIN, NIC, and Aadhaar integration.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Smart India Hackathon 2026 • PS ID: SIH26016
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold font-serif">भू</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              Bhumi Mitra
              <span className="block text-lg sm:text-xl font-medium text-emerald-700 mt-2">भूमि मित्र — National Land Acquisition Platform</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
              A unified digital platform for end-to-end orchestration, GIS visualization, and
              role-based tracking of India&apos;s infrastructure land acquisition lifecycle.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg gap-2 h-12 px-8">
                  Sign In to Platform
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-12 px-8">
                  Register as Stakeholder
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Platform Capabilities</h2>
          <p className="text-gray-500 mt-2">Digitizing the complete land acquisition lifecycle for nationwide implementation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md hover:border-emerald-100 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold font-serif">भू</span>
              </div>
              <span className="text-sm font-medium text-gray-600">Bhumi Mitra • SIH 2026</span>
            </div>
            <div className="text-xs text-gray-400">
              Built for Smart India Hackathon 2026 • Problem Statement SIH26016
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
