/**
 * Participant rosters per BRD Section 9.3 (QCAA), 9.4 (MWAN), 9.5 (DC).
 * Kept as a separate module so the main seed.ts stays readable.
 */

export interface SeedParticipant {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  team: string;
  stage?: "discovery" | "design" | "build" | "realization" | "completed";
}

// QCAA — 18 AI Champions, 4 teams. Names lifted directly from BRD §9.3.2.
const qcaaEmail = (n: string) =>
  `${n.toLowerCase().replace(/^(.+) (.+)$/, "$1.$2").replace(/-/g, "").replace(/[^a-z.]/g, "")}@caa.gov.qa`;

export const qcaaParticipants: SeedParticipant[] = [
  { name: "Ahmed Al-Kuwari", email: qcaaEmail("Ahmed Alkuwari"), jobTitle: "Senior Air Traffic Controller", department: "Air Navigation Services", team: "Team Skyway", stage: "build" },
  { name: "Fatima Al-Thani", email: qcaaEmail("Fatima Althani"), jobTitle: "Aviation Safety Inspector", department: "Safety & Regulation", team: "Team Skyway", stage: "build" },
  { name: "Mohammed Al-Suwaidi", email: qcaaEmail("Mohammed Alsuwaidi"), jobTitle: "Data Analyst", department: "Strategy & Performance", team: "Team Skyway", stage: "build" },
  { name: "Noura Al-Emadi", email: qcaaEmail("Noura Alemadi"), jobTitle: "Licensing Officer", department: "Personnel Licensing", team: "Team Skyway", stage: "build" },
  { name: "Khalid Al-Mohannadi", email: qcaaEmail("Khalid Almohannadi"), jobTitle: "IT Manager", department: "Information Technology", team: "Team Skyway", stage: "build" },
  { name: "Aisha Al-Naimi", email: qcaaEmail("Aisha Alnaimi"), jobTitle: "Inspection Officer", department: "Airworthiness", team: "Team Hangar", stage: "build" },
  { name: "Yousef Al-Marri", email: qcaaEmail("Yousef Almarri"), jobTitle: "Maintenance Engineer", department: "Airworthiness", team: "Team Hangar", stage: "build" },
  { name: "Maryam Al-Khater", email: qcaaEmail("Maryam Alkhater"), jobTitle: "Compliance Specialist", department: "Legal Affairs", team: "Team Hangar", stage: "build" },
  { name: "Hassan Al-Sulaiti", email: qcaaEmail("Hassan Alsulaiti"), jobTitle: "Senior Inspector", department: "Airworthiness", team: "Team Hangar", stage: "build" },
  { name: "Reem Al-Nuaimi", email: qcaaEmail("Reem Alnuaimi"), jobTitle: "Operations Manager", department: "Aerodromes", team: "Team Tower", stage: "design" },
  { name: "Ali Al-Dosari", email: qcaaEmail("Ali Aldosari"), jobTitle: "Aerodrome Inspector", department: "Aerodromes", team: "Team Tower", stage: "design" },
  { name: "Hind Al-Khalifa", email: qcaaEmail("Hind Alkhalifa"), jobTitle: "Communications Officer", department: "Public Affairs", team: "Team Tower", stage: "design" },
  { name: "Saeed Al-Hajri", email: qcaaEmail("Saeed Alhajri"), jobTitle: "Customer Service Lead", department: "Stakeholder Relations", team: "Team Tower", stage: "design" },
  { name: "Latifa Al-Mahmoud", email: qcaaEmail("Latifa Almahmoud"), jobTitle: "HR Business Partner", department: "Human Resources", team: "Team Wingspan", stage: "discovery" },
  { name: "Abdullah Al-Ansari", email: qcaaEmail("Abdullah Alansari"), jobTitle: "Finance Analyst", department: "Finance & Procurement", team: "Team Wingspan", stage: "discovery" },
  { name: "Mariam Al-Boainain", email: qcaaEmail("Mariam Alboainain"), jobTitle: "Procurement Officer", department: "Finance & Procurement", team: "Team Wingspan", stage: "discovery" },
  { name: "Omar Al-Mannai", email: qcaaEmail("Omar Almannai"), jobTitle: "Training Coordinator", department: "Training Academy", team: "Team Wingspan", stage: "discovery" },
  { name: "Dana Al-Kubaisi", email: qcaaEmail("Dana Alkubaisi"), jobTitle: "Innovation Lead", department: "Strategy & Performance", team: "Team Wingspan", stage: "discovery" },
];

