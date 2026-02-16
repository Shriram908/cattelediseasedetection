import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "hi" | "mr";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.dashboard": "Dashboard",
    "nav.diagnose": "Diagnose",
    "nav.findVets": "Find Vets",
    "nav.myClinic": "My Clinic",
    "nav.messages": "Messages",
    "nav.appointments": "Appointments",
    "nav.vaccinations": "Vaccinations",
    "nav.profile": "Profile",
    "nav.logout": "Logout",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.farmerDashboard": "Farmer Dashboard",
    "dashboard.vetDashboard": "Veterinarian Dashboard",
    "dashboard.totalCattle": "Total Cattle",
    "dashboard.diagnoses": "Diagnoses",
    "dashboard.upcomingAppts": "Upcoming Appts",
    "dashboard.dueVaccinations": "Due Vaccinations",
    "dashboard.actionNeeded": "Action needed",
    "dashboard.cattleRegistry": "Cattle Registry",
    "dashboard.addCattle": "Add Cattle",
    "dashboard.noCattle": "No cattle registered yet",
    "dashboard.addFirst": "Add Your First Cattle",
    "dashboard.recentDiagnoses": "Recent Diagnoses",
    "dashboard.noDiagnoses": "No diagnosis reports yet",
    "dashboard.createFirst": "Create First Diagnosis",
    "dashboard.myCattle": "My Cattle",
    "dashboard.diagnosisHistory": "Diagnosis History",
    "dashboard.viewReport": "View Report",
    "dashboard.pendingAppointments": "Pending Appointments",
    "dashboard.confirmedToday": "Confirmed Today",
    "dashboard.account": "Account",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.upcomingAppointments": "Upcoming Appointments",
    "dashboard.viewAll": "View All",
    "dashboard.vaccinationReminders": "Vaccination Reminders",
    "dashboard.manageVaccinations": "Manage Vaccinations",

    // Diagnose
    "diagnose.title": "Diagnose Disease",
    "diagnose.subtitle": "Upload an image or select symptoms to get an AI-powered diagnosis",
    "diagnose.selectCattle": "Select Cattle",
    "diagnose.uploadImage": "Upload Image (Optional)",
    "diagnose.selectSymptoms": "Select Symptoms (Optional)",
    "diagnose.analyze": "Analyze Disease",
    "diagnose.analyzing": "Analyzing...",
    "diagnose.cancel": "Cancel",
    "diagnose.noCattle": "No Cattle Registered",
    "diagnose.registerFirst": "You need to register at least one cattle before you can perform a diagnosis.",
    "diagnose.registerBtn": "Register Your First Cattle",

    // Auth
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.createAccount": "Create Account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full Name",
    "auth.accountType": "Account Type",
    "auth.farmer": "Farmer",
    "auth.farmerDesc": "For cattle owners and farm workers",
    "auth.veterinarian": "Veterinarian",
    "auth.vetDesc": "For veterinary professionals",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.confidence": "Confidence",
    "common.severity": "Severity",
    "common.breed": "Breed",
    "common.age": "Age",
    "common.weight": "Weight",

    // Landing
    "landing.hero": "CattleCare AI",
    "landing.heroSub": "Advanced machine learning system for early detection and diagnosis of cattle diseases. Protect your herd with instant AI-powered analysis.",
    "landing.getStarted": "Get Started",
    "landing.learnMore": "Learn More",
    "landing.diseases": "Diseases Detected",
    "landing.symptoms": "Symptoms Analyzed",
    "landing.accuracy": "Accuracy Rate",
    "landing.features": "Comprehensive Features",
    "landing.featuresSub": "Everything you need to monitor and maintain the health of your cattle herd",
    "landing.howItWorks": "How It Works",
    "landing.howItWorksSub": "Simple, fast, and accurate diagnosis in 3 easy steps",
    "landing.cta": "Ready to Protect Your Herd?",
    "landing.ctaSub": "Join thousands of farmers and veterinarians using CattleCare AI for accurate disease detection",
    "landing.startTrial": "Start Free Trial",
  },

  hi: {
    // Nav
    "nav.dashboard": "डैशबोर्ड",
    "nav.diagnose": "निदान करें",
    "nav.findVets": "पशु चिकित्सक खोजें",
    "nav.myClinic": "मेरा क्लीनिक",
    "nav.messages": "संदेश",
    "nav.appointments": "अपॉइंटमेंट",
    "nav.vaccinations": "टीकाकरण",
    "nav.profile": "प्रोफ़ाइल",
    "nav.logout": "लॉग आउट",

    // Dashboard
    "dashboard.welcome": "वापसी पर स्वागत है",
    "dashboard.farmerDashboard": "किसान डैशबोर्ड",
    "dashboard.vetDashboard": "पशु चिकित्सक डैशबोर्ड",
    "dashboard.totalCattle": "कुल पशु",
    "dashboard.diagnoses": "निदान",
    "dashboard.upcomingAppts": "आगामी अपॉइंटमेंट",
    "dashboard.dueVaccinations": "बकाया टीकाकरण",
    "dashboard.actionNeeded": "कार्रवाई आवश्यक",
    "dashboard.cattleRegistry": "पशु रजिस्ट्री",
    "dashboard.addCattle": "पशु जोड़ें",
    "dashboard.noCattle": "अभी तक कोई पशु पंजीकृत नहीं है",
    "dashboard.addFirst": "अपना पहला पशु जोड़ें",
    "dashboard.recentDiagnoses": "हाल के निदान",
    "dashboard.noDiagnoses": "अभी तक कोई निदान रिपोर्ट नहीं",
    "dashboard.createFirst": "पहला निदान करें",
    "dashboard.myCattle": "मेरे पशु",
    "dashboard.diagnosisHistory": "निदान इतिहास",
    "dashboard.viewReport": "रिपोर्ट देखें",
    "dashboard.pendingAppointments": "लंबित अपॉइंटमेंट",
    "dashboard.confirmedToday": "आज पुष्टि हुई",
    "dashboard.account": "खाता",
    "dashboard.quickActions": "त्वरित कार्रवाई",
    "dashboard.upcomingAppointments": "आगामी अपॉइंटमेंट",
    "dashboard.viewAll": "सभी देखें",
    "dashboard.vaccinationReminders": "टीकाकरण अनुस्मारक",
    "dashboard.manageVaccinations": "टीकाकरण प्रबंधित करें",

    // Diagnose
    "diagnose.title": "रोग निदान करें",
    "diagnose.subtitle": "AI-संचालित निदान प्राप्त करने के लिए छवि अपलोड करें या लक्षण चुनें",
    "diagnose.selectCattle": "पशु चुनें",
    "diagnose.uploadImage": "छवि अपलोड करें (वैकल्पिक)",
    "diagnose.selectSymptoms": "लक्षण चुनें (वैकल्पिक)",
    "diagnose.analyze": "रोग विश्लेषण करें",
    "diagnose.analyzing": "विश्लेषण हो रहा है...",
    "diagnose.cancel": "रद्द करें",
    "diagnose.noCattle": "कोई पशु पंजीकृत नहीं",
    "diagnose.registerFirst": "निदान करने से पहले आपको कम से कम एक पशु पंजीकृत करना होगा।",
    "diagnose.registerBtn": "अपना पहला पशु पंजीकृत करें",

    // Auth
    "auth.login": "लॉग इन करें",
    "auth.signup": "साइन अप करें",
    "auth.createAccount": "खाता बनाएं",
    "auth.email": "ईमेल",
    "auth.password": "पासवर्ड",
    "auth.fullName": "पूरा नाम",
    "auth.accountType": "खाता प्रकार",
    "auth.farmer": "किसान",
    "auth.farmerDesc": "पशु मालिकों और खेत श्रमिकों के लिए",
    "auth.veterinarian": "पशु चिकित्सक",
    "auth.vetDesc": "पशु चिकित्सा पेशेवरों के लिए",

    // Common
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफलता",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.edit": "संपादित करें",
    "common.back": "वापस",
    "common.confidence": "विश्वास",
    "common.severity": "गंभीरता",
    "common.breed": "नस्ल",
    "common.age": "आयु",
    "common.weight": "वजन",

    // Landing
    "landing.hero": "CattleCare AI",
    "landing.heroSub": "पशु रोगों की शीघ्र पहचान और निदान के लिए उन्नत मशीन लर्निंग प्रणाली। तत्काल AI-संचालित विश्लेषण से अपने पशुधन की रक्षा करें।",
    "landing.getStarted": "शुरू करें",
    "landing.learnMore": "अधिक जानें",
    "landing.diseases": "रोग पहचाने गए",
    "landing.symptoms": "लक्षण विश्लेषित",
    "landing.accuracy": "सटीकता दर",
    "landing.features": "व्यापक सुविधाएँ",
    "landing.featuresSub": "अपने पशुधन के स्वास्थ्य की निगरानी और रखरखाव के लिए आवश्यक सब कुछ",
    "landing.howItWorks": "यह कैसे काम करता है",
    "landing.howItWorksSub": "3 आसान चरणों में सरल, तेज़ और सटीक निदान",
    "landing.cta": "अपने पशुधन की रक्षा के लिए तैयार हैं?",
    "landing.ctaSub": "सटीक रोग पहचान के लिए CattleCare AI का उपयोग करने वाले हजारों किसानों और पशु चिकित्सकों से जुड़ें",
    "landing.startTrial": "मुफ्त शुरू करें",
  },

  mr: {
    // Nav
    "nav.dashboard": "डॅशबोर्ड",
    "nav.diagnose": "निदान करा",
    "nav.findVets": "पशुवैद्य शोधा",
    "nav.myClinic": "माझे क्लिनिक",
    "nav.messages": "संदेश",
    "nav.appointments": "भेटी",
    "nav.vaccinations": "लसीकरण",
    "nav.profile": "प्रोफाइल",
    "nav.logout": "बाहेर पडा",

    // Dashboard
    "dashboard.welcome": "पुन्हा स्वागत",
    "dashboard.farmerDashboard": "शेतकरी डॅशबोर्ड",
    "dashboard.vetDashboard": "पशुवैद्य डॅशबोर्ड",
    "dashboard.totalCattle": "एकूण जनावरे",
    "dashboard.diagnoses": "निदान",
    "dashboard.upcomingAppts": "आगामी भेटी",
    "dashboard.dueVaccinations": "बाकी लसीकरण",
    "dashboard.actionNeeded": "कृती आवश्यक",
    "dashboard.cattleRegistry": "जनावरे नोंदणी",
    "dashboard.addCattle": "जनावर जोडा",
    "dashboard.noCattle": "अद्याप कोणतेही जनावर नोंदणीकृत नाही",
    "dashboard.addFirst": "तुमचे पहिले जनावर जोडा",
    "dashboard.recentDiagnoses": "अलीकडील निदान",
    "dashboard.noDiagnoses": "अद्याप कोणताही निदान अहवाल नाही",
    "dashboard.createFirst": "पहिले निदान करा",
    "dashboard.myCattle": "माझी जनावरे",
    "dashboard.diagnosisHistory": "निदान इतिहास",
    "dashboard.viewReport": "अहवाल पहा",
    "dashboard.pendingAppointments": "प्रलंबित भेटी",
    "dashboard.confirmedToday": "आज पुष्टी झालेल्या",
    "dashboard.account": "खाते",
    "dashboard.quickActions": "जलद कृती",
    "dashboard.upcomingAppointments": "आगामी भेटी",
    "dashboard.viewAll": "सर्व पहा",
    "dashboard.vaccinationReminders": "लसीकरण स्मरणपत्रे",
    "dashboard.manageVaccinations": "लसीकरण व्यवस्थापित करा",

    // Diagnose
    "diagnose.title": "रोग निदान करा",
    "diagnose.subtitle": "AI-संचालित निदान मिळवण्यासाठी प्रतिमा अपलोड करा किंवा लक्षणे निवडा",
    "diagnose.selectCattle": "जनावर निवडा",
    "diagnose.uploadImage": "प्रतिमा अपलोड करा (ऐच्छिक)",
    "diagnose.selectSymptoms": "लक्षणे निवडा (ऐच्छिक)",
    "diagnose.analyze": "रोग विश्लेषण करा",
    "diagnose.analyzing": "विश्लेषण सुरू आहे...",
    "diagnose.cancel": "रद्द करा",
    "diagnose.noCattle": "जनावरे नोंदणीकृत नाहीत",
    "diagnose.registerFirst": "निदान करण्यापूर्वी तुम्हाला किमान एक जनावर नोंदणी करणे आवश्यक आहे.",
    "diagnose.registerBtn": "तुमचे पहिले जनावर नोंदणी करा",

    // Auth
    "auth.login": "लॉग इन करा",
    "auth.signup": "साइन अप करा",
    "auth.createAccount": "खाते तयार करा",
    "auth.email": "ईमेल",
    "auth.password": "पासवर्ड",
    "auth.fullName": "पूर्ण नाव",
    "auth.accountType": "खाते प्रकार",
    "auth.farmer": "शेतकरी",
    "auth.farmerDesc": "पशुपालक आणि शेत कामगारांसाठी",
    "auth.veterinarian": "पशुवैद्य",
    "auth.vetDesc": "पशुवैद्यकीय व्यावसायिकांसाठी",

    // Common
    "common.loading": "लोड होत आहे...",
    "common.error": "त्रुटी",
    "common.success": "यशस्वी",
    "common.save": "जतन करा",
    "common.cancel": "रद्द करा",
    "common.delete": "हटवा",
    "common.edit": "संपादित करा",
    "common.back": "मागे",
    "common.confidence": "आत्मविश्वास",
    "common.severity": "तीव्रता",
    "common.breed": "जात",
    "common.age": "वय",
    "common.weight": "वजन",

    // Landing
    "landing.hero": "CattleCare AI",
    "landing.heroSub": "जनावरांच्या रोगांचे लवकर शोधणे आणि निदान करण्यासाठी प्रगत मशीन लर्निंग प्रणाली. तात्काळ AI-संचालित विश्लेषणाने तुमच्या पशुधनाचे रक्षण करा.",
    "landing.getStarted": "सुरू करा",
    "landing.learnMore": "अधिक जाणा",
    "landing.diseases": "रोग ओळखले",
    "landing.symptoms": "लक्षणे विश्लेषित",
    "landing.accuracy": "अचूकता दर",
    "landing.features": "सर्वसमावेशक वैशिष्ट्ये",
    "landing.featuresSub": "तुमच्या पशुधनाच्या आरोग्याचे निरीक्षण आणि देखभाल करण्यासाठी आवश्यक सर्वकाही",
    "landing.howItWorks": "हे कसे कार्य करते",
    "landing.howItWorksSub": "3 सोप्या चरणांमध्ये सोपे, जलद आणि अचूक निदान",
    "landing.cta": "तुमच्या पशुधनाचे रक्षण करण्यास तयार आहात?",
    "landing.ctaSub": "अचूक रोग शोधासाठी CattleCare AI वापरणाऱ्या हजारो शेतकऱ्यांमध्ये आणि पशुवैद्यांमध्ये सामील व्हा",
    "landing.startTrial": "मोफत सुरू करा",
  },
};

const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: Record<Language, string>;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
  languageNames,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("cattlecare-lang");
    return (saved as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("cattlecare-lang", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t, languageNames }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
