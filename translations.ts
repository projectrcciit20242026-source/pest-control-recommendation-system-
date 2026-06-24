export interface TranslationContent {
  welcome_back: string;
  brand: string;
  brand_desc: string;
  image_banner_badge: string;
  image_banner_title: string;
  image_banner_subtitle: string;
  selectLang: string;
  signIn_message: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  placeholderConfirmPassword: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderPhone: string;
  placeholderPassword: string;
  forgot_password: string;
  getStarted: string;
  no_account_message: string;
  no_account_button: string;
  hello: string;
  detectInstantly: string;
  heroSubtitle: string;
  uploadImage: string;
  useCamera: string;
  fromFiles: string;
  snapPhoto: string;
  recentActivity: string;
  noActivity: string;
  expertTip: string;
  tipBody: string;
  scan: string;
  dashboard: string;
  history: string;
  settings: string;
  temperature: string;
  humidity: string;
  detectionResult: string;
  match: string;
  description: string;
  prevention: string;
  pesticides: string;
  done: string;
  profile: string;
  detections: string;
  saved: string;
  editProfile: string;
  viewAll: string;
  noHistory: string;
  logout: string;
  historyTitle: string;
  noScanFound: string;
  noScanBody: string;
  startScanning: string;
  totalScans: string;
  scansCompleted: string;
  confidence: string;
  historyError: string;
  createAccount: string;

  startMonitoring: string;
  termsLabel: string;
  termsLink: string;
  andText: string;
  privacyLink: string;
  createAccountBtn: string;
  alreadyHaveAccount: string;
  signIn: string;
  joinBadge: string;
  joinTitle: string;
  joinSubtitle: string;
  termsError: string;

  registerSuccess: string;
  registerSuccessDesc: string;
  registerFailed: string;

  loginSuccess: string;
  loginSuccessDesc: string;
  loginfailed: string;

  mole: string;
  aphids: string;
  beet: string;
  blister: string;
  cica: string;
  corn: string;
  legume: string;
  lycorma: string;
  miridae: string;
  whitefly: string;


  errors: {
    fillFields: string;
    invalidEmail: string;
    invalidPhone: string;
    invalidName: string;
    connectionError: string;
  };
}

export type Language = "english" | "bangla";