// MWAN — 15 participants, 3 teams (per BRD §9.4 — names generated to fit pattern).
const mwanEmail = (n: string) =>
  `${n.toLowerCase().replace(/^(.+) (.+)$/, "$1.$2").replace(/-/g, "").replace(/[^a-z.]/g, "")}@mwan.gov.sa`;

export const mwanParticipants: SeedParticipant[] = [
  { name: "Saad Al-Otaibi", email: mwanEmail("Saad Alotaibi"), jobTitle: "Operations Manager", department: "Operations", team: "Team Cycle", stage: "design" },
  { name: "Layla Al-Qahtani", email: mwanEmail("Layla Alqahtani"), jobTitle: "Permits Lead", department: "Regulatory", team: "Team Cycle", stage: "design" },
  { name: "Faisal Al-Ghamdi", email: mwanEmail("Faisal Alghamdi"), jobTitle: "Compliance Officer", department: "Regulatory", team: "Team Cycle", stage: "design" },
  { name: "Nora Al-Shehri", email: mwanEmail("Nora Alshehri"), jobTitle: "GIS Analyst", department: "Geospatial", team: "Team Cycle", stage: "design" },
  { name: "Bandar Al-Saud", email: mwanEmail("Bandar Alsaud"), jobTitle: "Data Engineer", department: "IT", team: "Team Cycle", stage: "design" },
  { name: "Hessah Al-Dossari", email: mwanEmail("Hessah Aldossari"), jobTitle: "Field Inspector", department: "Operations", team: "Team Reuse", stage: "design" },
  { name: "Khaled Al-Harbi", email: mwanEmail("Khaled Alharbi"), jobTitle: "Senior GIS Analyst", department: "Geospatial", team: "Team Reuse", stage: "design" },
  { name: "Manal Al-Subaie", email: mwanEmail("Manal Alsubaie"), jobTitle: "Citizen Services Lead", department: "Stakeholder Engagement", team: "Team Reuse", stage: "design" },
  { name: "Tariq Al-Anezi", email: mwanEmail("Tariq Alanezi"), jobTitle: "Innovation Lead", department: "Strategy", team: "Team Reuse", stage: "design" },
  { name: "Fahad Al-Ruwaished", email: mwanEmail("Fahad Alruwaished"), jobTitle: "Policy Analyst", department: "Strategy", team: "Team Reuse", stage: "design" },
  { name: "Asma Al-Mutairi", email: mwanEmail("Asma Almutairi"), jobTitle: "Reporting Officer", department: "Operations", team: "Team Reduce", stage: "discovery" },
  { name: "Ibrahim Al-Zahrani", email: mwanEmail("Ibrahim Alzahrani"), jobTitle: "Data Analyst", department: "Strategy", team: "Team Reduce", stage: "discovery" },
  { name: "Hanan Al-Fadhli", email: mwanEmail("Hanan Alfadhli"), jobTitle: "Compliance Specialist", department: "Regulatory", team: "Team Reduce", stage: "discovery" },
  { name: "Yousef Al-Shamri", email: mwanEmail("Yousef Alshamri"), jobTitle: "Operations Coordinator", department: "Operations", team: "Team Reduce", stage: "discovery" },
  { name: "Reema Al-Nasser", email: mwanEmail("Reema Alnasser"), jobTitle: "Communications Officer", department: "Stakeholder Engagement", team: "Team Reduce", stage: "discovery" },
];

// Dubai Customs — 20 participants, 4 teams (graduated cohort, all "completed").
const dcEmail = (n: string) =>
  `${n.toLowerCase().replace(/^(.+) (.+)$/, "$1.$2").replace(/-/g, "").replace(/[^a-z.]/g, "")}@dubaicustoms.ae`;

