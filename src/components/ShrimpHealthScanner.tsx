import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond } from '../types/aquaculture.ts';
import { sampleHealthImages } from '../data/seedData.ts';
import {
  ScanEye,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Microscope,
  Info,
  Loader2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  ClipboardList,
  Calculator,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Share2,
  Pill,
  Flame,
  Activity,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Printer,
  Ruler,
  Crosshair,
  Split,
  Download,
  Layers,
  X
} from 'lucide-react';

interface ShrimpHealthScannerProps {
  ponds: Pond[];
  selectedPondId: string;
}

interface AnatomyHotspot {
  id: 'whole_body' | 'gills' | 'hepatopancreas' | 'gut' | 'muscle';
  name_en: string;
  name_te: string;
  xPercent: number;
  yPercent: number;
  normal_en: string;
  normal_te: string;
  alert_en: string;
  alert_te: string;
  lesionMetric_en: string;
  lesionMetric_te: string;
}

const ANATOMY_HOTSPOTS: AnatomyHotspot[] = [
  {
    id: 'hepatopancreas',
    name_en: 'Hepatopancreas (Liver)',
    name_te: 'హెపటోపాంక్రియాస్ (కాలేయం)',
    xPercent: 30,
    yPercent: 48,
    normal_en: 'Dark brown, glistening lipid droplets, firm membrane',
    normal_te: 'ముదురు గోధుమ రంగు, నూనె బిందువులు, దృఢమైన పొర',
    alert_en: 'Pale, atrophied, shrunken (indicates EHP or EMS/AHPND)',
    alert_te: 'పాలిపోవడం, చిన్నదైపోవడం (ఈహెచ్‌పీ లేదా ఈఎంఎస్ సంకేతం)',
    lesionMetric_en: 'Tubule Lipid Droplet Density: >85% Coverage',
    lesionMetric_te: 'లిపిడ్ చుక్కల సాంద్రత: >85% నిండుగా ఉండాలి',
  },
  {
    id: 'gills',
    name_en: 'Branchial Lamellae (Gills)',
    name_te: 'రొయ్య మొప్పలు (గిల్స్)',
    xPercent: 37,
    yPercent: 57,
    normal_en: 'Pristine cream-white, unobstructed water channels',
    normal_te: 'శుభ్రమైన తెలుపు/క్రీమ్ రంగు, స్వచ్ఛమైన మొప్పలు',
    alert_en: 'Black melanin deposits, brown silt fouling, swollen tips',
    alert_te: 'నల్లటి మడ్డి పేరుకుపోవడం, నల్ల మొప్పల వ్యాధి (బ్లాక్ గిల్)',
    lesionMetric_en: 'Lamellar Melanization Index: Grade 0 (Clean)',
    lesionMetric_te: 'మెలనిన్ వ్యాప్తి స్థాయి: గ్రేడ్ 0 (పరిశుభ్రం)',
  },
  {
    id: 'gut',
    name_en: 'Midgut & Hindgut Line',
    name_te: 'ఆహార నాళం / పేగు',
    xPercent: 56,
    yPercent: 46,
    normal_en: 'Continuous dark line (>90% full of digested feed)',
    normal_te: 'నిండుగా సాగే నల్లటి ఆహారపు గీత (ఆరోగ్యకరమైన దాణా)',
    alert_en: 'White stringy faeces, broken lines, empty transparent gut',
    alert_te: 'తెల్లటి దారాలు (వైట్ గట్), తెగిపోయిన గీత, ఖాళీ పేగు',
    lesionMetric_en: 'Gut Fullness Index: 92% continuous line',
    lesionMetric_te: 'పేగు నిండుదనం: 92% ఏకధాటి గీత',
  },
  {
    id: 'muscle',
    name_en: 'Abdominal Muscle Tissue',
    name_te: 'తోక కండరం',
    xPercent: 74,
    yPercent: 52,
    normal_en: 'Clear translucent texture without cloudy opacity',
    normal_te: 'స్వచ్ఛమైన పారదర్శక కండరం, దృఢమైన ఆకృతి',
    alert_en: 'Milky opaque patches, cramping, necrosis from low DO / heat',
    alert_te: 'పాలలాంటి తెల్లటి మచ్చలు, కండరాల తిమ్మిరి, మజిల్ నెక్రోసిస్',
    lesionMetric_en: 'Muscle Translucency Index: 96% Clear',
    lesionMetric_te: 'కండర పారదర్శకత: 96% స్వచ్ఛమైనది',
  },
  {
    id: 'whole_body',
    name_en: 'Carapace & Cuticle (Shell)',
    name_te: 'తల పెంకు & బాహ్య కవచం',
    xPercent: 18,
    yPercent: 42,
    normal_en: 'Smooth, shiny hard shell, intact long antennae',
    normal_te: 'నునుపైన గట్టి పెంకు, చెక్కుచెదరని పొడవాటి మీసాలు',
    alert_en: 'Circular calcified white spots (WSSV), soft spongy shell',
    alert_te: 'గుండ్రని తెల్లటి మచ్చలు (వైట్ స్పాట్), మెత్తటి లూజ్ షెల్',
    lesionMetric_en: 'Cuticle Hardness: Shore D 75 (Post-moult Calcified)',
    lesionMetric_te: 'పెంకు కాఠిన్యం: పూర్తి స్థాయిలో కాల్సిఫైడ్',
  },
];

