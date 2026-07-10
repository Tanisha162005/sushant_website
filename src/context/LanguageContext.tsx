'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'mr' | 'en';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations = {
  mr: {
    heroLine1: 'तुमच्यातील क्रिएटरला द्या',
    heroLine2: 'एक प्रोफेशनल दिशा',
    heroSubtitle: 'मराठीतून उच्च दर्जाची स्टोरीटेलिंग आणि व्हिडिओ प्रोडक्शन शिका. भारतातील सर्वात मोठ्या ब्रँड्समागील सिक्रेट्स जाणून घ्या.',
    joinCourse: 'कोर्स जॉईन करा',
    viewCourse: 'कोर्स पहा',
    learnMore: 'अधिक जाणून घ्या',
    newCourseLive: 'नवीन कोर्स आता लाईव्ह आहे!',
    aboutTitle: 'सुशांत घाडगे कोण आहेत?',
    aboutSubtitle: 'मराठी कंटेंट क्रिएशन इंडस्ट्रीतील सर्वात प्रभावशाली नावांपैकी एक',
    aboutP1: 'सुशांत घाडगे — एक अभिनेता, फिल्ममेकर, आणि मराठी डिजिटल कंटेंटमधील अग्रगण्य नाव. Amazon Prime Video वरील "Sharmajee Ki Beti" मध्ये अभिनय केलेल्या सुशांतने कंटेंट क्रिएशनच्या जगात स्वतःचं एक वेगळं स्थान निर्माण केलं आहे.',
    aboutP2: 'गेल्या काही वर्षांत त्यांनी 1,000 पेक्षा जास्त व्हिडिओज तयार करून 2 बिलियन+ व्ह्यूज मिळवले आहेत. भारतातील सर्वात मोठ्या ब्रँड्ससोबत — Prime Video, Disney Hotstar, Zomato, Cred, Realme सोबत यशस्वी कोलॅबोरेशन्स केले आहेत.',
    aboutP3: '500K+ लोकांची कम्युनिटी उभी करून सुशांत आज हजारो तरुणांना कंटेंट क्रिएशनची प्रोफेशनल दिशा देत आहेत. आता ते त्यांचा संपूर्ण अनुभव या कोर्सद्वारे तुमच्यापर्यंत आणत आहेत.',
    brandDeals: 'Brand Deals',
    totalViews: 'Total Views',
    videosCreated: 'Videos Created',
    community: 'Community',
    followInsta: 'Instagram वर Follow करा',
    videoTitle: 'कोर्स बद्दल जाणून घ्या',
    videoSubtitle: 'सुशांत यांच्या तोंडून ऐका — हा कोर्स कशासाठी आहे, तुम्हाला काय शिकायला मिळेल आणि तुमचं आयुष्य कसं बदलू शकतं.',
    videoComingSoon: 'व्हिडिओ लवकरच येत आहे...',
    courseTag: 'Course',
    courseTitle: 'कंटेंट क्रिएशन मास्टर कोर्स',
    courseSubtitle: 'मराठीतून शिका कंटेंट कसा तयार करायचा — शून्यापासून ते प्रो लेव्हलपर्यंत',
    courseBadge: '🔥 लिमिटेड सीट्स',
    courseCardTitle: 'कंटेंट क्रिएशन A to Z — मराठीत शिका',
    courseDesc: 'या कोर्समध्ये तुम्हाला शिकायला मिळेल — व्हिडिओ स्क्रिप्टिंग, शूटिंग, एडिटिंग, ब्रँड डील्स कसे मिळवायचे, सोशल मीडिया ग्रोथ स्ट्रॅटेजी, मोनेटायझेशन आणि बरंच काही. सुशांत घाडगे यांच्या वर्षानुवर्षांच्या अनुभवातून तयार केलेला हा कोर्स.',
    enrollNow: 'आत्ताच एनरोल करा',
    securePayment: '100% सुरक्षित पेमेंट',
    courseFeature1: 'व्हिडिओ आणि एडिटिंग मास्टरी',
    courseFeature2: 'सोशल मीडिया अल्गोरिदम हॅक्स',
    courseFeature3: 'ब्रँड डील्स आणि मोनेटायझेशन',
    brandsTitle: 'ज्या ब्रँड्ससोबत काम केलं',
    brandsSubtitle: 'भारतातील टॉप ब्रँड्ससोबत यशस्वी कोलॅबोरेशन्स',
    testimonialsTitle: 'विद्यार्थ्यांचे अनुभव',
    testimonialsSubtitle: 'सुशांत यांच्याकडून शिकलेले विद्यार्थी आज काय म्हणत आहेत ते ऐका.',
    testi1Name: 'राहुल माने',
    testi1Role: 'Content Creator (100k+ Followers)',
    testi1Text: '"सुशांत सरांच्या कोर्समुळे माझ्या व्हिडिओंमध्ये खूप मोठी सुधारणा झाली. पूर्वी माझ्या व्हिडिओंना रीच मिळत नव्हता, पण त्यांनी सांगितलेल्या हुक आणि रिटेन्शन ट्रिक्समुळे माझे व्हिडिओ व्हायरल व्हायला लागले."',
    testi2Name: 'अमित पाटील',
    testi2Role: 'Freelance Video Editor',
    testi2Text: '"मी अनेक व्हिडिओ एडिटिंग कोर्स केले आहेत, पण या कोर्समध्ये जे प्रॅक्टिकल नॉलेज मिळालं ते कुठेच मिळालं नाही. स्टोरीटेलिंग कशी असावी आणि प्रेक्षकांना कसं बांधून ठेवावं हे मला खऱ्या अर्थाने इथे शिकायला मिळालं."',
    testi3Name: 'स्नेहा कुलकर्णी',
    testi3Role: 'Vlogger',
    testi3Text: '"ब्रँड डील्स कशा मिळवायच्या आणि ब्रँड्सशी कसं बोलायचं याबद्दल कोर्समध्ये इतकी सविस्तर माहिती दिली आहे की मला पहिल्या महिन्यातच माझा पहिला पेड ब्रँड कोलॅबोरेशन मिळाला. हा कोर्स खरोखरच लाइफ चेन्जिंग आहे!"',
    faqTitle: 'वारंवार विचारले जाणारे प्रश्न',
    faqSubtitle: 'कोर्सबद्दल काही शंका आहेत? इथे उत्तरे शोधा.',
    faqQ1: 'कोर्समध्ये काय शिकवलं जातं?',
    faqA1: 'व्हिडिओ स्क्रिप्टिंग, शूटिंग टेक्निक्स, प्रोफेशनल एडिटिंग, सोशल मीडिया ग्रोथ स्ट्रॅटेजी, ब्रँड डील्स कसे मिळवायचे, मोनेटायझेशन, YouTube, Instagram, रील्स, शॉर्ट्स — सर्व काही A to Z शिकवलं जातं.',
    faqQ2: 'कोर्स किती दिवसांचा आहे?',
    faqA2: 'कोर्सचा कालावधी आणि तपशील लवकरच जाहीर केला जाईल. तुम्ही एनरोल केल्यावर तुम्हाला सर्व माहिती मिळेल.',
    faqQ3: 'कोर्ससाठी कोणती उपकरणे लागतात?',
    faqA3: 'सुरुवातीला फक्त तुमचा स्मार्टफोन पुरेसा आहे! कोर्समध्ये फोनवरूनच प्रोफेशनल कंटेंट कसा तयार करायचा हे शिकवलं जातं. पुढे गेल्यावर कॅमेरा आणि इतर उपकरणे कोणती घ्यायची याबद्दलही मार्गदर्शन मिळेल.',
    faqQ4: 'सुशांत यांच्याशी थेट संवाद साधता येतो का?',
    faqA4: 'होय! कोर्समध्ये लाइव्ह Q&A सेशन्स आहेत जिथे तुम्ही सुशांत यांच्याशी थेट बोलू शकता आणि तुमच्या प्रश्नांची उत्तरे मिळवू शकता.',
    webinarTitle: 'सुशांतसोबत वेबिनार बुक करा',
    webinarSubtitle: 'पुढचे फ्री मास्टरक्लास कधी आहेत हे जाणून घेण्यासाठी तुमचं नाव नोंदवा.',
    webinarCta: 'वेबिनारसाठी नोंदणी करा',
    webinarFormName: 'तुमचे नाव',
    webinarFormEmail: 'ईमेल ॲड्रेस',
    webinarFormPhone: 'फोन नंबर',
    footerDesc: 'कंटेंट क्रिएटर, फिल्ममेकर, अभिनेता आणि मेंटॉर. भारतातील 150+ ब्रँड्ससोबत काम केलेल्या सुशांत घाडगे यांच्याकडून शिका.',
    footerLinks: 'लिंक्स',
    footerContact: 'संपर्क',
    footerHome: 'होम',
    footerAbout: 'माझ्याबद्दल',
    footerCourse: 'कोर्स',
    footerBrands: 'ब्रँड्स',
    footerFaq: 'FAQ',
    footerRights: '© 2026 सुशांत घाडगे. सर्व हक्क राखीव.',
  },
  en: {
    heroLine1: 'Give Your Inner Creator',
    heroLine2: 'A Professional Direction',
    heroSubtitle: 'Master the art of high-end storytelling and video production in Marathi. Learn the secrets behind India\'s biggest brands.',
    joinCourse: 'Join Course',
    viewCourse: 'View Course',
    learnMore: 'Learn More',
    newCourseLive: 'NEW COURSE IS NOW LIVE!',
    aboutTitle: 'Who is Sushant Ghadge?',
    aboutSubtitle: 'One of the most influential names in the Marathi digital content industry',
    aboutP1: 'Sushant Ghadge — an actor, filmmaker, and leading name in Marathi digital content. Having acted in Amazon Prime Video\'s "Sharmajee Ki Beti", Sushant has carved a unique niche in the world of content creation.',
    aboutP2: 'Over the years, he has created over 1,000 videos and garnered 2 Billion+ views. He has successfully collaborated with some of India\'s biggest brands — Prime Video, Disney Hotstar, Zomato, Cred, Realme.',
    aboutP3: 'Having built a community of 500K+ people, Sushant is now giving thousands of youths a professional direction in content creation. Now, he brings his entire experience to you through this course.',
    brandDeals: 'Brand Deals',
    totalViews: 'Total Views',
    videosCreated: 'Videos Created',
    community: 'Community',
    followInsta: 'Follow on Instagram',
    videoTitle: 'Learn About the Course',
    videoSubtitle: 'Hear from Sushant — what this course is about, what you will learn, and how it can change your life.',
    videoComingSoon: 'Video coming soon...',
    courseTag: 'Course',
    courseTitle: 'Content Creation Masterclass',
    courseSubtitle: 'Learn how to create content in Marathi — from zero to pro level',
    courseBadge: '🔥 Limited Seats',
    courseCardTitle: 'Content Creation A to Z — Learn in Marathi',
    courseDesc: 'In this course you will learn — Video Scripting, Shooting, Editing, How to get Brand Deals, Social Media Growth Strategy, Monetization and much more. A course built from Sushant Ghadge\'s years of experience.',
    enrollNow: 'Enroll Now',
    securePayment: '100% Secure Payment',
    courseFeature1: 'Video & Editing Mastery',
    courseFeature2: 'Social Media Algorithm Hacks',
    courseFeature3: 'Brand Deals & Monetization',
    brandsTitle: 'Brands Worked With',
    brandsSubtitle: 'Successful collaborations with India\'s top brands',
    testimonialsTitle: 'Student Experiences',
    testimonialsSubtitle: 'Hear what students who learned from Sushant have to say.',
    testi1Name: 'Rahul Mane',
    testi1Role: 'Content Creator (100k+ Followers)',
    testi1Text: '"Sushant sir\'s course completely transformed my videos. Earlier, my videos lacked reach, but thanks to his hook and retention tricks, my videos started going viral."',
    testi2Name: 'Amit Patil',
    testi2Role: 'Freelance Video Editor',
    testi2Text: '"I\'ve taken many video editing courses, but the practical knowledge here is unmatched. I truly learned the art of storytelling and how to keep the audience hooked."',
    testi3Name: 'Sneha Kulkarni',
    testi3Role: 'Vlogger',
    testi3Text: '"The course detailed so much about getting brand deals and communicating with brands that I landed my first paid collaboration in the very first month. This course is truly life-changing!"',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Have doubts about the course? Find answers here.',
    faqQ1: 'What is taught in the course?',
    faqA1: 'Video scripting, shooting techniques, professional editing, social media growth strategies, getting brand deals, monetization, YouTube, Instagram, Reels, Shorts — everything from A to Z is taught.',
    faqQ2: 'What is the duration of the course?',
    faqA2: 'The course duration and details will be announced soon. You will receive all information upon enrollment.',
    faqQ3: 'What equipment is needed for the course?',
    faqA3: 'Initially, just your smartphone is enough! The course teaches how to create professional content using a phone. Later, you will get guidance on which cameras and equipment to buy.',
    faqQ4: 'Can we interact directly with Sushant?',
    faqA4: 'Yes! The course includes live Q&A sessions where you can speak directly with Sushant and get answers to your questions.',
    webinarTitle: 'Book a Webinar with Sushant',
    webinarSubtitle: 'Register your name to know when the next free masterclass is.',
    webinarCta: 'Register for Webinar',
    webinarFormName: 'Your Name',
    webinarFormEmail: 'Email Address',
    webinarFormPhone: 'Phone Number',
    footerDesc: 'Content Creator, Filmmaker, Actor and Mentor. Learn from Sushant Ghadge who has worked with 150+ brands in India.',
    footerLinks: 'Links',
    footerContact: 'Contact',
    footerHome: 'Home',
    footerAbout: 'About Me',
    footerCourse: 'Course',
    footerBrands: 'Brands',
    footerFaq: 'FAQ',
    footerRights: '© 2026 Sushant Ghadge. All rights reserved.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('mr');
  
  const toggleLang = () => {
    setLang(prev => (prev === 'mr' ? 'en' : 'mr'));
  };
  
  const t = (key: string) => {
    const val = (translations[lang] as Record<string, string>)[key];
    return val || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