export const dcParticipants: SeedParticipant[] = [
  { name: "Hamad Al-Maktoum", email: dcEmail("Hamad Almaktoum"), jobTitle: "Senior Trade Officer", department: "Trade Operations", team: "Team Falcon", stage: "completed" },
  { name: "Latifa Al-Mansoori", email: dcEmail("Latifa Almansoori"), jobTitle: "Customs Inspector", department: "Inspection", team: "Team Falcon", stage: "completed" },
  { name: "Rashid Al-Nuaimi", email: dcEmail("Rashid Alnuaimi"), jobTitle: "Data Scientist", department: "Innovation", team: "Team Falcon", stage: "completed" },
  { name: "Sara Al-Hashimi", email: dcEmail("Sara Alhashimi"), jobTitle: "Trade Compliance Officer", department: "Compliance", team: "Team Falcon", stage: "completed" },
  { name: "Saif Al-Falasi", email: dcEmail("Saif Alfalasi"), jobTitle: "IT Lead", department: "Technology", team: "Team Falcon", stage: "completed" },
  { name: "Aisha Al-Suwaidi", email: dcEmail("Aisha Alsuwaidi"), jobTitle: "Risk Analyst", department: "Risk", team: "Team Dhow", stage: "completed" },
  { name: "Khalifa Al-Mazrouei", email: dcEmail("Khalifa Almazrouei"), jobTitle: "Anti-Smuggling Officer", department: "Enforcement", team: "Team Dhow", stage: "completed" },
  { name: "Mariam Al-Romaithi", email: dcEmail("Mariam Alromaithi"), jobTitle: "Operations Manager", department: "Trade Operations", team: "Team Dhow", stage: "completed" },
  { name: "Salem Al-Zaabi", email: dcEmail("Salem Alzaabi"), jobTitle: "Document Specialist", department: "Trade Operations", team: "Team Dhow", stage: "completed" },
  { name: "Hessa Al-Shamsi", email: dcEmail("Hessa Alshamsi"), jobTitle: "Innovation Manager", department: "Innovation", team: "Team Dhow", stage: "completed" },
  { name: "Ahmed Al-Tayer", email: dcEmail("Ahmed Altayer"), jobTitle: "Customer Experience Lead", department: "Stakeholder Services", team: "Team Compass", stage: "completed" },
  { name: "Noor Al-Marri", email: dcEmail("Noor Almarri"), jobTitle: "Trader Helpdesk Lead", department: "Stakeholder Services", team: "Team Compass", stage: "completed" },
  { name: "Faisal Al-Owais", email: dcEmail("Faisal Alowais"), jobTitle: "Data Engineer", department: "Technology", team: "Team Compass", stage: "completed" },
  { name: "Hamda Al-Junaibi", email: dcEmail("Hamda Aljunaibi"), jobTitle: "UX Designer", department: "Innovation", team: "Team Compass", stage: "completed" },
  { name: "Abdulla Al-Ali", email: dcEmail("Abdulla Alali"), jobTitle: "Trade Analyst", department: "Trade Operations", team: "Team Compass", stage: "completed" },
  { name: "Mohammed Al-Bastaki", email: dcEmail("Mohammed Albastaki"), jobTitle: "Inspection Officer", department: "Inspection", team: "Team Anchor", stage: "completed" },
  { name: "Reem Al-Suwaidi", email: dcEmail("Reem Alsuwaidi"), jobTitle: "Senior Risk Officer", department: "Risk", team: "Team Anchor", stage: "completed" },
  { name: "Khalid Al-Mansoori", email: dcEmail("Khalid Almansoori"), jobTitle: "Data Analyst", department: "Innovation", team: "Team Anchor", stage: "completed" },
  { name: "Maitha Al-Hosani", email: dcEmail("Maitha Alhosani"), jobTitle: "Targeting Specialist", department: "Risk", team: "Team Anchor", stage: "completed" },
  { name: "Sultan Al-Ketbi", email: dcEmail("Sultan Alketbi"), jobTitle: "Operations Lead", department: "Trade Operations", team: "Team Anchor", stage: "completed" },
];