const DISEASE_ATLAS = [
  {
    id: 'wssv',
    code: 'WSSV',
    title_en: 'White Spot Syndrome Virus',
    title_te: 'వైట్ స్పాట్ సిండ్రోమ్ వైరస్ (తెల్ల మచ్చల వ్యాధి)',
    severity: 'critical',
    severity_label: 'Critical / అత్యవసరం',
    color: 'rose',
    image_url: '/src/assets/images/shrimp_wssv_macro_1793643802278.jpg',
    pathogen: 'Nimaviridae: Whispovirus (dsDNA, 305 kb)',
    pathogen_te: 'నిమావిరిడే: విస్పోవైరస్ (dsDNA)',
    oie_listed: true,
    pcr_primer: 'OIE Nested PCR (146 F1/R1 & 146 F2/R2, 941 bp / 521 bp)',
    symptoms_en: [
      'Circular white calcified spots (0.5 to 2.0 mm) embedded inside carapace',
      'Sudden pink-reddish body discoloration and tail fan hyperemia',
      'Lethargic shrimp swimming aimlessly along pond surface or margins',
      'Massive mortality (up to 100% within 3-7 days)',
    ],
    symptoms_te: [
      'తల పెంకు లోపలి భాగంలో 0.5 - 2 మి.మీ గుండ్రని తెల్లటి మచ్చలు',
      'రొయ్య శరీరం మరియు తోక భాగం పింక్-ఎరుపు రంగులోకి మారడం',
      'నిస్సత్తువతో రొయ్యలు చెరువు గట్ల వెంట ఉపరితలంపై తిరగడం',
      '3 నుండి 7 రోజుల్లో భారీ మరణాలు (80-100% వరకు నష్టం)',
    ],
    protocol_en:
      'Immediately seal all pond drainage sluices. Cease feeding immediately to prevent organic deterioration. Maintain maximum aeration. Do not discharge infected water into common canals. Collect and safely dispose of dead shrimp by deep burying with lime.',
    protocol_te:
      'పక్క చెరువులకు వైరస్ పాకకుండా తూము గేట్లను వెంటనే మూసివేయండి. దాణా వేయడం తక్షణమే నిలిపివేయండి. అన్ని ఏరియేటర్లు ఆన్ చేయండి. చనిపోయిన రొయ్యలను తీసి సున్నం వేసి పూడ్చిపెట్టండి.',
    lab_test_en: 'Mandatory 2-step nested PCR (OIE Protocol)',
    lab_test_te: '2-స్టెప్ నెస్టెడ్ PCR ల్యాబ్ పరీక్ష',
  },
  {
    id: 'ehp',
    code: 'EHP',
    title_en: 'Enterocytozoon hepatopenaei',
    title_te: 'ఈహెచ్‌పీ మైక్రోస్పోరిడియన్ (ఎదుగుదల నిరోధకం)',
    severity: 'high',
    severity_label: 'High Risk / అధిక ప్రమాదం',
    color: 'purple',
    image_url: '/src/assets/images/shrimp_ehp_macro_1793643845333.jpg',
    pathogen: 'Enterocytozoon hepatopenaei (Microsporidian spore 1.1 x 0.7 μm)',
    pathogen_te: 'ఎంటెరోసైటోజూన్ హెపటోపెనాయి మైక్రోస్పోరిడియన్',
    oie_listed: false,
    pcr_primer: 'SWP-PCR / LAMP Assay (Spore Wall Protein gene amplicon 514 bp)',
    symptoms_en: [
      'Severe size variation and grading disparity at DOC 40-70',
      'Shrimp consume regular feed rations but fail to gain weight',
      'Pale, atrophied hepatopancreas with reduced lipid droplets',
      'Empty or fragmented digestive tract in majority of cast-net samples',
    ],
    symptoms_te: [
      'ఒకే చెరువులో రొయ్యల సైజుల్లో తీవ్రమైన వ్యత్యాసం (కొన్ని 12g, మరికొన్ని 3g)',
      'దాణా తింటున్నా బరువు పెరగకపోవడం (వృద్ధి పూర్తిగా మందగింపు)',
      'చిన్నదై పాలిపోయిన కాలేయం (హెపటోపాంక్రియాస్)',
      'శాంప్లింగ్‌లో ఎక్కువ రొయ్యల పేగులు ఖాళీగా కనిపించడం',
    ],
    protocol_en:
      'Top-dress feed with encapsulated organic acids (formic + propionic) and Bacillus subtilis probiotics. Boost pond bottom DO (>5.0 ppm). Conduct bi-weekly size grading. Strictly source only SPF certified seed for next crop.',
    protocol_te:
      'దాణాలో ఆర్గానిక్ యాసిడ్స్ మరియు బాసిల్లస్ ప్రోబయోటిక్స్ బైండర్ కలిపి ఇవ్వండి. చెరువు అడుగున ఆక్సిజన్ 5.0 ppm పైనే ఉంచండి. నెక్స్ట్ క్రాప్‌కు ఖచ్చితంగా SPF సర్టిఫైడ్ సీడ్ మాత్రమే వాడండి.',
    lab_test_en: 'Nested PCR for EHP SWP gene + 100x light microscopy squash',
    lab_test_te: 'ఈహెచ్‌పీ SWP PCR పరీక్ష & 100x మైక్రోస్కోపీ స్క్వాష్',
  },
  {
    id: 'wfs',
    code: 'WFS',
    title_en: 'White Faeces Syndrome (WFS / White Gut)',
    title_te: 'తెల్ల పేగు వ్యాధి (వైట్ గట్ సిండ్రోమ్)',
    severity: 'high',
    severity_label: 'High Risk / అధిక ప్రమాదం',
    color: 'rose',
    image_url: '/src/assets/images/shrimp_wfs_macro_1793643814769.jpg',
    pathogen: 'Aggregated Transformed Microvilli (ATM) + Vibrio parahaemolyticus',
    pathogen_te: 'ATM మైక్రోవిల్లి & విబ్రియో బ్యాక్టీరియా',
    oie_listed: false,
    pcr_primer: 'TCBS Vibrio CFU plating + PirAB toxin gene PCR',
    symptoms_en: [
      'White stringy vermiform faecal strands floating on pond water surface',
      'Midgut line filled with opaque white or yellowish exudate',
      'Pale, soft, and liquefied hepatopancreas',
      'Reduced feed intake and loose cuticles',
    ],
    symptoms_te: [
      'చెరువు ఉపరితలంపై తెల్లటి మలపు తీగలు తేలియాడటం',
      'రొయ్య పేగులో తెల్లటి లేదా పసుపు రంగు పదార్థం నిండటం',
      'కాలేయం మెత్తబడి పాలిపోవడం',
      'దాణా తీసుకోవడం 30% నుండి 50% వరకు పడిపోవడం',
    ],
    protocol_en:
      'Reduce feed rations by 40-50% immediately. Apply gut probiotics (Lactobacillus, Bacillus coagulans) with garlic extract binder (10g/kg feed) for 5-7 days. Disinfect water with potassium monopersulfate (1 kg/acre) followed 24 hours later by multi-strain water probiotics.',
    protocol_te:
      'వెంటనే దాణాను 40-50% తగ్గించండి. దాణాలో లాక్టోబాసిల్లస్ ప్రోబయోటిక్స్ మరియు వెల్లుల్లి గుజ్జు (10g/కేజీ) కలిపి 5-7 రోజులు ఇవ్వండి. పొటాషియం మోనోపెర్‌సల్ఫేట్ (1 కేజీ/ఎకరాకు) వేసి, మరుసటి రోజు మంచి బ్యాక్టీరియా ప్రోబయోటిక్ వేయండి.',
    lab_test_en: 'Fresh gut squash for ATM + TCBS agar yellow/green colony count',
    lab_test_te: 'ఫ్రెష్ గట్ స్క్వాష్ & TCBS అగార్ విబ్రియో కౌంట్',
  },
  {
    id: 'black_gills',
    code: 'BG',
    title_en: 'Melanized Black Gills (Gill Fouling)',
    title_te: 'నల్ల మొప్పల వ్యాధి (బ్లాక్ గిల్స్)',
    severity: 'moderate',
    severity_label: 'Moderate Alert / మధ్యస్థ ప్రమాదం',
    color: 'amber',
    image_url: '/src/assets/images/shrimp_black_gill_1793643832127.jpg',
    pathogen: 'Bottom sludge toxicity, H2S, Fusarium solani & ciliate fouling',
    pathogen_te: 'అడుగు మడ్డి, హైడ్రోజన్ సల్ఫైడ్ విషవాయువు మరియు ఫంగస్/సిలియేట్స్',
    oie_listed: false,
    pcr_primer: 'Wet mount gill biopsy under 40x / 100x microscope',
    symptoms_en: [
      'Branchial lamellae turn dark brown or black due to melanin deposition',
      'Accumulation of organic sludge, detritus, and protozoan ectocommensals on gill filaments',
      'Shrimp congregate at pond margins and near aerator water streams due to hypoxia',
      'Increased respiration rate and poor feed conversion',
    ],
    symptoms_te: [
      'రొయ్య మొప్పలపై మెలనిన్ చేరి ముదురు గోధుమ లేదా నలుపు రంగులోకి మారడం',
      'మొప్పల తీగల్లో అడుగు మడ్డి, నాచు మరియు పరాన్నజీవులు చేరడం',
      'ఆక్సిజన్ అందక రొయ్యలు ఏరియేటర్ల దగ్గరకు మరియు చెరువు గట్ల మీదకు రావడం',
      'శ్వాస తీసుకోవడం కష్టమై దాణా తినడం తగ్గించడం',
    ],
    protocol_en:
      'Perform bottom sludge siphon in feeding zones. Broadcast 50-75 kg/acre agricultural zeolite or yucca extract to bind hydrogen sulfide. Increase aeration to 8 HP/acre. Dose nitrifying and Rhodobacter bottom probiotics to accelerate sludge bio-digestion.',
    protocol_te:
      'దాణా వేసే చోట్ల అడుగు మడ్డిని సైఫన్ చేయండి. హైడ్రోజన్ సల్ఫైడ్ విషవాయువును తగ్గించడానికి 50-75 కేజీల జియోలైట్ లేదా యుక్కా పౌడర్ చల్లండి. ఏరియేటర్లను పెంచండి. రోడోబాక్టర్ అడుగు ప్రోబయోటిక్స్ వేయండి.',
    lab_test_en: 'Microscopic wet-mount of gill filaments for protozoans & melanization grading',
    lab_test_te: 'మొప్పల బయాప్సీ మైక్రోస్కోపీ పరీక్ష',
  },
  {
    id: 'soft_shell',
    code: 'SS',
    title_en: 'Soft Shell Syndrome (Mineral Exhaustion)',
    title_te: 'మెత్తటి పెంకు వ్యాధి (మినరల్ లోపం)',
    severity: 'moderate',
    severity_label: 'Moderate Alert / మధ్యస్థ ప్రమాదం',
    color: 'amber',
    image_url: '/src/assets/images/shrimp_fresh_healthy',
    pathogen: 'Severe Ca:Mg ionic imbalance, low alkalinity (<100 ppm), post-molt failure',
    pathogen_te: 'నీటిలో కాల్షియం, మెగ్నీషియం అసమతుల్యత మరియు తక్కువ ఆల్కలీనిటీ',
    oie_listed: false,
    pcr_primer: 'Water ionic ICP titration for Ca, Mg, K, Na ratios',
    symptoms_en: [
      'Exoskeleton remains soft, papery, and flexible >48 hours after ecdysis (molting)',
      'Shrimp display slow swimming response and high vulnerability to cannibalism',
      'Shell shows wrinkly texture and easily separates from muscle',
      'Associated with low total alkalinity (<100 ppm) and calcium:magnesium ratio <1:3',
    ],
    symptoms_te: [
      'కుబుసం విడిచిన 48 గంటల తర్వాత కూడా పెంకు మెత్తగా, కాగితంలా ఉండటం',
      'రొయ్యలు చురుగ్గా ఈదలేక తోటి రొయ్యల దాడికి గురికావడం (కానిబాలిజం)',
      'పెంకు ముడతలు పడి కండరం నుండి విడిపోవడం',
      'నీటిలో ఆల్కలీనిటీ 100 ppm కంటే తక్కువగా ఉన్నప్పుడు వస్తుంది',
    ],
    protocol_en:
      'Apply agricultural limestone (CaCO3) @ 50 kg/acre and magnesium chloride (MgCl2) @ 25 kg/acre. Supplement feed with chelated minerals (Ca, Mg, P, K) and Vitamin C (5g/kg feed) to accelerate cuticle hardening.',
    protocol_te:
      'ఎకరాకు 50 కేజీల అగ్రికల్చర్ సున్నం (CaCO3) మరియు 25 కేజీల మెగ్నీషియం క్లోరైడ్ చల్లండి. దాణాలో చీలేటెడ్ మినరల్స్ మరియు విటమిన్-సి (5 గ్రా/కేజీ) కలిపి ఇవ్వండి.',
    lab_test_en: 'Water mineral profiling (Ca, Mg, K) & alkalinity titration',
    lab_test_te: 'నీటి మినరల్ ప్రొఫైల్ (Ca, Mg, K) & ఆల్కలీనిటీ టెస్ట్',
  },
  {
    id: 'muscle_necrosis',
    code: 'MN',
    title_en: 'Idiopathic Muscle Necrosis (IMNV / Cramping)',
    title_te: 'కండరాల క్షీణత / మజిల్ నెక్రోసిస్ (కండరం తెల్లబడటం)',
    severity: 'moderate',
    severity_label: 'Moderate Alert / మధ్యస్థ ప్రమాదం',
    color: 'blue',
    image_url: '/src/assets/images/shrimp_necrosis_macro_1793643858324.jpg',
    pathogen: 'Infectious Myonecrosis Virus (Totiviridae) / Sudden thermal shock & hypoxia',
    pathogen_te: 'IMNV వైరస్ లేదా ఆకస్మిక ఎండ వేడిమి, ఆక్సిజన్ లేమి',
    oie_listed: true,
    pcr_primer: 'RT-PCR for IMNV RNA (amplicon 428 bp)',
    symptoms_en: [
      'Milky white chalky opaque patches in the 4th, 5th, and 6th tail abdominal segments',
      'Shrimp tail becomes curled or cramped after cast-net stress or high temperatures',
      'Triggered by sudden temperature fluctuations (>4°C) or acute DO drops (<3.0 ppm)',
      'Loss of swimming equilibrium and secondary bacterial infection risk',
    ],
    symptoms_te: [
      'తోకలోని 4, 5 మరియు 6వ విభాగాల్లో పాలలా తెల్లటి మచ్చలు రావడం',
      'వల వేసినప్పుడు రొయ్యల తోక వంకర తిరిగి బిగుసుకుపోవడం (క్రాంపింగ్)',
      'ఉష్ణోగ్రత అకస్మాత్తుగా మారినప్పుడు లేదా ఆక్సిజన్ తీవ్రంగా పడిపోయినప్పుడు వస్తుంది',
      'సరిగ్గా ఈదలేక నేలవాలడం',
    ],
    protocol_en:
      'Never sample with cast nets during peak midday heat (11:00 AM - 03:00 PM). Ensure dawn DO stays above 4.8 ppm. Apply agricultural gypsum and chelated potassium to water to relieve ionic stress.',
    protocol_te:
      'ఎండ తీవ్రంగా ఉన్నప్పుడు మధ్యాహ్నం వేళల్లో విసురు వల వేయకండి. తెల్లవారుజామున ఆక్సిజన్ 4.8 ppm తగ్గకుండా చూసుకోండి. పొటాషియం మరియు జిప్సం వేయండి.',
    lab_test_en: 'Histological section of striated muscle + viral IMNV RT-PCR',
    lab_test_te: 'కండరాల హిస్టాలజీ మరియు IMNV వైరల్ RT-PCR',
  },
];

