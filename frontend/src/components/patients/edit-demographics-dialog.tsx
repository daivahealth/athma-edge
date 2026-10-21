import { useState, useEffect } from 'react';
import { useUpdateTempPatient } from '@/modules/patients/hooks';
import { CARE_SETTINGS, CARE_SETTING_LABELS } from '@/lib/utils/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface EditDemographicsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mrn: string;
  patient: {
    patientName: string;
    gender: string | null;
    dateOfBirth: string | null;
    age: string | null;
    mobileNumber: string | null;
    careSetting: string;
    wardName: string | null;
    bedNumber: string | null;
    consultantName: string | null;
  };
}

export function EditDemographicsDialog({ open, onOpenChange, mrn, patient }: EditDemographicsDialogProps) {
  const mutation = useUpdateTempPatient(mrn);
  const [form, setForm] = useState({
    patientName: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    mobileNumber: '',
    careSetting: 'EMERGENCY',
    wardName: '',
    bedNumber: '',
    consultantName: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        patientName: patient.patientName || '',
        gender: patient.gender || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
        age: patient.age || '',
        mobileNumber: patient.mobileNumber || '',
        careSetting: patient.careSetting || 'EMERGENCY',
        wardName: patient.wardName || '',
        bedNumber: patient.bedNumber || '',
        consultantName: patient.consultantName || '',
      });
    }
  }, [open, patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, string> = {};
    if (form.patientName) data.patientName = form.patientName;
    if (form.gender) data.gender = form.gender;
    if (form.dateOfBirth) data.dateOfBirth = form.dateOfBirth;
    if (form.age) data.age = form.age;
    if (form.mobileNumber) data.mobileNumber = form.mobileNumber;
    data.careSetting = form.careSetting;
    if (form.wardName) data.wardName = form.wardName;
    if (form.bedNumber) data.bedNumber = form.bedNumber;
    if (form.consultantName) data.consultantName = form.consultantName;

    mutation.mutate(data as any, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Demographics — {mrn}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Patient Name *</label>
            <Input
              required
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Gender</label>
              <Select value={form.gender || 'NONE'} onValueChange={(v) => setForm((f) => ({ ...f, gender: v === 'NONE' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not specified</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Age</label>
              <Input
                placeholder="e.g. 34Y"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mobile</label>
              <Input
                value={form.mobileNumber}
                onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Care Setting *</label>
            <Select value={form.careSetting} onValueChange={(v) => setForm((f) => ({ ...f, careSetting: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARE_SETTINGS.map((cs) => (
                  <SelectItem key={cs} value={cs}>
                    {CARE_SETTING_LABELS[cs]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ward</label>
              <Input
                value={form.wardName}
                onChange={(e) => setForm((f) => ({ ...f, wardName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bed</label>
              <Input
                value={form.bedNumber}
                onChange={(e) => setForm((f) => ({ ...f, bedNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Consultant</label>
            <Input
              value={form.consultantName}
              onChange={(e) => setForm((f) => ({ ...f, consultantName: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {(mutation.error as any)?.response?.data?.message || 'Failed to update patient'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
