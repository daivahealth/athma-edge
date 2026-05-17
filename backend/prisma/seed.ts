import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'default-tenant';
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  const roles = [
    { roleCode: 'DOCTOR', roleName: 'Doctor' },
    { roleCode: 'NURSE', roleName: 'Nurse' },
    { roleCode: 'ADMIN', roleName: 'Administrator' },
  ];

  const createdRoles: Record<string, bigint> = {};

  for (const role of roles) {
    const upserted = await prisma.bcpRole.upsert({
      where: {
        uq_role_tenant_role_code: {
          tenantId: TENANT_ID,
          roleCode: role.roleCode,
        },
      },
      update: {
        roleName: role.roleName,
      },
      create: {
        tenantId: TENANT_ID,
        roleCode: role.roleCode,
        roleName: role.roleName,
      },
    });
    createdRoles[role.roleCode] = upserted.id;
    console.log(`  Role: ${role.roleCode} (id=${upserted.id})`);
  }

  const adminPassword = await bcrypt.hash('BcpAdmin@2024', BCRYPT_ROUNDS);

  const adminUser = await prisma.bcpUser.upsert({
    where: {
      uq_user_tenant_username: {
        tenantId: TENANT_ID,
        username: 'admin',
      },
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      email: 'admin@hospital.local',
    },
  });
  console.log(`  Admin user: ${adminUser.username} (id=${adminUser.id})`);

  const adminRoleId = createdRoles['ADMIN'];
  await prisma.bcpUserRole.upsert({
    where: {
      uq_user_role_tenant_user_role: {
        tenantId: TENANT_ID,
        userId: adminUser.id,
        roleId: adminRoleId,
      },
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      userId: adminUser.id,
      roleId: adminRoleId,
    },
  });
  console.log(`  Assigned ADMIN role to ${adminUser.username}`);

  // ─── Patients ───────────────────────────────────────────────────────────────

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const SOURCE = 'ATHMA_HIS';

  const patients = [
    {
      mrn: 'MRN-10001', uhid: 'UHID-50001', patientId: 'PID-1001',
      patientName: 'Rajesh Kumar Sharma', dateOfBirth: new Date('1965-03-15'), age: '61Y', gender: 'Male',
      mobileNumber: '+91-9876543210', careSetting: 'INPATIENT' as const,
      wardName: 'ICU', bedNumber: 'ICU-01', unitName: 'Critical Care',
      consultantId: 'DOC-201', consultantName: 'Dr. Anand Krishnan',
      encounterId: 'ENC-30001', visitNumber: 'V-40001',
      admissionDatetime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      encounterStatus: 'ACTIVE', isMlc: false,
    },
    {
      mrn: 'MRN-10002', uhid: 'UHID-50002', patientId: 'PID-1002',
      patientName: 'Priya Nair', dateOfBirth: new Date('1988-07-22'), age: '37Y', gender: 'Female',
      mobileNumber: '+91-9876543211', careSetting: 'INPATIENT' as const,
      wardName: 'General Ward A', bedNumber: 'GWA-12', unitName: 'Medicine',
      consultantId: 'DOC-202', consultantName: 'Dr. Meera Suresh',
      encounterId: 'ENC-30002', visitNumber: 'V-40002',
      admissionDatetime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      encounterStatus: 'ACTIVE', isMlc: false,
    },
    {
      mrn: 'MRN-10003', uhid: 'UHID-50003', patientId: 'PID-1003',
      patientName: 'Mohammed Ali Khan', dateOfBirth: new Date('1972-11-08'), age: '53Y', gender: 'Male',
      mobileNumber: '+91-9876543212', careSetting: 'INPATIENT' as const,
      wardName: 'Surgical Ward', bedNumber: 'SW-05', unitName: 'Surgery',
      consultantId: 'DOC-203', consultantName: 'Dr. Vikram Patel',
      encounterId: 'ENC-30003', visitNumber: 'V-40003',
      admissionDatetime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      encounterStatus: 'ACTIVE', isMlc: true,
    },
    {
      mrn: 'MRN-10004', uhid: 'UHID-50004', patientId: 'PID-1004',
      patientName: 'Lakshmi Devi Reddy', dateOfBirth: new Date('1955-01-30'), age: '71Y', gender: 'Female',
      mobileNumber: '+91-9876543213', careSetting: 'INPATIENT' as const,
      wardName: 'Cardiology Ward', bedNumber: 'CW-03', unitName: 'Cardiology',
      consultantId: 'DOC-204', consultantName: 'Dr. Sanjay Gupta',
      encounterId: 'ENC-30004', visitNumber: 'V-40004',
      admissionDatetime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      encounterStatus: 'ACTIVE', isMlc: false,
    },
    {
      mrn: 'MRN-10005', uhid: 'UHID-50005', patientId: 'PID-1005',
      patientName: 'Suresh Menon', dateOfBirth: new Date('1980-09-12'), age: '45Y', gender: 'Male',
      mobileNumber: '+91-9876543214', careSetting: 'OUTPATIENT' as const,
      wardName: null, bedNumber: null, unitName: 'Orthopaedics OPD',
      consultantId: 'DOC-205', consultantName: 'Dr. Ramesh Babu',
      encounterId: 'ENC-30005', visitNumber: 'V-40005',
      admissionDatetime: null, visitStartDatetime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      encounterStatus: 'CHECKED_IN', appointmentStatus: 'ARRIVED', isMlc: false,
    },
    {
      mrn: 'MRN-10006', uhid: 'UHID-50006', patientId: 'PID-1006',
      patientName: 'Anitha Thomas', dateOfBirth: new Date('1992-04-18'), age: '34Y', gender: 'Female',
      mobileNumber: '+91-9876543215', careSetting: 'OUTPATIENT' as const,
      wardName: null, bedNumber: null, unitName: 'Gynaecology OPD',
      consultantId: 'DOC-206', consultantName: 'Dr. Kavitha Rajan',
      encounterId: 'ENC-30006', visitNumber: 'V-40006',
      admissionDatetime: null, visitStartDatetime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      encounterStatus: 'REGISTERED', appointmentStatus: 'REGISTERED', isMlc: false,
    },
    {
      mrn: 'MRN-10007', uhid: 'UHID-50007', patientId: 'PID-1007',
      patientName: 'Deepak Verma', dateOfBirth: new Date('1978-06-25'), age: '47Y', gender: 'Male',
      mobileNumber: '+91-9876543216', careSetting: 'DAYCARE' as const,
      wardName: 'Day Care Unit', bedNumber: 'DC-02', unitName: 'Oncology',
      consultantId: 'DOC-207', consultantName: 'Dr. Pooja Sharma',
      encounterId: 'ENC-30007', visitNumber: 'V-40007',
      admissionDatetime: null, visitStartDatetime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      encounterStatus: 'ACTIVE', isMlc: false,
    },
    {
      mrn: 'MRN-10008', uhid: 'UHID-50008', patientId: 'PID-1008',
      patientName: 'Fatima Begum', dateOfBirth: new Date('1948-12-05'), age: '77Y', gender: 'Female',
      mobileNumber: '+91-9876543217', careSetting: 'EMERGENCY' as const,
      wardName: 'Emergency', bedNumber: 'ER-04', unitName: 'Emergency Medicine',
      consultantId: 'DOC-208', consultantName: 'Dr. Arun George',
      encounterId: 'ENC-30008', visitNumber: 'V-40008',
      admissionDatetime: null, visitStartDatetime: new Date(now.getTime() - 30 * 60 * 1000),
      encounterStatus: 'TRIAGED', isMlc: false,
    },
    {
      mrn: 'MRN-10009', uhid: 'UHID-50009', patientId: 'PID-1009',
      patientName: 'Arjun Pillai', dateOfBirth: new Date('2000-02-14'), age: '26Y', gender: 'Male',
      mobileNumber: '+91-9876543218', careSetting: 'EMERGENCY' as const,
      wardName: 'Emergency', bedNumber: 'ER-07', unitName: 'Emergency Medicine',
      consultantId: 'DOC-208', consultantName: 'Dr. Arun George',
      encounterId: 'ENC-30009', visitNumber: 'V-40009',
      admissionDatetime: null, visitStartDatetime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      encounterStatus: 'ACTIVE', isMlc: true,
    },
    {
      mrn: 'MRN-10010', uhid: 'UHID-50010', patientId: 'PID-1010',
      patientName: 'Geeta Bose', dateOfBirth: new Date('1960-08-20'), age: '65Y', gender: 'Female',
      mobileNumber: '+91-9876543219', careSetting: 'OUTPATIENT' as const,
      wardName: null, bedNumber: null, unitName: 'ENT OPD',
      consultantId: 'DOC-209', consultantName: 'Dr. Nikhil Das',
      encounterId: 'ENC-30010', visitNumber: 'V-40010',
      admissionDatetime: null, visitStartDatetime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      encounterStatus: 'CHECKED_IN', appointmentStatus: 'ACTIVE', isMlc: false,
    },
  ];

  for (const p of patients) {
    await prisma.bcpActivePatient.upsert({
      where: {
        uq_active_patient_tenant_source_mrn_visit: {
          tenantId: TENANT_ID,
          sourceSystem: SOURCE,
          mrn: p.mrn,
          visitNumber: p.visitNumber,
        },
      },
      update: { lastSyncedAt: now },
      create: {
        tenantId: TENANT_ID,
        sourceSystem: SOURCE,
        patientId: p.patientId,
        mrn: p.mrn,
        uhid: p.uhid,
        encounterId: p.encounterId,
        visitNumber: p.visitNumber,
        patientName: p.patientName,
        dateOfBirth: p.dateOfBirth,
        age: p.age,
        gender: p.gender,
        mobileNumber: p.mobileNumber,
        careSetting: p.careSetting,
        encounterStatus: p.encounterStatus ?? null,
        appointmentStatus: (p as any).appointmentStatus ?? null,
        businessDate: today,
        unitName: p.unitName ?? null,
        wardName: p.wardName ?? null,
        bedNumber: p.bedNumber ?? null,
        consultantId: p.consultantId,
        consultantName: p.consultantName,
        admissionDatetime: p.admissionDatetime ?? null,
        visitStartDatetime: (p as any).visitStartDatetime ?? null,
        isMlc: p.isMlc,
        isActive: true,
        activeFrom: now,
        lastSyncedAt: now,
      },
    });
  }
  console.log(`  Seeded ${patients.length} active patients`);

  // ─── Clinical Profiles ─────────────────────────────────────────────────────

  const clinicalProfiles = [
    {
      mrn: 'MRN-10001', encounterId: 'ENC-30001', visitNumber: 'V-40001',
      bloodGroup: 'B+',
      primaryDiagnosis: 'Acute Myocardial Infarction (STEMI)',
      allergies: 'Penicillin, Sulfonamides',
      highRiskFlags: 'Fall Risk, DVT Risk',
      latestVitals: {
        temperature: '98.6°F', pulse: '88 bpm', bp: '140/90 mmHg',
        spo2: '96%', rr: '18/min', gcs: '15/15',
        recordedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      },
      activeMedications: [
        { name: 'Aspirin', dose: '325mg', route: 'Oral', frequency: 'OD' },
        { name: 'Clopidogrel', dose: '75mg', route: 'Oral', frequency: 'OD' },
        { name: 'Atorvastatin', dose: '80mg', route: 'Oral', frequency: 'HS' },
        { name: 'Enoxaparin', dose: '60mg', route: 'SC', frequency: 'BD' },
        { name: 'Nitroglycerin', dose: '5mcg/min', route: 'IV', frequency: 'Continuous' },
      ],
      pendingInvestigations: [
        { test: 'Troponin I (Serial)', status: 'Pending', orderedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() },
        { test: 'Echocardiogram', status: 'Scheduled', orderedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
      ],
      criticalResults: 'Troponin I: 12.5 ng/mL (Critical High)',
      handoverNotes: 'Post-PCI Day 1. Stent to LAD. Monitor for chest pain recurrence. Next troponin at 6h.',
    },
    {
      mrn: 'MRN-10002', encounterId: 'ENC-30002', visitNumber: 'V-40002',
      bloodGroup: 'O+',
      primaryDiagnosis: 'Community Acquired Pneumonia',
      allergies: 'None known',
      highRiskFlags: null,
      latestVitals: {
        temperature: '101.2°F', pulse: '102 bpm', bp: '110/70 mmHg',
        spo2: '93%', rr: '24/min',
        recordedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      },
      activeMedications: [
        { name: 'Piperacillin-Tazobactam', dose: '4.5g', route: 'IV', frequency: 'Q8H' },
        { name: 'Azithromycin', dose: '500mg', route: 'IV', frequency: 'OD' },
        { name: 'Paracetamol', dose: '1g', route: 'IV', frequency: 'SOS (>101°F)' },
        { name: 'NS 0.9%', dose: '1000ml', route: 'IV', frequency: '@100ml/hr' },
      ],
      pendingInvestigations: [
        { test: 'Blood Culture', status: 'Sent', orderedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString() },
        { test: 'Sputum Culture', status: 'Pending', orderedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString() },
        { test: 'CRP', status: 'Pending', orderedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
      ],
      criticalResults: null,
      handoverNotes: 'Day 2 of antibiotics. O2 via nasal cannula 4L. Watch for desaturation. Escalate if SpO2 <90%.',
    },
    {
      mrn: 'MRN-10003', encounterId: 'ENC-30003', visitNumber: 'V-40003',
      bloodGroup: 'A+',
      primaryDiagnosis: 'Fracture Neck of Femur — Right (Post-op Day 2, Hemiarthroplasty)',
      allergies: 'Ibuprofen (GI upset)',
      highRiskFlags: 'Fall Risk, VTE Risk',
      latestVitals: {
        temperature: '99.0°F', pulse: '78 bpm', bp: '130/82 mmHg',
        spo2: '98%', rr: '16/min', painScore: '4/10',
        recordedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
      activeMedications: [
        { name: 'Tramadol', dose: '50mg', route: 'Oral', frequency: 'TDS' },
        { name: 'Paracetamol', dose: '1g', route: 'Oral', frequency: 'QDS' },
        { name: 'Enoxaparin', dose: '40mg', route: 'SC', frequency: 'OD' },
        { name: 'Cefuroxime', dose: '1.5g', route: 'IV', frequency: 'BD' },
      ],
      pendingInvestigations: [
        { test: 'CBC', status: 'Pending', orderedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() },
        { test: 'X-Ray Hip (Post-op)', status: 'Completed', orderedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() },
      ],
      criticalResults: null,
      handoverNotes: 'MLC case — RTA. Post-op Day 2. Physiotherapy started. Drain removed. Ambulation with walker tomorrow.',
    },
    {
      mrn: 'MRN-10004', encounterId: 'ENC-30004', visitNumber: 'V-40004',
      bloodGroup: 'AB+',
      primaryDiagnosis: 'Congestive Heart Failure (NYHA Class III)',
      allergies: 'ACE Inhibitors (Angioedema)',
      highRiskFlags: 'Fall Risk',
      latestVitals: {
        temperature: '98.2°F', pulse: '92 bpm', bp: '100/60 mmHg',
        spo2: '91%', rr: '22/min', weight: '78kg',
        recordedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      activeMedications: [
        { name: 'Furosemide', dose: '40mg', route: 'IV', frequency: 'BD' },
        { name: 'Carvedilol', dose: '6.25mg', route: 'Oral', frequency: 'BD' },
        { name: 'Spironolactone', dose: '25mg', route: 'Oral', frequency: 'OD' },
        { name: 'Sacubitril/Valsartan', dose: '50mg', route: 'Oral', frequency: 'BD' },
      ],
      pendingInvestigations: [
        { test: 'BNP', status: 'Pending', orderedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString() },
        { test: 'Renal Function Test', status: 'Pending', orderedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString() },
      ],
      criticalResults: 'BNP: 1850 pg/mL (Previous: 2200)',
      handoverNotes: 'Diuresing well. I/O chart strict. Daily weight. Target -500ml/day. Watch for renal worsening.',
    },
    {
      mrn: 'MRN-10008', encounterId: 'ENC-30008', visitNumber: 'V-40008',
      bloodGroup: 'O-',
      primaryDiagnosis: 'Acute Exacerbation of COPD',
      allergies: 'Aspirin',
      highRiskFlags: 'Fall Risk, Oxygen Dependent',
      latestVitals: {
        temperature: '99.8°F', pulse: '110 bpm', bp: '150/88 mmHg',
        spo2: '88%', rr: '28/min',
        recordedAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      },
      activeMedications: [
        { name: 'Salbutamol Nebulisation', dose: '5mg', route: 'Neb', frequency: 'Q4H' },
        { name: 'Ipratropium', dose: '500mcg', route: 'Neb', frequency: 'Q6H' },
        { name: 'Hydrocortisone', dose: '100mg', route: 'IV', frequency: 'Q8H' },
        { name: 'Azithromycin', dose: '500mg', route: 'IV', frequency: 'OD' },
      ],
      pendingInvestigations: [
        { test: 'ABG', status: 'Pending', orderedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString() },
        { test: 'Chest X-Ray', status: 'Completed', orderedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString() },
      ],
      criticalResults: 'SpO2 88% on room air',
      handoverNotes: 'ER observation. O2 via venturi mask 28%. If no improvement in 2h, consider NIV. ABG awaited.',
    },
  ];

  for (const cp of clinicalProfiles) {
    await prisma.bcpPatientClinicalProfile.create({
      data: {
        tenantId: TENANT_ID,
        sourceSystem: SOURCE,
        mrn: cp.mrn,
        encounterId: cp.encounterId,
        visitNumber: cp.visitNumber,
        bloodGroup: cp.bloodGroup,
        primaryDiagnosis: cp.primaryDiagnosis,
        allergies: cp.allergies,
        highRiskFlags: cp.highRiskFlags,
        latestVitals: cp.latestVitals,
        activeMedications: cp.activeMedications,
        pendingInvestigations: cp.pendingInvestigations,
        criticalResults: cp.criticalResults,
        handoverNotes: cp.handoverNotes,
        lastClinicalUpdateAt: new Date(now.getTime() - 30 * 60 * 1000),
        lastSyncedAt: now,
      },
    });
  }
  console.log(`  Seeded ${clinicalProfiles.length} clinical profiles`);

  // ─── PDF Documents ─────────────────────────────────────────────────────────

  const documents = [
    { mrn: 'MRN-10001', encounterId: 'ENC-30001', documentType: 'LAB_REPORT' as const, documentName: 'CBC_Report_20260515.pdf', fileSize: 45200 },
    { mrn: 'MRN-10001', encounterId: 'ENC-30001', documentType: 'LAB_REPORT' as const, documentName: 'Cardiac_Enzymes_20260515.pdf', fileSize: 38400 },
    { mrn: 'MRN-10001', encounterId: 'ENC-30001', documentType: 'RADIOLOGY_REPORT' as const, documentName: 'Chest_XRay_20260514.pdf', fileSize: 125000 },
    { mrn: 'MRN-10001', encounterId: 'ENC-30001', documentType: 'CLINICAL_SUMMARY' as const, documentName: 'Cath_Lab_Report_20260514.pdf', fileSize: 67800 },
    { mrn: 'MRN-10002', encounterId: 'ENC-30002', documentType: 'LAB_REPORT' as const, documentName: 'CBC_CRP_Report_20260516.pdf', fileSize: 42100 },
    { mrn: 'MRN-10002', encounterId: 'ENC-30002', documentType: 'RADIOLOGY_REPORT' as const, documentName: 'Chest_XRay_20260515.pdf', fileSize: 118000 },
    { mrn: 'MRN-10003', encounterId: 'ENC-30003', documentType: 'RADIOLOGY_REPORT' as const, documentName: 'XRay_Hip_PostOp_20260514.pdf', fileSize: 156000 },
    { mrn: 'MRN-10003', encounterId: 'ENC-30003', documentType: 'CLINICAL_SUMMARY' as const, documentName: 'Operative_Note_Hemiarthroplasty.pdf', fileSize: 52300 },
    { mrn: 'MRN-10003', encounterId: 'ENC-30003', documentType: 'CONSENT' as const, documentName: 'Surgical_Consent_20260511.pdf', fileSize: 31200 },
    { mrn: 'MRN-10003', encounterId: 'ENC-30003', documentType: 'NURSING_NOTE' as const, documentName: 'MLC_Documentation_20260511.pdf', fileSize: 28500 },
    { mrn: 'MRN-10004', encounterId: 'ENC-30004', documentType: 'LAB_REPORT' as const, documentName: 'BNP_RFT_Report_20260515.pdf', fileSize: 39800 },
    { mrn: 'MRN-10004', encounterId: 'ENC-30004', documentType: 'RADIOLOGY_REPORT' as const, documentName: 'Echo_Report_20260514.pdf', fileSize: 245000 },
    { mrn: 'MRN-10004', encounterId: 'ENC-30004', documentType: 'CLINICAL_SUMMARY' as const, documentName: 'Cardiology_Summary_20260515.pdf', fileSize: 58200 },
    { mrn: 'MRN-10008', encounterId: 'ENC-30008', documentType: 'RADIOLOGY_REPORT' as const, documentName: 'Chest_XRay_ER_20260516.pdf', fileSize: 132000 },
    { mrn: 'MRN-10008', encounterId: 'ENC-30008', documentType: 'LAB_REPORT' as const, documentName: 'ABG_Report_20260516.pdf', fileSize: 25600 },
  ];

  for (const doc of documents) {
    const filePath = `/data/pdfs/${TENANT_ID}/${doc.mrn}/${doc.documentType}/${doc.documentName}`;
    await prisma.bcpPatientPdfDocument.create({
      data: {
        tenantId: TENANT_ID,
        sourceSystem: SOURCE,
        mrn: doc.mrn,
        encounterId: doc.encounterId,
        documentType: doc.documentType,
        documentName: doc.documentName,
        filePath,
        fileSize: BigInt(doc.fileSize),
        checksum: `sha256-${Buffer.from(doc.documentName).toString('hex').substring(0, 32)}`,
        documentDatetime: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        lastSyncedAt: now,
      },
    });
  }
  console.log(`  Seeded ${documents.length} PDF documents`);

  // ─── Sync Status ───────────────────────────────────────────────────────────

  const syncComponents = ['ACTIVE_PATIENT', 'CLINICAL_PROFILE', 'PDF_DOCUMENT'] as const;
  for (const component of syncComponents) {
    await prisma.bcpSyncStatus.upsert({
      where: {
        uq_sync_status_tenant_component: {
          tenantId: TENANT_ID,
          syncComponent: component,
        },
      },
      update: {
        syncStatus: 'SUCCESS',
        lastSuccessfulSyncAt: now,
        lastAttemptAt: now,
        recordsProcessed: component === 'ACTIVE_PATIENT' ? BigInt(10) : component === 'CLINICAL_PROFILE' ? BigInt(5) : BigInt(15),
        recordsFailed: BigInt(0),
        errorMessage: null,
      },
      create: {
        tenantId: TENANT_ID,
        syncComponent: component,
        syncStatus: 'SUCCESS',
        lastSuccessfulSyncAt: now,
        lastAttemptAt: now,
        recordsProcessed: component === 'ACTIVE_PATIENT' ? BigInt(10) : component === 'CLINICAL_PROFILE' ? BigInt(5) : BigInt(15),
        recordsFailed: BigInt(0),
      },
    });
    console.log(`  Sync status initialized: ${component}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