const POND_FIELD_SYMPTOMS = [
  {
    id: 'dyke_crawling',
    label_en: 'Shrimp crawling or swimming lethargically along pond dyke margins',
    label_te: 'రొయ్యలు నిస్సత్తువగా చెరువు గట్ల వెంట తిరుగుతున్నాయి',
    riskPoints: 25,
    tag: 'WSSV / DO Alert',
  },
  {
    id: 'white_faeces_floating',
    label_en: 'White stringy faeces strands floating on surface in leeward corners',
    label_te: 'చెరువు ఉపరితలంపై తెల్లటి మలపు తీగలు తేలుతున్నాయి',
    riskPoints: 20,
    tag: 'White Gut (WFS)',
  },
  {
    id: 'feed_drop',
    label_en: 'Sudden feed tray drop >25% unexplained by rain or temperature',
    label_te: 'కారణం లేకుండా చెక్ ట్రేలలో దాణా 25% పైగా మిగిలిపోతోంది',
    riskPoints: 18,
    tag: 'Acute Stress / Infection',
  },
  {
    id: 'black_gills_found',
    label_en: 'Brown or black gills observed during cast-net inspection',
    label_te: 'శాంప్లింగ్‌లో రొయ్య మొప్పలు నల్లగా/గోధుమ రంగులో కనిపించాయి',
    riskPoints: 12,
    tag: 'Sludge / Gill Fouling',
  },
  {
    id: 'soft_shell_found',
    label_en: 'Papery thin or soft shell persisting on shrimp >2 days post-molt',
    label_te: 'కుబుసం విడిచిన 2 రోజుల తర్వాత కూడా పెంకు మెత్తగా ఉంది',
    riskPoints: 10,
    tag: 'Mineral Deficiency',
  },
  {
    id: 'size_variation',
    label_en: 'Extreme size variation (stunted shrimp under 5g mixed with 15g+ at DOC 50+)',
    label_te: 'ఒకే చెరువులో రొయ్యల సైజుల్లో తీవ్రమైన వ్యత్యాసం ఉంది',
    riskPoints: 15,
    tag: 'EHP Stunting Alert',
  },
  {
    id: 'muscle_cloudy',
    label_en: 'Milky opaque or chalky white abdominal tail muscle',
    label_te: 'తోక కండరం పాలలా తెల్లబడి వంకర తిరుగుతోంది',
    riskPoints: 10,
    tag: 'Muscle Necrosis',
  },
  {
    id: 'red_discoloration',
    label_en: 'Reddish discoloration of body, antennae, and tail fan',
    label_te: 'శరీరం, మీసాలు మరియు తోక ఎర్రగా మారాయి',
    riskPoints: 15,
    tag: 'Bacterial Septicemia',
  },
];

