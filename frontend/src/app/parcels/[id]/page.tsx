'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute, useAuth } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import { Parcel, Document, StageName, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { StageStatusList } from '@/components/StageStatusList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface LandRecordLookup {
  ulpin: string;
  owner_name: string;
  area_hectares: number;
  land_use: string;
  source_system: string;
}

export default function ParcelDetail({ params }: { params: { id: string } }) {
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [landRecord, setLandRecord] = useState<LandRecordLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  // Modal states
  const [activeStage, setActiveStage] = useState<StageName | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stageError, setStageError] = useState('');

  // Form states for stages
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [stageDocFile, setStageDocFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('LAND_RECORD');

  const fetchData = useCallback(async () => {
    try {
      const prcl = await apiGet<Parcel>(`/parcels/${params.id}`);
      setParcel(prcl);

      // Fetch documents for this parcel
      const docsRes = await apiGet<{ documents: Document[] } | Document[]>(`/documents?related_entity_id=${params.id}`);
      const docs = Array.isArray(docsRes) ? docsRes : docsRes?.documents || [];
      setDocuments(docs);

      // Fetch mock land record for this ULPIN if available
      if (prcl?.ulpin) {
        try {
          const rec = await apiGet<LandRecordLookup>(`/mock-gov/land-records?ulpin=${encodeURIComponent(prcl.ulpin)}`);
          setLandRecord(rec);
        } catch {
          // not found in fixture is okay
        }
      }
    } catch (error) {
      console.error('Error fetching parcel details:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const canRecord = (stageName: StageName): boolean => {
    if (!user) return false;
    if (user.role === UserRole.CENTRAL_ADMIN) return true;
    switch (stageName) {
      case StageName.NOTIFICATION:
        return user.role === UserRole.DISTRICT_AUTHORITY;
      case StageName.AWARD:
      case StageName.COMPENSATION:
        return user.role === UserRole.DISTRICT_AUTHORITY || user.role === UserRole.STATE_ADMIN;
      case StageName.RNR:
      case StageName.POSSESSION:
        return user.role === UserRole.DISTRICT_AUTHORITY;
      default:
        return false;
    }
  };

  const handleRecordEventClick = (stageName: StageName) => {
    setActiveStage(stageName);
    setFormData({});
    setStageDocFile(null);
    setStageError('');
    setModalOpen(true);
  };

  const uploadFileHelper = async (file: File, entityType: string, entityId: string, type: string): Promise<Document> => {
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('related_entity_type', entityType);
    uploadForm.append('related_entity_id', entityId);
    uploadForm.append('doc_type', type);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: uploadForm,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || 'Document upload failed');
    }
    return await res.json();
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStage) return;
    setSubmitting(true);
    setStageError('');

    try {
      let docId = formData.document_id as string | undefined;

      // If a document was attached in this stage modal, upload it first
      if (stageDocFile) {
        const uploaded = await uploadFileHelper(stageDocFile, 'parcel', params.id, `${activeStage}_EVIDENCE`);
        docId = uploaded.id;
      }

      // If document_id is required and we have documents already, fall back to first
      if (!docId && documents.length > 0) {
        docId = documents[0].id;
      }

      const payload = {
        ...formData,
        document_id: docId || undefined,
      };

      await apiPost(`/parcels/${params.id}/stages/${activeStage}`, payload);
      setModalOpen(false);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to record event';
      setStageError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    setSubmitting(true);

    try {
      await uploadFileHelper(docFile, 'parcel', params.id, docType);
      setDocUploadOpen(false);
      setDocFile(null);
      setDocType('LAND_RECORD');
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      alert(`Failed to upload document: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading parcel details...</div>;
  if (!parcel) return <div className="p-8 text-center text-gray-500">Parcel not found.</div>;

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Button variant="ghost" size="sm" className="px-0 text-gray-500 hover:text-gray-900 mb-1" onClick={() => router.push(`/projects/${parcel.project_id}`)}>
              &larr; Back to Project
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Parcel: {parcel.ulpin}</h1>
            <p className="text-gray-500 mt-0.5">{parcel.area_hectares} Hectares</p>
          </div>
          <StatusBadge status={parcel.overall_status} />
        </div>

        {landRecord && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 flex items-center justify-between">
            <div>
              <span className="font-semibold">DILRMP Verified Record:</span> Owner: <span className="font-medium">{landRecord.owner_name}</span> | Land Use: <span className="font-medium">{landRecord.land_use}</span> | Source: <span className="font-medium">{landRecord.source_system}</span>
            </div>
            <span className="bg-blue-200 text-blue-800 text-xs px-2.5 py-0.5 rounded font-medium">Mock Verified</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Acquisition Stages</CardTitle>
            </CardHeader>
            <CardContent>
              {parcel.stages && (
                <StageStatusList
                  stages={parcel.stages}
                  onRecordEvent={handleRecordEventClick}
                  canRecord={canRecord}
                />
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Parcel Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">ULPIN</div>
                <div className="font-mono font-semibold text-gray-900">{parcel.ulpin}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Area</div>
                <div className="font-semibold text-gray-900">{parcel.area_hectares} Hectares</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Acquisition Status</div>
                <div className="mt-1"><StatusBadge status={parcel.overall_status} /></div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Registered Date</div>
                <div className="font-semibold text-gray-900">{new Date(parcel.created_at).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <CardTitle className="text-lg">Attached Documents ({documents.length})</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Legal notifications, valuation certificates, compensation orders, and possession deeds</p>
            </div>
            <Button size="sm" className="bg-blue-900 hover:bg-blue-800" onClick={() => setDocUploadOpen(true)}>
              Upload Document
            </Button>
          </div>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No documents attached yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {documents.map(doc => (
                  <li key={doc.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <div className="font-medium text-gray-900">{doc.doc_type}</div>
                      <div className="text-xs text-gray-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</div>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      View File &rarr;
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Stage Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Acquisition Stage: {activeStage}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStageSubmit} className="space-y-4 mt-4">
              {stageError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  {stageError}
                </div>
              )}

              {activeStage === StageName.NOTIFICATION && (
                <>
                  <div className="space-y-2">
                    <Label>Notification Issue Date *</Label>
                    <Input type="date" required onChange={(e) => setFormData({ ...formData, notification_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Gazette Document (PDF/Image) *</Label>
                    <Input type="file" required onChange={(e) => setStageDocFile(e.target.files?.[0] || null)} />
                  </div>
                </>
              )}

              {activeStage === StageName.AWARD && (
                <>
                  <div className="space-y-2">
                    <Label>Award Declaration Date *</Label>
                    <Input type="date" required onChange={(e) => setFormData({ ...formData, award_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Award Amount (INR) *</Label>
                    <Input type="number" step="1000" required onChange={(e) => setFormData({ ...formData, award_amount: parseFloat(e.target.value) })} placeholder="e.g. 1500000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Competent Authority *</Label>
                    <Input required onChange={(e) => setFormData({ ...formData, authority: e.target.value })} placeholder="e.g. Sub-Divisional Magistrate / CALA" />
                  </div>
                  <div className="space-y-2">
                    <Label>Award Order Document *</Label>
                    <Input type="file" required onChange={(e) => setStageDocFile(e.target.files?.[0] || null)} />
                  </div>
                </>
              )}

              {activeStage === StageName.COMPENSATION && (
                <>
                  <div className="space-y-2">
                    <Label>Assessed Compensation Amount (INR) *</Label>
                    <Input type="number" step="1000" required onChange={(e) => setFormData({ ...formData, assessed_amount: parseFloat(e.target.value) })} placeholder="e.g. 1500000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Approved Amount (INR)</Label>
                    <Input type="number" step="1000" onChange={(e) => setFormData({ ...formData, approved_amount: parseFloat(e.target.value) })} placeholder="e.g. 1500000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status *</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, payment_status: val })} defaultValue="ASSESSED">
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASSESSED">Assessed</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="DISBURSED">Disbursed (Completes Stage)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.payment_status === 'DISBURSED' && (
                    <>
                      <div className="space-y-2">
                        <Label>Disbursed Amount (INR)</Label>
                        <Input type="number" step="1000" onChange={(e) => setFormData({ ...formData, disbursed_amount: parseFloat(e.target.value) })} placeholder="e.g. 1500000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Disbursement Date</Label>
                        <Input type="date" onChange={(e) => setFormData({ ...formData, disbursed_date: e.target.value })} />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeStage === StageName.RNR && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    If this parcel has zero affected families, enter 0 to auto-resolve as Not Applicable.
                  </p>
                  <div className="space-y-2">
                    <Label>Number of Affected Families</Label>
                    <Input type="number" defaultValue="0" min="0" onChange={(e) => setFormData({ ...formData, affected_families_count: parseInt(e.target.value, 10) || 0 })} />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="ent_conf"
                      className="rounded border-gray-300"
                      onChange={(e) => setFormData({ ...formData, rnr_entitlement_confirmed: e.target.checked })}
                    />
                    <Label htmlFor="ent_conf">R&R Entitlements Formally Confirmed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="resettled"
                      className="rounded border-gray-300"
                      onChange={(e) => setFormData({ ...formData, families_resettled: e.target.checked })}
                    />
                    <Label htmlFor="resettled">All Affected Families Resettled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="pkg_disb"
                      className="rounded border-gray-300"
                      onChange={(e) => setFormData({ ...formData, rnr_package_disbursed: e.target.checked })}
                    />
                    <Label htmlFor="pkg_disb">R&R Rehabilitation Package Disbursed</Label>
                  </div>
                </div>
              )}

              {activeStage === StageName.POSSESSION && (
                <>
                  <div className="space-y-2">
                    <Label>Possession Handover Date *</Label>
                    <Input type="date" required onChange={(e) => setFormData({ ...formData, possession_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Possession Certificate / Deed Document *</Label>
                    <Input type="file" required onChange={(e) => setStageDocFile(e.target.files?.[0] || null)} />
                  </div>
                </>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Record Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Document Upload Modal */}
        <Dialog open={docUploadOpen} onOpenChange={setDocUploadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document for Parcel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDocUpload} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Input required value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g. 7/12 Extract, NOC, Possession Certificate" />
              </div>
              <div className="space-y-2">
                <Label>File *</Label>
                <Input type="file" required onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