export const TRANSLATIONS: Record<Language, TranslationContent> = {
  english: {
    welcome_back: "Welcome Back",
    brand: "AgriGuard",
    brand_desc: "Pest Detection & Pesticide Recommendation System",
    image_banner_badge: "Smart Agriculture",
    image_banner_title: "Smart Agriculture Monitoring",
    image_banner_subtitle:
      "Identify crop pests instantly and get expert recommendations for sustainable farming.",
    selectLang: "Select Language / ভাষা নির্বাচন করুন",
    signIn_message: "Sign in to access your farm dashboard",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    password: "Password",
    confirmPassword: "Confirm Password",
    placeholderName: "Enter your name",
    placeholderEmail: "Enter your email",
    placeholderPhone: "Enter phone number",
    placeholderPassword: "Enter password",
    placeholderConfirmPassword: "Confirm password",
    forgot_password: "Forgot Password?",
    getStarted: "Get Started",
    no_account_message: "Don't have an account?",
    no_account_button: "Sign up",

    registerSuccess: "Account created!",
    registerSuccessDesc: "Welcome to the platform.",
    registerFailed: "Registration failed!",

    loginSuccess: "Login successful!",
    loginSuccessDesc: "Welcome back to you dashboard.",
    loginfailed: "Login failed!",

    mole: "Mole Cricket",
    aphids: "Aphids",
    beet: "Beet Army Worm",
    blister: "Blister Beetle",
    cica: "Cicadellidae",
    corn: "corn borer",
    legume: "legume blister beetle",
    lycorma: "lycorma delicuta",
    miridae: "Miridae",
    whitefly: "Whitefly",

    hello: "Hello",
    detectInstantly: "Detect Pests Instantly",
    heroSubtitle:
      "Upload a photo of the affected crop to get AI-powered results in seconds.",
    uploadImage: "Upload Image",
    useCamera: "Use Camera",
    fromFiles: "Select from your files",
    snapPhoto: "Snap a photo now",
    recentActivity: "Recent Activity",
    noActivity: "No recent detections found. Start by scanning a crop!",
    expertTip: "Expert Tip",
    tipBody:
      "Make sure the image is clear and well-lit for better accuracy. Focus on the pest or the damaged area.",
    scan: "Scan",
    dashboard: "Dashboard",
    history: "History",
    settings: "Settings",
    temperature: "Temperature",
    humidity: "Humidity",
    detectionResult: "Detection Result",
    match: "Match",
    description: "Description",
    prevention: "Prevention Method",
    pesticides: "Recommended Pesticides",
    done: "Done",
    profile: "Profile",
    detections: "Detections",
    saved: "Saved",
    editProfile: "Edit Profile",
    viewAll: "View All",
    noHistory: "No history yet",
    logout: "Log Out",
    historyTitle: "Scan History",
    noScanFound: "No Scans Found",
    noScanBody:
      "Your pest detection history will appear here. Start by scanning a crop!",
    startScanning: "Start Scanning",
    totalScans: "Total Pest Detections",
    //scansCompleted: "scans completed",
    confidence: "confidence",
    historyError: "Could not load scan history. Check your connection.",
    errors: {
      fillFields: "Please fill all fields correctly",
      invalidEmail: "Please enter a valid email address",
      invalidPhone: "Please enter a valid 10-digit phone number",
      invalidName: "Name must be at least 2 characters long",
      connectionError: "Failed to connect to server. Running in Demo Mode.",
    },
    createAccount: "Create Account",
    startMonitoring: "Start monitoring your farm today",
    termsLabel: "I agree to the",
    termsLink: "Terms of Service",
    andText: "and",
    privacyLink: "Privacy Policy",
    createAccountBtn: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    joinBadge: "Join Smart Farming",
    joinTitle: "Join the Smart Farming Revolution",
    joinSubtitle:
      "Monitor your crops, detect pests early, and optimize soil health with cutting-edge IoT technology.",
    termsError: "You must agree to the Terms of Service to continue",
  },

  bangla: {
    welcome_back: "ফিরে আসার জন্য স্বাগতম",
    brand: "এগ্রিগার্ড",
    brand_desc: "কীটপতঙ্গ শনাক্তকরণ ও কীটনাশক পরামর্শ ব্যবস্থা",
    image_banner_badge: "স্মার্ট কৃষি",
    image_banner_title: "স্মার্ট কৃষি পর্যবেক্ষণ ব্যবস্থা",
    image_banner_subtitle:
      "তাৎক্ষণিকভাবে ফসলের পোকামাকড় শনাক্ত করুন এবং উন্নত ও টেকসই চাষাবাদের জন্য বিশেষজ্ঞ পরামর্শ পান।",
    selectLang: "ভাষা নির্বাচন করুন / Select Language",
    signIn_message: "আপনার কৃষি ড্যাশবোর্ডে প্রবেশ করতে সাইন ইন করুন",
    fullName: "পুরো নাম",
    email: "ইমেইল ঠিকানা",
    phone: "ফোন নম্বর",
    password: "পাসওয়ার্ড",
    confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
    placeholderName: "আপনার নাম লিখুন",
    placeholderEmail: "আপনার ইমেইল লিখুন",
    placeholderPhone: "ফোন নম্বর লিখুন",
    placeholderPassword: "পাসওয়ার্ড লিখুন",
    placeholderConfirmPassword: "পুনরায় পাসওয়ার্ড লিখুন",
    forgot_password: "পাসওয়ার্ড ভুলে গেছেন?",
    getStarted: "শুরু করুন",
    no_account_message: "অ্যাকাউন্ট নেই?",
    no_account_button: "অ্যাকাউন্ট তৈরি করুন",

    registerSuccess: "অ্যাকাউন্ট তৈরি হয়েছে!",
    registerSuccessDesc: "প্ল্যাটফর্মে আপনাকে স্বাগতম।",
    registerFailed: "নিবন্ধন করা যায়নি",

    loginSuccess: "লগ ইন সফল হয়েছে!",
    loginSuccessDesc: "আপনার ড্যাশবোর্ডে আবার স্বাগতম।",
    loginfailed: "লগ ইন করা যায়নি",

    mole: "মোল ক্রিকেট",
    aphids: "জাব পোকা",
    beet: "নিল সুয়ো / বিট আর্মিওয়ার্ম",
    blister: "অ্যাসিড পোকা",
    cica: "পাতাফড়িং / শ্যামাপোকা",
    corn: "ল্যাদা পোকা",
    legume: "গুবরে পোকা",
    lycorma: "ফুলের ফড়িং জাতীয় পোকা",
    miridae: "পাতা পোকা",
    whitefly: "সাদা মাছি",

    hello: "হ্যালো",
    detectInstantly: "কীটপতঙ্গ শনাক্ত করুন মুহূর্তেই",
    heroSubtitle: "ছবি আপলোড করে পোকা শনাক্ত করুন এবং সঠিক কীটনাশকের পরামর্শ পান।",
    uploadImage: "ছবি আপলোড করুন",
    useCamera: "ক্যামেরা ব্যবহার করুন",
    fromFiles: "আপনার ফাইল থেকে নির্বাচন করুন",
    snapPhoto: "একটি ছবি তুলুন",
    recentActivity: "সাম্প্রতিক কার্যকলাপ",
    noActivity:
      "কোনো সাম্প্রতিক সনাক্তকরণ পাওয়া যায়নি। একটি ফসল স্ক্যান করে শুরু করুন!",
    expertTip: "বিশেষজ্ঞের টিপস",
    tipBody:
      "নির্ভুলতার জন্য ছবিটি পরিষ্কার এবং পর্যাপ্ত আলোতে আছে তা নিশ্চিত করুন।",
    scan: "স্ক্যান",
    dashboard: "ড্যাশবোর্ড",
    history: "ইতিহাস",
    settings: "সেটিংস",
    temperature: "তাপমাত্রা",
    humidity: "আর্দ্রতা",
    detectionResult: "সনাক্তকরণের ফলাফল",
    match: "মিল",
    description: "বিবরণ",
    prevention: "প্রতিরোধ পদ্ধতি",
    pesticides: "প্রস্তাবিত কীটনাশক",
    done: "সম্পন্ন",
    profile: "প্রোফাইল",
    detections: "সনাক্তকরণ",
    saved: "সংরক্ষিত",
    editProfile: "প্রোফাইল এডিট করুন",
    viewAll: "সব দেখুন",
    noHistory: "এখনো কোনো ইতিহাস নেই",
    logout: "লগ আউট",
    historyTitle: "স্ক্যান ইতিহাস",
    noScanFound: "কোনো স্ক্যান পাওয়া যায়নি",
    noScanBody:
      "আপনার পোকা সনাক্তকরণের ইতিহাস এখানে দেখা যাবে। একটি ফসল স্ক্যান করে শুরু করুন!",
    startScanning: "স্ক্যান শুরু করুন",
    totalScans: "সনাক্তকৃত কীটপতঙ্গ মোট সংখ্যা",
    //scansCompleted: "স্ক্যান সম্পন্ন",
    confidence: "নিশ্চিততা",
    historyError: "স্ক্যান ইতিহাস লোড করা যায়নি। আপনার সংযোগ পরীক্ষা করুন।",
    errors: {
      fillFields: "অনুগ্রহ করে সব তথ্য সঠিক ভাবে পূরণ করুন",
      invalidEmail: "অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন",
      invalidPhone: "অনুগ্রহ করে একটি সঠিক ১০-সংখ্যার ফোন নম্বর লিখুন",
      invalidName: "নাম অন্তত ২ অক্ষরের হতে হবে",
      connectionError: "সার্ভারের সাথে সংযোগ করতে ব্যর্থ। ডেমো মোডে চলছে।",
    },
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    startMonitoring: "আজই আপনার কৃষি পর্যবেক্ষণ শুরু করুন",
    termsLabel: "আমি সম্মত",
    termsLink: "সেবার শর্তাবলী",
    andText: "এবং",
    privacyLink: "গোপনীয়তা নীতি",
    createAccountBtn: "অ্যাকাউন্ট তৈরি করুন",
    alreadyHaveAccount: "অ্যাকাউন্ট আছে?",
    signIn: "সাইন ইন করুন",
    joinBadge: "স্মার্ট কৃষিতে যোগ দিন",
    joinTitle: "স্মার্ট কৃষি বিপ্লবে যোগ দিন",
    joinSubtitle:
      "অত্যাধুনিক আইওটি প্রযুক্তি দিয়ে আপনার ফসল পর্যবেক্ষণ করুন, আগেভাগে কীটপতঙ্গ শনাক্ত করুন এবং মাটির স্বাস্থ্য উন্নত করুন।",
    termsError: "চালিয়ে যেতে শর্তাবলীতে সম্মতি দিন",
  },
};