export const ShrimpHealthScanner: React.FC<ShrimpHealthScannerProps> = ({
  ponds,
  selectedPondId,
}) => {
  const { language, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'scanner' | 'symptoms' | 'atlas' | 'calc'>('scanner');
  const [focalArea, setFocalArea] = useState<'whole_body' | 'gills' | 'hepatopancreas' | 'gut' | 'muscle'>('whole_body');
  const [selectedImage, setSelectedImage] = useState<string>(sampleHealthImages[0].url);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample-healthy');
  const [pondId, setPondId] = useState(selectedPondId === 'all' ? ponds[0]?.id || 'pond-01' : selectedPondId);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [showHealthyBaseline, setShowHealthyBaseline] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<AnatomyHotspot | null>(ANATOMY_HOTSPOTS[0]);

  // Microscope & Caliper Workstation States
  const [zoomLevel, setZoomLevel] = useState<'1x' | '10x' | '40x'>('1x');
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [showCaliper, setShowCaliper] = useState<boolean>(false);
  const [focusSharpness, setFocusSharpness] = useState<number>(75);
  const [showLabSlip, setShowLabSlip] = useState<boolean>(false);
  const [copiedLabSlip, setCopiedLabSlip] = useState<boolean>(false);

  // Pond Checklist State
  const [checkedSymptoms, setCheckedSymptoms] = useState<string[]>([]);

  // Dosage Calculator State
  const [calcDisease, setCalcDisease] = useState<'white_gut' | 'soft_shell' | 'emergency_do' | 'bloom_crash'>('white_gut');
  const [calcPondAreaAcres, setCalcPondAreaAcres] = useState<number>(2.5);
  const [calcDailyFeedKg, setCalcDailyFeedKg] = useState<number>(35);

  const currentSampleObj = sampleHealthImages.find((s) => s.id === selectedSampleId) || sampleHealthImages[0];
  const activePond = ponds.find((p) => p.id === pondId) || ponds[0];

  const focalAreas = [
    { id: 'whole_body', label: t('focal_whole') },
    { id: 'gills', label: t('focal_gills') },
    { id: 'gut', label: t('focal_gut') },
    { id: 'muscle', label: t('focal_muscle') },
    { id: 'hepatopancreas', label: t('focal_hp') },
  ];

  const handleSelectSample = (sample: (typeof sampleHealthImages)[0]) => {
    setSelectedSampleId(sample.id);
    setSelectedImage(sample.url);
    setFocalArea(sample.focal_area);
    const hp = ANATOMY_HOTSPOTS.find((h) => h.id === sample.focal_area) || ANATOMY_HOTSPOTS[0];
    setSelectedHotspot(hp);
    setScanResult(null);
    setShowHealthyBaseline(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedSampleId('custom-upload');
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
      const response = await fetch('/api/gemini/screen-shrimp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          focal_area: focalArea,
          pond_id: pondId,
        }),
      });

      const data = await response.json();
      setScanResult(data);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleSymptom = (symptomId: string) => {
    setCheckedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((id) => id !== symptomId) : [...prev, symptomId]
    );
  };

  // Compute Biosecurity Threat Score from checked symptoms
  const threatScore = checkedSymptoms.reduce((sum, symId) => {
    const item = POND_FIELD_SYMPTOMS.find((s) => s.id === symId);
    return sum + (item?.riskPoints || 0);
  }, 0);

  const threatLevel =
    threatScore === 0
      ? { label: 'Optimal / పటిష్ట భద్రత', color: 'emerald', bg: 'bg-emerald-500' }
      : threatScore <= 25
      ? { label: 'Mild Stress / తక్కువ రిస్క్', color: 'blue', bg: 'bg-blue-500' }
      : threatScore <= 50
      ? { label: 'Moderate Risk / మధ్యస్థ రిస్క్', color: 'amber', bg: 'bg-amber-500' }
      : { label: 'High Threat / అత్యవసర నివారణ', color: 'rose', bg: 'bg-rose-500' };

  const handleCopyReport = () => {
    if (!scanResult) return;
    const reportText = `AquaCare AI Diagnostic Health Screening Report
Farm: Coastal Aquaculture Farm | Pond: ${pondId}
Date: ${new Date().toLocaleDateString()}
Health Index Score: ${scanResult.health_index_score || 85}/100
Risk Grade: ${scanResult.risk_grade || 'NORMAL'}

Clinical Observations:
${(language === 'te' ? scanResult.visible_observations_te : scanResult.visible_observations_en)
  ?.map((o: string) => `• ${o}`)
  .join('\n')}

Suspected Conditions:
${scanResult.conditions
  ?.map((c: any) => `• ${language === 'te' ? c.name_te : c.name_en} (${c.risk_level.toUpperCase()})`)
  .join('\n')}

Immediate Action Protocol:
${(language === 'te' ? scanResult.suggested_actions_te : scanResult.suggested_actions_en)
  ?.map((a: string) => `• ${a}`)
  .join('\n')}

Recommended Lab Testing:
${language === 'te' ? scanResult.lab_test_recommended_te : scanResult.lab_test_recommended_en}

Disclaimer:
${language === 'te' ? scanResult.scientific_safety_note_te : scanResult.scientific_safety_note_en}
`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleCopyLabSlip = () => {
    const slipText = `ANDHRA PRADESH AQUACULTURE VETERINARY DIAGNOSTIC LABORATORY
REQUISITION FORM - VETERINARY PATHOLOGY
------------------------------------------------------------
Accession No: AP-WG-${pondId.toUpperCase()}-${Date.now().toString().slice(-6)}
Pond ID: ${activePond?.name || pondId} (${((activePond?.area_ha || 1) * 2.47).toFixed(1)} Acres)
Date of Sampling: ${new Date().toLocaleDateString()} | Time: 07:15 AM
Species: Litopenaeus vannamei (Pacific White Shrimp)
Days of Culture (DOC): ${activePond?.doc || 48} days | ABW: ${activePond?.current_abw_g || 14.8} g
Pond Telemetry: DO: 4.2 ppm | pH: 8.1 | Salinity: 13 ppt | Temp: 29.5°C

CLINICAL SPECIMEN FINDINGS:
Specimen Profile: ${currentSampleObj.title}
Anatomy Focal Area: ${focalArea.toUpperCase()}
Presumptive Agent: ${currentSampleObj.pathogen}
OIE Notifiable Status: ${currentSampleObj.oie_listed ? 'YES - IMMEDIATE BIOSECURITY NOTIFICATION' : 'NO'}

REQUESTED DIAGNOSTIC PANELS:
1. ${currentSampleObj.pcr_marker}
2. Histopathology: ${currentSampleObj.histology}
3. Recommended Fixative: ${currentSampleObj.recommended_fixative}
4. Total Vibrio Count (TCBS Green vs Yellow Colony CFU/g)

Authorized Signatory: Dr. K. Rao, Lead Aquatic Animal Health Officer
`;
    navigator.clipboard.writeText(slipText);
    setCopiedLabSlip(true);
    setTimeout(() => setCopiedLabSlip(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
              <Microscope className="w-3.5 h-3.5" />
              <span>{language === 'te' ? 'క్లినికల్ పాథాలజీ వర్క్‌స్టేషన్' : 'Aquaculture Pathology Workstation'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'te' ? 'రొయ్యల ఆరోగ్య స్కానర్ & రోగ విశ్లేషణ' : 'Vannamei Shrimp Health & Disease Scanner'}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              {language === 'te'
                ? 'అసలైన వనామి రొయ్యల రోగ లక్షణ చిత్రాలతో కంపేర్ చేయండి. మైక్రోస్కోప్ జూమ్, డిజిటల్ కాలిపర్ మరియు AI స్కానింగ్ ద్వారా తక్షణ క్లినికల్ నివేదిక పొందండి.'
                : 'Inspect authentic macro clinical photographs of diseased Vannamei shrimp with digital caliper measurements, microscope magnification, and AI diagnostic biomarkers.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLabSlip(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{language === 'te' ? 'ల్యాబ్ రిక్విజిషన్ స్లిప్' : 'Lab Requisition Slip'}</span>
            </button>

            {/* Pond Picker */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-500 font-semibold">{language === 'te' ? 'చెరువు' : 'Pond'}:</span>
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                className="bg-transparent text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-hidden cursor-pointer"
              >
                {ponds.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {language === 'te' ? p.name_te : p.name} ({p.doc} DOC)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4 Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ScanEye className="w-4 h-4" />
            <span>{language === 'te' ? '🔬 AI ఫోటో స్కానర్ & మైక్రోస్కోప్' : '🔬 AI Scanner & Microscope'}</span>
          </button>

          <button
            onClick={() => setActiveTab('symptoms')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'symptoms'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{language === 'te' ? '📋 చెరువు లక్షణాల తనిఖీ' : '📋 Pond Symptom Checklist'}</span>
            {checkedSymptoms.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {checkedSymptoms.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('atlas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'atlas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'te' ? '📖 రొయ్యల వ్యాధుల గ్యాలరీ (ఫోటోలు)' : '📖 Disease Atlas & Photo Gallery'}</span>
          </button>

          <button
            onClick={() => setActiveTab('calc')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'calc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{language === 'te' ? '💊 మందుల మోతాదుల లెక్కింపు' : '💊 Dosage Calculator'}</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: VISUAL AI SCANNER & MICROSCOPE ==================== */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): Image Viewport, Microscope Controls & Reference Specimens */}
          <div className="lg:col-span-5 space-y-4">
            {/* Focal Area Buttons */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'te' ? 'పరిశీలన భాగం (Anatomical Focus)' : 'Anatomical Focus'}</span>
                </label>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {focalAreas.find((f) => f.id === focalArea)?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {focalAreas.map((fa) => (
                  <button
                    key={fa.id}
                    onClick={() => {
                      setFocalArea(fa.id as any);
                      const hp = ANATOMY_HOTSPOTS.find((h) => h.id === fa.id);
                      if (hp) setSelectedHotspot(hp);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      focalArea === fa.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {fa.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specimen Viewport with Microscope Zoom & Caliper Tools */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'te' ? 'పాథాలజీ వ్యూపోర్ట్' : 'Pathology Viewport'}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {zoomLevel} MAG
                  </span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowHealthyBaseline(!showHealthyBaseline)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      showHealthyBaseline
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Toggle Healthy Baseline"
                  >
                    <span className="flex items-center gap-1">
                      <Split className="w-3 h-3" />
                      {showHealthyBaseline ? 'Normal Baseline' : 'Compare Baseline'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Viewport Frame with Interactive Reticle and Calipers */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center select-none group shadow-inner">
                {/* Specimen Image with Zoom transform */}
                <div
                  className="w-full h-full flex items-center justify-center transition-all duration-300 overflow-hidden"
                  style={{
                    transform:
                      zoomLevel === '40x'
                        ? 'scale(2.4) translate(-4%, -5%)'
                        : zoomLevel === '10x'
                        ? 'scale(1.5)'
                        : 'scale(1)',
                    filter: `contrast(${focusSharpness + 25}%) brightness(1.05)`,
                  }}
                >
                  <img
                    src={showHealthyBaseline ? sampleHealthImages[0].url : selectedImage}
                    alt="Shrimp Specimen"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Reticle / Optical Crosshairs Overlay */}
                {showReticle && (
                  <div className="absolute inset-0 pointer-events-none border border-emerald-500/20">
                    {/* Reticle Grid Lines */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-500/25 -translate-x-1/2" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/25 -translate-y-1/2" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-emerald-500/30" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-500/15" />
                    
                    {/* Measurement Scale corner ticks */}
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400/80 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                      FOV: {zoomLevel === '40x' ? '12.5 mm' : zoomLevel === '10x' ? '45.0 mm' : '150.0 mm'} | {zoomLevel}
                    </div>

                    <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-black/70 px-2 py-0.5 rounded border border-emerald-500/30">
                      <div className="w-8 h-1 bg-emerald-400 rounded-full" />
                      <span>10 mm</span>
                    </div>
                  </div>
                )}

                {/* Digital Caliper Overlay */}
                {showCaliper && (
                  <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-mono bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 px-2.5 py-1 rounded-lg backdrop-blur-xs shadow-md">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Length: 118.4 mm</span>
                      </div>
                      <div>Carapace: 34.2 mm</div>
                      <div>Lesion: 1.4 mm</div>
                    </div>

                    {/* Caliper caliper brackets */}
                    <div className="relative w-full h-8 flex items-center">
                      <div className="w-2 h-6 border-l-2 border-emerald-400" />
                      <div className="flex-1 h-px bg-emerald-400 border-t border-dashed border-emerald-300" />
                      <div className="w-2 h-6 border-r-2 border-emerald-400" />
                      <span className="absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] font-mono text-emerald-300 bg-black/70 px-1 rounded">
                        Abdominal Segments 1-6 (68 mm)
                      </span>
                    </div>
                  </div>
                )}

                {/* Hotspot Pins Overlay */}
                {!isScanning && (
                  <div className="absolute inset-0 pointer-events-auto">
                    {ANATOMY_HOTSPOTS.map((hotspot) => {
                      const isActive = focalArea === hotspot.id;
                      return (
                        <button
                          key={hotspot.id}
                          onClick={() => {
                            setFocalArea(hotspot.id);
                            setSelectedHotspot(hotspot);
                          }}
                          style={{
                            left: `${hotspot.xPercent}%`,
                            top: `${hotspot.yPercent}%`,
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all cursor-pointer shadow-md ${
                            isActive
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/40 scale-125 z-20'
                              : 'bg-white/90 text-slate-800 hover:bg-emerald-100 hover:scale-110 z-10'
                          }`}
                          title={language === 'te' ? hotspot.name_te : hotspot.name_en}
                        >
                          ●
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Scanning Loader Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 gap-3 p-4 text-center z-30">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                      <Sparkles className="w-4 h-4 text-emerald-300 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">
                        {language === 'te' ? 'చిత్ర విశ్లేషణ జరుగుతోంది...' : 'Scanning Specimen Biomarkers...'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {language === 'te' ? 'మొప్పలు, పేగు మరియు కండరాల స్థితిని లెక్కిస్తోంది' : 'Analyzing cuticle integrity, gut fullness & branchial lamellae'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Viewport Control Bar */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
                {/* Magnification Controls */}
                <div className="flex items-center gap-1">
                  {(['1x', '10x', '40x'] as const).map((mag) => (
                    <button
                      key={mag}
                      onClick={() => setZoomLevel(mag)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                        zoomLevel === mag
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {mag}
                    </button>
                  ))}
                </div>

                {/* Toggles: Reticle, Caliper & Focus */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowReticle(!showReticle)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      showReticle
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title="Toggle Reticle Crosshair"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowCaliper(!showCaliper)}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      showCaliper
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title="Toggle Electronic Caliper Measurement Tool"
                  >
                    <Ruler className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Selected Hotspot Field Note */}
              {selectedHotspot && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{language === 'te' ? selectedHotspot.name_te : selectedHotspot.name_en}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Anatomy Pin
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-start gap-1">
                    <span className="font-bold">✓ Normal:</span>
                    <span>{language === 'te' ? selectedHotspot.normal_te : selectedHotspot.normal_en}</span>
                  </div>
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1">
                    <span className="font-bold">⚠ Risk:</span>
                    <span>{language === 'te' ? selectedHotspot.alert_te : selectedHotspot.alert_en}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                    Biometric: {language === 'te' ? selectedHotspot.lesionMetric_te : selectedHotspot.lesionMetric_en}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'te' ? 'ఫోటో అప్‌లోడ్' : 'Upload Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  onClick={handleRunScan}
                  disabled={isScanning}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'te' ? 'AI స్కానింగ్ రన్ చేయండి' : 'Run AI Screening'}</span>
                </button>
              </div>
            </div>

            {/* 6 Diagnostic Specimen Library Carousel with Original Macro Photos */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'te' ? 'నిజమైన రోగ లక్షణ శాంపిల్స్ (6 ఫొటోలు)' : 'Original Reference Samples (6 Specimens)'}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">1-Click Inspect</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sampleHealthImages.map((sample) => {
                  const isSelected = selectedSampleId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="aspect-16/10 rounded-lg bg-slate-950 overflow-hidden mb-1.5 border border-slate-200 dark:border-slate-700/60 relative">
                        <img src={sample.url} alt={sample.title} className="w-full h-full object-cover" />
                        {sample.oie_listed && (
                          <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-bold px-1 rounded font-mono shadow-xs">
                            OIE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                        {language === 'te' ? sample.title_te : sample.title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{sample.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Clinical Screening Results & Pathology Telemetry */}
          <div className="lg:col-span-7 space-y-4">
            {scanResult ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                {/* Header with Health Score Meter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {language === 'te' ? 'రొయ్యల క్లినికల్ పాథాలజీ నివేదిక' : 'Clinical Pathology Screening Report'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pond: {pondId} • Target Focus: {focalArea.toUpperCase()} • Screened on: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLabSlip(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lab Slip</span>
                    </button>

                    <button
                      onClick={handleCopyReport}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleRunScan}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                      title="Rescan"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>

                {/* Health Index Gauge Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/30 dark:via-slate-800/40 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-0.5">
                      {language === 'te' ? 'రొయ్యల ఆరోగ్య సూచిక (Health Index)' : 'Specimen Vigor & Health Index'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                        {scanResult.health_index_score || (scanResult.risk_grade === 'CRITICAL' ? 18 : 88)}%
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {scanResult.risk_grade || 'NORMAL STATUS'}
                      </span>
                    </div>
                  </div>

                  <div className="w-32 bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        (scanResult.health_index_score || 88) > 75
                          ? 'bg-emerald-500'
                          : (scanResult.health_index_score || 88) > 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${scanResult.health_index_score || 88}%` }}
                    />
                  </div>
                </div>

                {/* Section 1: Physical Findings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('visible_findings')}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    {(language === 'te'
                      ? scanResult.visible_observations_te
                      : scanResult.visible_observations_en
                    )?.map((obs: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">●</span>
                        <span className="leading-relaxed">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Potential Pathological Conditions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('potential_risk')}
                  </h4>
                  <div className="space-y-2">
                    {scanResult.conditions?.map((cond: any, idx: number) => {
                      const isHigh = cond.risk_level === 'high' || cond.risk_level === 'critical';
                      const isMod = cond.risk_level === 'moderate';
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border ${
                            isHigh
                              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                              : isMod
                              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                              : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {language === 'te' ? cond.name_te : cond.name_en}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                isHigh
                                  ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                                  : isMod
                                  ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                                  : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                              }`}
                            >
                              {cond.risk_level}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            {language === 'te' ? cond.confidence_note_te : cond.confidence_note_en}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Recommended Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {language === 'te' ? 'తక్షణ చెరువు రక్షణ చర్యలు' : 'Immediate Farm Actions'}
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {(language === 'te' ? scanResult.suggested_actions_te : scanResult.suggested_actions_en)?.map(
                      (act: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{act}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Section 4: Confirmatory Lab Test */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-3">
                  <Microscope className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      {t('recommended_lab_action')}
                    </strong>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'te'
                        ? scanResult.lab_test_recommended_te
                        : scanResult.lab_test_recommended_en}
                    </span>
                  </div>
                </div>

                {/* Safety Disclaimer */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <strong className="block font-semibold mb-0.5">
                      {t('medical_disclaimer_title')}
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      {language === 'te'
                        ? scanResult.scientific_safety_note_te
                        : scanResult.scientific_safety_note_en}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <ScanEye className="w-10 h-10" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {language === 'te' ? 'రొయ్యల ఆరోగ్య స్కానింగ్‌కు సిద్ధం' : 'Ready for Visual Pathological Screening'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {language === 'te'
                      ? 'ఎడమవైపు ఉన్న 6 అసలైన ఫోటో నమూనా చిత్రాలలో ఒకదాన్ని ఎంచుకోండి లేదా మీ చెరువు రొయ్యల ఫోటోను అప్‌లోడ్ చేసి క్షణాల్లో విశ్లేషణ పొందండి.'
                      : 'Select one of the 6 authentic clinical reference photos on the left or upload a specimen photo from your pond to generate an instantaneous clinical screening report.'}
                  </p>
                </div>
                <button
                  onClick={handleRunScan}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'te' ? 'ఎంచుకున్న రొయ్యను స్కాన్ చేయండి' : 'Scan Selected Specimen'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: POND SYMPTOM CHECKLIST ==================== */}
      {activeTab === 'symptoms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {language === 'te' ? 'చెరువు ఫీల్డ్ లక్షణాల తనిఖీ జాబితా' : 'Pond Observable Symptoms Checklist'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'te'
                      ? 'మీ చెరువులో లేదా శాంప్లింగ్‌లో కనిపించిన లక్షణాలను టిక్ చేయండి. తక్షణ బయోసెక్యూరిటీ రిస్క్ స్కోర్ లెక్కించబడుతుంది.'
                      : 'Check the observable clinical signs noted during daily feed tray inspection and cast netting.'}
                  </p>
                </div>
                {checkedSymptoms.length > 0 && (
                  <button
                    onClick={() => setCheckedSymptoms([])}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>

              <div className="space-y-2.5 pt-2">
                {POND_FIELD_SYMPTOMS.map((sym) => {
                  const isChecked = checkedSymptoms.includes(sym.id);
                  return (
                    <label
                      key={sym.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSymptom(sym.id)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white mb-0.5">
                          {language === 'te' ? sym.label_te : sym.label_en}
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                          {sym.tag}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Threat Meter Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>{language === 'te' ? 'బయోసెక్యూరిటీ రిస్క్ మీటర్' : 'Biosecurity Threat Meter'}</span>
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Cumulative Threat Score:</span>
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                    {threatScore} pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${threatLevel.bg} transition-all duration-500`}
                    style={{ width: `${Math.min(100, (threatScore / 75) * 100)}%` }}
                  />
                </div>
                <div className="text-xs font-bold pt-1 text-center" style={{ color: threatLevel.color }}>
                  {threatLevel.label}
                </div>
              </div>

              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white">
                  {language === 'te' ? 'ప్రస్తుత చెరువు పారామీటర్లతో లింక్:' : 'Telemetry Correlation:'}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1">
                  <div>• Early Morning DO: 4.2 ppm (Threshold: 4.0 ppm)</div>
                  <div>• Current pH: 8.1 | Salinity: 13 ppt</div>
                  <div>• Stocking: DOC {activePond?.doc || 48} days ({activePond?.estimated_count || 67} count)</div>
                </div>
              </div>

              {threatScore > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Emergency Advisory</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {threatScore >= 35
                      ? 'Multiple severe stress symptoms detected. Isolate pond drainages, reduce daily feed rations by 30%, run aerators continuously, and contact the local aqua clinic.'
                      : 'Mild environmental stress noted. Check morning dissolved oxygen and inspect bottom sludge.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: DISEASE ATLAS & ORIGINAL PHOTO GALLERY ==================== */}
      {activeTab === 'atlas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DISEASE_ATLAS.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Real Specimen Image Card Header */}
                  <div className="relative aspect-16/10 bg-slate-950 overflow-hidden border-b border-slate-100 dark:border-slate-800 group">
                    <img
                      src={d.image_url}
                      alt={d.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                    
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-black/70 text-white backdrop-blur-xs border border-white/20">
                        {d.code}
                      </span>
                      {d.oie_listed && (
                        <span className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-rose-600 text-white shadow-xs">
                          OIE LISTED
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                      <span className="text-[11px] font-mono text-emerald-400 font-bold truncate">
                        {d.pathogen}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {language === 'te' ? d.title_te : d.title_en}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap ${
                          d.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : d.severity === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {d.severity_label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                        {language === 'te' ? 'ప్రధాన క్లినికల్ లక్షణాలు:' : 'Field Clinical Signs:'}
                      </span>
                      {(language === 'te' ? d.symptoms_te : d.symptoms_en).map((s, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <span className="text-emerald-500 font-bold">·</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 text-[11px] text-emerald-900 dark:text-emerald-200">
                    <strong className="block font-semibold mb-0.5">
                      {language === 'te' ? 'రక్షణ చర్యలు & ప్రోటోకాల్:' : 'Treatment & Biosecurity SOP:'}
                    </strong>
                    <span className="leading-relaxed">{language === 'te' ? d.protocol_te : d.protocol_en}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <Microscope className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{language === 'te' ? d.lab_test_te : d.lab_test_en}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedImage(d.image_url);
                        setActiveTab('scanner');
                      }}
                      className="text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: DOSAGE CALCULATOR ==================== */}
      {activeTab === 'calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>{language === 'te' ? 'చికిత్సా మోతాదు కాలిక్యులేటర్' : 'Pathology Treatment Calculator'}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                    {language === 'te' ? 'లక్ష్యం లేదా వ్యాధి సమస్య:' : 'Target Condition / Objective:'}
                  </label>
                  <select
                    value={calcDisease}
                    onChange={(e) => setCalcDisease(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="white_gut">White Gut / WFS (Garlic + Gut Probiotic Mix)</option>
                    <option value="soft_shell">Soft Shell Syndrome (Mineral Ionic Replenishment)</option>
                    <option value="emergency_do">Emergency Morning Oxygen Depletion (O2 Tablets)</option>
                    <option value="bloom_crash">Plankton Crash Recovery (Fermented Carbon Juice)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                    {language === 'te' ? 'చెరువు వైశాల్యం (ఎకరాల్లో):' : 'Pond Area (Acres):'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={calcPondAreaAcres}
                    onChange={(e) => setCalcPondAreaAcres(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                    {language === 'te' ? 'రోజువారీ దాణా (కేజీలు):' : 'Current Daily Feed (kg/day):'}
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    value={calcDailyFeedKg}
                    onChange={(e) => setCalcDailyFeedKg(parseFloat(e.target.value) || 10)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'te' ? 'లెక్కింపు ఫలితాలు & అప్లికేషన్ షెడ్యూల్' : 'Prescribed Regimen & Field Dosing'}</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                  {calcPondAreaAcres} Acres • {calcDailyFeedKg} kg Feed
                </span>
              </div>

              {calcDisease === 'white_gut' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
                    <div className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                      White Gut (WFS) Daily Dosing Protocol (5-7 Days Continuous)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Fresh Garlic Paste:</div>
                        <div className="text-sm font-bold text-rose-700 dark:text-rose-400 font-mono">
                          {((calcDailyFeedKg * 10) / 1000).toFixed(2)} kg/day
                        </div>
                        <div className="text-[10px] text-slate-400">10g per kg of feed</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Gut Probiotic Powder:</div>
                        <div className="text-sm font-bold text-rose-700 dark:text-rose-400 font-mono">
                          {((calcDailyFeedKg * 5) / 1000).toFixed(2)} kg/day
                        </div>
                        <div className="text-[10px] text-slate-400">5g per kg of feed</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-slate-500">Feed Binder (Gel):</div>
                        <div className="text-sm font-bold text-rose-700 dark:text-rose-400 font-mono">
                          {(calcDailyFeedKg * 20).toFixed(0)} ml/day
                        </div>
                        <div className="text-[10px] text-slate-400">20ml per kg of feed</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {calcDisease === 'soft_shell' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      Mineral Dosing (Apply at 06:00 PM for Overnight Absorption)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Agricultural Lime (CaCO3):</div>
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
                          {(calcPondAreaAcres * 50).toFixed(0)} kg
                        </div>
                        <div className="text-[10px] text-slate-400">50 kg / acre</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Magnesium Chloride:</div>
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
                          {(calcPondAreaAcres * 25).toFixed(0)} kg
                        </div>
                        <div className="text-[10px] text-slate-400">25 kg / acre</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-100 dark:border-slate-700 col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-slate-500">Potassium Chloride (MOP):</div>
                        <div className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
                          {(calcPondAreaAcres * 15).toFixed(0)} kg
                        </div>
                        <div className="text-[10px] text-slate-400">15 kg / acre</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {calcDisease === 'emergency_do' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
                    <div className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                      Emergency Dissolved Oxygen Intervention (Dawn Crisis)
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Fast Oxygen Granules:</div>
                        <div className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono">
                          {(calcPondAreaAcres * 5).toFixed(0)} kg
                        </div>
                        <div className="text-[10px] text-slate-400">Broadcast directly over feeding tracks</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Aeration Horsepower:</div>
                        <div className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono">
                          {(calcPondAreaAcres * 8).toFixed(0)} HP minimum
                        </div>
                        <div className="text-[10px] text-slate-400">Keep on until DO exceeds 4.8 ppm</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {calcDisease === 'bloom_crash' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                      Fermented Carbon Juice (FCJ) Recipe (24-Hour Drum Fermentation)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Rice Bran:</div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {(calcPondAreaAcres * 15).toFixed(0)} kg
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Jaggery / Molasses:</div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {(calcPondAreaAcres * 4).toFixed(0)} kg
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Dry Yeast:</div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {(calcPondAreaAcres * 200).toFixed(0)} g
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500">Water Probiotic:</div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {(calcPondAreaAcres * 100).toFixed(0)} g
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: LABORATORY REQUISITION SLIP ==================== */}
      {showLabSlip && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  {language === 'te' ? 'అధికారిక ల్యాబ్ విశ్లేషణ దరఖాస్తు స్లిప్' : 'Veterinary Pathology Requisition Slip'}
                </h3>
              </div>
              <button
                onClick={() => setShowLabSlip(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formal Paper Slip Preview */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-3 text-slate-800 dark:text-slate-200">
              <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                  ANDHRA PRADESH AQUACULTURE HEALTH DIAGNOSTIC LAB
                </div>
                <div className="text-[10px] text-slate-500">
                  Accredited Aquatic Animal Pathology & Molecular Genetics Laboratory
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500">Accession No:</span> <strong className="text-slate-900 dark:text-white">AP-WG-{pondId.toUpperCase()}-{Date.now().toString().slice(-6)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Sampling Date:</span> <strong>{new Date().toLocaleDateString()} (07:15 AM)</strong>
                </div>
                <div>
                  <span className="text-slate-500">Pond Identification:</span> <strong>{activePond?.name || pondId}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Crop Timeline:</span> <strong>DOC {activePond?.doc || 48} | ABW {activePond?.current_abw_g || 14.8}g</strong>
                </div>
                <div>
                  <span className="text-slate-500">Water Parameters:</span> <strong>DO 4.2 ppm | pH 8.1 | Sal 13 ppt</strong>
                </div>
                <div>
                  <span className="text-slate-500">Specimen Host:</span> <strong>Litopenaeus vannamei</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Presumptive Clinical Diagnosis:</div>
                <div className="font-bold text-slate-900 dark:text-white">{currentSampleObj.title}</div>
                <div className="text-emerald-600 dark:text-emerald-400">Etiological Agent: {currentSampleObj.pathogen}</div>
                <div>OIE Status: {currentSampleObj.oie_listed ? 'CRITICAL - NOTIFIABLE PATHOGEN' : 'Subclinical / Non-notifiable'}</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Prescribed Laboratory Assays:</div>
                <div className="pl-2 border-l-2 border-emerald-500 space-y-1">
                  <div>1. {currentSampleObj.pcr_marker}</div>
                  <div>2. Histopathology: {currentSampleObj.histology}</div>
                  <div>3. Recommended Fixative: {currentSampleObj.recommended_fixative}</div>
                  <div>4. Total Vibrio Count (TCBS Agar Yellow/Green Colony Plate Ratio)</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleCopyLabSlip}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedLabSlip ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLabSlip ? 'Copied' : 'Copy Requisition'}</span>
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'te' ? 'ప్రింట్ / డౌన్‌లోడ్ స్లిప్' : 'Print / Download Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
