// REUNIFY Missing Person Report Multi-Step Flow
// 5 Steps: Basic Information -> Appearance -> Contact -> Review -> Confirmation
// Creates real case record in Supabase / ReunifyDB with generated case number.

import React, { useState } from 'react';
import {
  FilePlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Shield,
  Lock,
  User,
  MapPin,
  Calendar,
  Clock,
  Shirt,
  Sparkles,
  Phone,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { db } from '../../lib/supabaseClient';
import { MissingPersonCase } from '../../types';

interface ReportCasePageProps {
  onNavigate: (tab: string, caseId?: string) => void;
}

export const ReportCasePage: React.FC<ReportCasePageProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [createdCase, setCreatedCase] = useState<MissingPersonCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    alias: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other' | 'Unknown',
    district: 'Madurai',
    lastKnownLocation: '',
    lastSeenDate: new Date().toISOString().split('T')[0],
    lastSeenTime: '18:00',
    clothingDescription: '',
    heightCm: '',
    distinguishingMarks: '',
    medicalConditions: '',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    reporterName: '',
    reporterRelationship: 'Family Member',
    reporterPhone: '',
    reporterEmail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
      if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
        errs.age = 'Valid age is required';
      }
      if (!formData.lastKnownLocation.trim()) errs.lastKnownLocation = 'Last known location is required';
      if (!formData.district.trim()) errs.district = 'District is required';
      if (!formData.lastSeenDate) errs.lastSeenDate = 'Date last seen is required';
    } else if (currentStep === 2) {
      if (!formData.clothingDescription.trim()) {
        errs.clothingDescription = 'Please describe clothing worn when last seen';
      }
      if (!formData.distinguishingMarks.trim()) {
        errs.distinguishingMarks = 'Please provide identifying marks or enter "None reported"';
      }
    } else if (currentStep === 3) {
      if (!formData.reporterName.trim()) errs.reporterName = 'Reporter name is required';
      if (!formData.reporterPhone.trim() || formData.reporterPhone.length < 8) {
        errs.reporterPhone = 'Valid contact phone number is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setIsSubmitting(true);

    try {
      const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
      const caseNumber = `CASE-2026-${randomSuffix}`;

      const newCaseRecord = await db.createCase({
        case_number: caseNumber,
        status: 'submitted',
        priority: 'high',
        full_name: formData.fullName.trim(),
        alias: formData.alias.trim() || undefined,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        last_known_location: formData.lastKnownLocation.trim(),
        district: formData.district.trim(),
        last_seen_date: formData.lastSeenDate,
        last_seen_time: formData.lastSeenTime,
        clothing_description: formData.clothingDescription.trim(),
        height_cm: formData.heightCm ? parseInt(formData.heightCm, 10) : undefined,
        distinguishing_marks: formData.distinguishingMarks.trim(),
        medical_conditions: formData.medicalConditions.trim() || undefined,
        photo_url: formData.photoUrl,
        reporter_name: formData.reporterName.trim(),
        reporter_relationship: formData.reporterRelationship,
        reporter_phone: formData.reporterPhone.trim(),
        reporter_email: formData.reporterEmail.trim() || undefined,
        data_origin: 'synthetic',
      });

      // Add initial notification
      await db.addNotification({
        case_id: newCaseRecord.id,
        title: `New Missing Person Report Registered: ${newCaseRecord.case_number}`,
        message: `Case filed for ${newCaseRecord.full_name} (${newCaseRecord.district}). Ready for autonomous source query sweep.`,
        type: 'info',
        is_read: false,
      });

      setCreatedCase(newCaseRecord);
      setStep(5);
    } catch (e) {
      console.error('Submission failed:', e);
      alert('Failed to register case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingLink = () => {
    if (!createdCase) return;
    navigator.clipboard.writeText(`${window.location.origin}/track?id=${createdCase.case_number}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Official Disaster Response Missing Person Intake</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Missing Person
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          We compare information from different shelter, hospital, and relief records to find possible matches.
          All family contact details are strictly privacy-protected.
        </p>
      </div>

      {/* Step Progress Indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Appearance' },
            { num: 3, label: 'Reporter' },
            { num: 4, label: 'Review' },
            { num: 5, label: 'Confirmed' },
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isDone
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-[#0F2942] text-white ring-4 ring-teal-500/20'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                    isCurrent ? 'text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        {/* STEP 1: BASIC INFORMATION */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 1: Missing Person Basic Details</h2>
              <p className="text-xs text-slate-500">Provide accurate identity and location markers to guide source searches.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Arun Kumar"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.fullName && <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.fullName}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Familiar Name / Alias</label>
                <input
                  type="text"
                  placeholder="e.g. Arun, Kannan"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age (Years) *</label>
                <input
                  type="number"
                  placeholder="e.g. 22"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.age ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.age && <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.age}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Madurai">Madurai</option>
                  <option value="Tiruchirappalli">Tiruchirappalli (Trichy)</option>
                  <option value="Theni">Theni</option>
                  <option value="Dindigul">Dindigul</option>
                  <option value="Cuddalore">Cuddalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Thanjavur">Thanjavur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Known Landmark / Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Sellur Vaigai Bank bridge"
                  value={formData.lastKnownLocation}
                  onChange={(e) => setFormData({ ...formData, lastKnownLocation: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.lastKnownLocation ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.lastKnownLocation && (
                  <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.lastKnownLocation}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date Last Seen *</label>
                <input
                  type="date"
                  value={formData.lastSeenDate}
                  onChange={(e) => setFormData({ ...formData, lastSeenDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Approximate Time Last Seen</label>
                <input
                  type="time"
                  value={formData.lastSeenTime}
                  onChange={(e) => setFormData({ ...formData, lastSeenTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: APPEARANCE & IDENTIFIERS */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 2: Physical Appearance & Marks</h2>
              <p className="text-xs text-slate-500">Clothing tokens and distinct anatomical scars yield high-confidence evidence matches.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clothing Worn When Last Seen *</label>
              <textarea
                rows={2}
                placeholder="e.g. Royal blue collared cotton shirt, dark navy trousers, brown sandals"
                value={formData.clothingDescription}
                onChange={(e) => setFormData({ ...formData, clothingDescription: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.clothingDescription ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.clothingDescription && (
                <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.clothingDescription}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Distinguishing Scars, Tattoos or Marks *</label>
              <textarea
                rows={2}
                placeholder="e.g. 4cm surgical scar on back of left hand near index metacarpal"
                value={formData.distinguishingMarks}
                onChange={(e) => setFormData({ ...formData, distinguishingMarks: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.distinguishingMarks ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              {errors.distinguishingMarks && (
                <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.distinguishingMarks}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Height (cm)</label>
                <input
                  type="number"
                  placeholder="e.g. 174"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical Conditions / Meds Needed</label>
                <input
                  type="text"
                  placeholder="e.g. Mild asthma, diabetic, memory loss"
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Photo reference notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs">
              <Upload className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Photo Reference Attached</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  High-resolution reference photo provided. Facial recognition is NOT automatically automated — human verification of features is strictly required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REPORTER INFORMATION */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 3: Family Contact Information</h2>
              <p className="text-xs text-slate-500">Contact details remain confidential and are never published on the public tracking portal.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name (Reporter) *</label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Kumar"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.reporterName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.reporterName && (
                  <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.reporterName}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Relationship to Missing Person *</label>
                <select
                  value={formData.reporterRelationship}
                  onChange={(e) => setFormData({ ...formData, reporterRelationship: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Parent">Parent (Father / Mother)</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Elder Brother">Elder Brother / Sister</option>
                  <option value="Child">Son / Daughter</option>
                  <option value="Relative">Other Relative</option>
                  <option value="Friend/Colleague">Friend / Colleague</option>
                  <option value="Relief Worker">Relief Worker / NGO Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91-98401-84729"
                  value={formData.reporterPhone}
                  onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.reporterPhone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.reporterPhone && (
                  <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.reporterPhone}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. family@gmail.com"
                  value={formData.reporterEmail}
                  onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>Privacy Guaranteed:</strong> Phone numbers are masked (e.g. +91-*****4729) across all public interfaces.
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 4: Review Case Information</h2>
              <p className="text-xs text-slate-500">Please confirm all information is correct before creating the official record.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Age & Gender</span>
                  <span className="font-semibold text-slate-800">{formData.age} years • {formData.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Last Seen Location</span>
                  <span className="font-semibold text-slate-800">{formData.lastKnownLocation}, {formData.district}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Date & Time</span>
                  <span className="font-semibold text-slate-800">{formData.lastSeenDate} at {formData.lastSeenTime}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Clothing Description</span>
                <span className="text-slate-800">{formData.clothingDescription}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Distinguishing Marks</span>
                <span className="text-slate-800">{formData.distinguishingMarks}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Reporter Name</span>
                  <span className="font-semibold text-slate-800">{formData.reporterName} ({formData.reporterRelationship})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Reporter Phone (Masked)</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {formData.reporterPhone.slice(0, 3)}******{formData.reporterPhone.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block">Important Notice:</span>
              Once submitted, the case is assigned a permanent tracking ID and registered into the cross-source reconciliation queue.
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRMATION */}
        {step === 5 && createdCase && (
          <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Your Case Has Been Registered</h2>
              <p className="text-sm text-slate-600 mt-1">
                The case has been successfully stored in the central disaster database and queued for cross-source reconciliation.
              </p>
            </div>

            {/* Case ID Box */}
            <div className="max-w-md mx-auto bg-slate-50 border-2 border-teal-600/30 rounded-2xl p-5 text-center">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">Official Case Tracking ID</span>
              <span className="text-3xl font-extrabold font-mono text-[#0F2942] tracking-wider block mt-1">
                {createdCase.case_number}
              </span>
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">
                Status: {createdCase.status.replace('_', ' ').toUpperCase()}
              </span>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center">
                <button
                  onClick={copyTrackingLink}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tracking Link Copied!' : 'Copy Secure Tracking Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('track', createdCase.case_number)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition shadow-md"
              >
                Track Status as Family Reporter
              </button>
              <button
                onClick={() => onNavigate('inv_case_detail', createdCase.id)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0F2942] text-white text-xs font-bold hover:bg-slate-800 transition shadow-md"
              >
                Launch Autonomous Investigation Desk
              </button>
            </div>
          </div>
        )}

        {/* Action Button Navigation (Steps 1 to 4) */}
        {step < 5 && (
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Registering Case...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Register Case</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
