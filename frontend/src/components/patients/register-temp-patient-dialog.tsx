import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTempPatient } from '@/modules/patients/hooks';
import { CARE_SETTINGS, CARE_SETTING_LABELS } from '@/lib/utils/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface RegisterTempPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterTempPatientDialog({ open, onOpenChange }: RegisterTempPatientDialogProps) {
  const navigate = useNavigate();
  const mutation = useCreateTempPatient();
  const [form, setForm] = useState({
    patientName: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    mobileNumber: '',
    careSetting: 'OUTPATIENT',
    wardName: '',
    bedNumber: '',
    consultantName: '',
  });

  const resetForm = () => {
    setForm({
      patientName: '',
      gender: '',
      dateOfBirth: '',
      age: '',
      mobileNumber: '',
      careSetting: 'OUTPATIENT',
      wardName: '',
      bedNumber: '',
      consultantName: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, string> = { patientName: form.patientName, careSetting: form.careSetting };
    if (form.gender) data.gender = form.gender;
    if (form.dateOfBirth) data.dateOfBirth = form.dateOfBirth;
    if (form.age) data.age = form.age;
    if (form.mobileNumber) data.mobileNumber = form.mobileNumber;
    if (form.wardName) data.wardName = form.wardName;
    if (form.bedNumber) data.bedNumber = form.bedNumber;
    if (form.consultantName) data.consultantName = form.consultantName;

    mutation.mutate(data as any, {
      onSuccess: (result: any) => {
        resetForm();
        onOpenChange(false);
        navigate(`/patients/${result.mrn}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register Walk-in Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Patient Name *</label>
            <Input
              required
              placeholder="Full name"
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Gender</label>
              <Select value={form.gender || 'NONE'} onValueChange={(v) => setForm((f) => ({ ...f, gender: v === 'NONE' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
                placeholder="e.g. 34Y, 6M"
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
                placeholder="Phone number"
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
                placeholder="Ward name"
                value={form.wardName}
                onChange={(e) => setForm((f) => ({ ...f, wardName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bed</label>
              <Input
                placeholder="Bed number"
                value={form.bedNumber}
                onChange={(e) => setForm((f) => ({ ...f, bedNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Consultant</label>
            <Input
              placeholder="Consultant name"
              value={form.consultantName}
              onChange={(e) => setForm((f) => ({ ...f, consultantName: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              {(mutation.error as any)?.response?.data?.message || 'Failed to register patient'}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registering...' : 'Register Patient'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
