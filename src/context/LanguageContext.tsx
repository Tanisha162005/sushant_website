'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'mr' | 'en';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => any; // changed to any to support arrays
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
    courseTitle: 'Content Creation Masterclass – Foundation Course',
    courseSubtitle: 'शून्यापासून ते प्रो लेव्हलपर्यंत संपूर्ण मार्गदर्शन',
    courseBadge: '🔥 लिमिटेड सीट्स',
    courseCardTitle: 'Content Creation Masterclass',
    courseDesc: 'या कोर्समध्ये तुम्हाला शिकायला मिळेल — व्हिडिओ स्क्रिप्टिंग, शूटिंग, एडिटिंग, ब्रँड डील्स कसे मिळवायचे, सोशल मीडिया ग्रोथ स्ट्रॅटेजी, मोनेटायझेशन आणि बरंच काही.',
    courseFeature1: 'व्हिडिओ आणि एडिटिंग मास्टरी',
    courseFeature2: 'सोशल मीडिया अल्गोरिदम हॅक्स',
    courseFeature3: 'ब्रँड डील्स आणि मोनेटायझेशन',
    
    // Detailed Course Info
    courseDetailedIntro: 'Content Creation ची सुरुवात करायची आहे, पण नेमकं कुठून सुरू करायचं हे समजत नाही? Niche कशी निवडायची, Content Ideas कशा शोधायच्या, पहिली Reel कशी बनवायची आणि पोस्ट केल्यानंतर पुढे काय करायचं याबद्दल अनेक प्रश्न आहेत? तर हा कोर्स तुमच्यासाठीच आहे.\n\nहा 100% मराठी भाषेतील Foundation Course तुम्हाला Content Creation चा मजबूत पाया तयार करून देण्यासाठी बनवण्यात आला आहे. Content Creation म्हणजे नेमकं काय, योग्य Niche कशी शोधायची, Content Creation साठी System कशी तयार करायची, Idea पासून Video/Reel कशी बनवायची, ती पोस्ट केल्यानंतर पुढे काय करायचं आणि Monetization कडे कसं वाटचाल करायची हे सर्व तुम्ही या कोर्समध्ये Step-by-Step शिकाल.',
    courseLearnTitle: 'या कोर्समध्ये तुम्ही काय शिकाल?',
    courseLearnPoints: [
      'Content Creation म्हणजे नेमकं काय?',
      'स्वतःसाठी योग्य Niche कशी शोधायची?',
      'Content Creation साठी आवश्यक System आणि Planning कशी करायची?',
      'एका साध्या Idea पासून Video/Reel तयार करण्याची संपूर्ण Process.',
      'तुमची पहिली Reel कशी पोस्ट करायची आणि त्यानंतर काय करायचं?',
      'Monetization ची सुरुवात कशी होते आणि पुढील Growth साठी कशी तयारी करायची?'
    ],
    courseWhoTitle: 'हा कोर्स कोणासाठी आहे?',
    courseWhoPoints: [
      'Content Creation ची अगदी सुरुवात करू इच्छिणाऱ्यांसाठी.',
      'ज्यांना Content Creation बद्दल काहीही माहिती नाही आणि Step-by-Step शिकायचं आहे त्यांच्यासाठी.',
      'ज्यांनी आजपर्यंत एकही Reel किंवा Video तयार केलेला नाही अशांसाठी.',
      'Content Creation मध्ये सातत्य आणायचं आहे, पण योग्य दिशा आणि System मिळत नाही अशांसाठी.',
      'तुम्ही आधीच 100-200 किंवा त्याहून अधिक Reels पोस्ट केल्या असतील, पण तरीही Content Strategy, Niche, Systems आणि Growth याबाबत clarity नसेल, तर हा कोर्स तुमच्यासाठी तितकाच उपयुक्त आहे.',
      'विद्यार्थी, Professionals, Business Owners, Freelancers आणि Creators यांच्यासाठी.',
      'Zero पासून सुरुवात करणाऱ्यांपासून ते आपल्या Content Creation च्या Foundation ला अधिक मजबूत करू इच्छिणाऱ्या प्रत्येकासाठी.'
    ],
    courseIncludesTitle: 'Course Includes:',
    courseIncludesPoints: [
      '5 Pre-recorded Video Lessons',
      'भाषा: मराठी (100% Marathi)',
      'Beginner-Friendly & Step-by-Step Learning',
      'Foundation to First Reel Guidance'
    ],
    courseModulesTitle: 'Course Modules:',
    courseModulesPoints: [
      '1. Content Creation ची ओळख',
      '2. Niche शोधणे आणि योग्य System तयार करणे',
      '3. Idea पासून Video/Reel तयार करण्याची Process',
      '4. पहिली Reel पोस्ट केल्यानंतर काय करायचं?',
      '5. Monetization आणि पुढील Growth ची तयारी'
    ],
    courseConclusion: 'Content Creation हा फक्त Reel बनवण्याचा प्रवास नाही, तर स्वतःची ओळख, स्वतःचा आवाज आणि स्वतःची System तयार करण्याचा प्रवास आहे. हा Foundation Course तुम्हाला अगदी Zero Knowledge पासून सुरुवात करून Content Creation चा मजबूत पाया तयार करण्यास मदत करेल.\n\nतुम्ही अगदी सुरुवात करत असाल किंवा पुन्हा एकदा योग्य Foundation तयार करू इच्छित असाल, हा कोर्स तुमच्या Content Creation च्या प्रवासातील महत्त्वाची पहिली पायरी ठरेल.',
    courseRequirementsTitle: 'कोर्ससाठी काय लागतं?',
    courseRequirementsPoints: [
      'एक स्मार्टफोन (कोणताही)',
      'इंटरनेट कनेक्शन',
      'शिकण्याची आणि सुरुवात करण्याची तयारी',
      'कोणत्याही आधीच्या अनुभवाची गरज नाही'
    ],
    courseAchieveTitle: 'कोर्स पूर्ण केल्यानंतर तुम्ही काय करू शकाल?',
    courseAchievePoints: [
      'तुमची स्वतःची Content Niche शोधू शकाल',
      'Content Creation साठी एक मजबूत System तयार करू शकाल',
      'तुमची पहिली Reel तयार आणि पोस्ट करू शकाल',
      'Content Strategy आणि Planning मध्ये clarity मिळेल',
      'Monetization कडे वाटचाल करण्याची दिशा मिळेल'
    ],
    whatsIncluded: 'यात काय समाविष्ट आहे',

    enrollNow: 'आत्ताच एनरोल करा',
    securePayment: '100% सुरक्षित पेमेंट',
    needHelp: 'मदत हवी आहे? संपर्क साधा',
    
    // Login & Register Pages
    welcomeBack: 'परत स्वागत आहे',
    createYourAccount: 'तुमचे मोफत अकाउंट तयार करा',
    joinThousands: 'कंटेंट क्रिएशन शिकणाऱ्या हजारो क्रिएटर्समध्ये सामील व्हा',
    fullName: 'पूर्ण नाव',
    creatingAccount: 'अकाउंट तयार करत आहे...',
    alreadyHaveAccount: 'आधीपासून अकाउंट आहे? ',
    signInArrow: 'साइन इन करा →',
    signInToContinue: 'तुमचा कंटेंट क्रिएशनचा प्रवास सुरू ठेवण्यासाठी साइन इन करा.',
    emailAddress: 'ईमेल पत्ता',
    password: 'पासवर्ड',
    signIn: 'साइन इन करा',
    or: 'किंवा',
    continueWithGoogle: 'Google द्वारे सुरू ठेवा',
    dontHaveAccount: 'अकाउंट नाहीये? ',
    createAccount: 'नवीन अकाउंट तयार करा →',
    
    // Dashboard Page
    myMasterclasses: 'माझे मास्टरक्लासेस',
    accessPurchasedCourses: 'तुमचे खरेदी केलेले कोर्सेस पहा आणि शिकायला सुरुवात करा.',
    noCoursesYet: 'तुम्ही अद्याप कोणतेही कोर्सेस खरेदी केलेले नाहीत.',
    exploreCourses: 'कोर्सेस एक्सप्लोर करा',
    orderHistory: 'ऑर्डर हिस्ट्री',
    reviewTransactions: 'तुमच्या मागील व्यवहारांचे तपशील.',
    orderId: 'ऑर्डर आयडी',
    date: 'तारीख',
    amount: 'रक्कम',
    status: 'स्थिती',
    noOrderHistory: 'कोणतीही ऑर्डर हिस्ट्री आढळली नाही.',
    startLearning: 'शिकायला सुरुवात करा',
    browseCourses: 'कोर्सेस पहा',
    signOut: 'साइन आउट',
    soon: 'लवकरच',
    preparing: '⏳ तयार करत आहे...',
    downloadResources: '📥 रिसोर्सेस डाउनलोड करा',
    checkOutOurLatest: 'आमचे नवीन कोर्सेस पहा आणि शिकायला सुरुवात करा.',
    downloadableFiles: 'डाउनलोड करण्यायोग्य फाईल्स',
    protectedSignedUrls: 'सुरक्षित 15-मिनिटांचे डाउनलोड लिंक्स.',
    resourceZip: 'रिसोर्स ZIP • सुरक्षित लिंक',
    download: 'डाउनलोड करा',
    noDownloads: 'अद्याप कोणत्याही डाउनलोड फाईल्स उपलब्ध नाहीत.',
    transactionsVerification: 'तुमचे व्यवहार आणि पेमेंट तपशील.',
    successful: '✓ यशस्वी',
    course: 'कोर्स',

    brandsTitle: 'ज्या ब्रँड्ससोबत काम केलं',
    brandsSubtitle: 'भारतातील टॉप ब्रँड्ससोबत यशस्वी कोलॅबोरेशन्स',
    testimonialsTitle: 'विद्यार्थ्यांचे अनुभव',
    testimonialsSubtitle: 'सुशांत यांच्याकडून शिकलेले विद्यार्थी आज काय म्हणत आहेत ते ऐका.',
    testi1Name: 'राहुल माने',
    testi1Role: 'Content Creator',
    testi1Text: '"सुशांत सरांच्या कोर्समुळे माझ्या व्हिडिओंमध्ये खूप मोठी सुधारणा झाली. पूर्वी माझ्या व्हिडिओंना रीच मिळत नव्हता, पण त्यांनी सांगितलेल्या हुक आणि रिटेन्शन ट्रिक्समुळे माझे व्हिडिओ व्हायरल व्हायला लागले."',
    testi2Name: 'अमित पाटील',
    testi2Role: 'Video Editor',
    testi2Text: '"मी अनेक व्हिडिओ एडिटिंग कोर्स केले आहेत, पण या कोर्समध्ये जे प्रॅक्टिकल नॉलेज मिळालं ते कुठेच मिळालं नाही. स्टोरीटेलिंग कशी असावी आणि प्रेक्षकांना कसं बांधून ठेवावं हे मला खऱ्या अर्थाने इथे शिकायला मिळालं."',
    testi3Name: 'स्नेहा कुलकर्णी',
    testi3Role: 'Vlogger',
    testi3Text: '"ब्रँड डील्स कशा मिळवायच्या आणि ब्रँड्सशी कसं बोलायचं याबद्दल कोर्समध्ये इतकी सविस्तर माहिती दिली आहे की मला पहिल्या महिन्यातच माझा पहिला पेड ब्रँड कोलॅबोरेशन मिळाला. हा कोर्स खरोखरच लाइफ चेन्जिंग आहे!"',
    testi4Name: 'प्रणव के.',
    testi4Role: 'Content Creator',
    testi4Text: '"मला Foundation Course मधला System विषयीचा व्हिडिओ खूप आवडला. Content Creation मध्ये consistency कशी ठेवायची आणि स्वतःची workflow कशी तयार करायची, हे मला पहिल्यांदाच इतकं सोप्या पद्धतीने समजलं. आता मी random पद्धतीने काम करत नाही, तर एका ठरलेल्या system नुसार content तयार करतो. त्यामुळे execution खूप improve झालं आहे."',
    testi5Name: 'नेहा एस.',
    testi5Role: 'Aspiring Creator',
    testi5Text: '"मी Sushant Helps Creators ला follow करायला सुरुवात केल्यापासून content कडे पाहण्याचा माझा दृष्टिकोनच बदलला. काही आठवड्यांतच माझ्या account वर 2,000+ नवीन followers आले आणि माझ्या एका Reel ने 1 Million+ reach मिळवली. सर्वात महत्त्वाचं म्हणजे, आता मला काय पोस्ट करायचं आणि का पोस्ट करायचं याची clarity आहे."',
    testi6Name: 'रितेश डी.',
    testi6Role: 'Video Creator',
    testi6Text: '"मी Foundation Course Community Wall वर trial म्हणून पाहिला होता. त्याआधी Content Creation म्हणजे फक्त Reel पोस्ट करणं असं मला वाटायचं. पण हा कोर्स केल्यानंतर मला Niche, Strategy आणि Direction बद्दल खूप clarity मिळाली. आता मी random content बनवत नाही, तर एका system नुसार काम करतो. हा कोर्स माझ्यासाठी game changer ठरला."',
    faqTitle: 'वारंवार विचारले जाणारे प्रश्न',
    faqSubtitle: 'कोर्सबद्दल काही शंका आहेत? इथे उत्तरे शोधा.',
    faqQ1: 'कोर्समध्ये काय शिकवलं जातं?',
    faqA1: 'व्हिडिओ स्क्रिप्टिंग, शूटिंग टेक्निक्स, प्रोफेशनल एडिटिंग, सोशल मीडिया ग्रोथ स्ट्रॅटेजी, ब्रँड डील्स कसे मिळवायचे, मोनेटायझेशन, YouTube, Instagram, रील्स, शॉर्ट्स — सर्व काही A to Z शिकवलं जातं.',
    faqQ2: 'कोर्स किती दिवसांचा आहे?',
    faqA2: 'हा कोर्स 5 Pre-recorded Video Lessons चा आहे. तुम्ही तुमच्या वेळेनुसार हा कोर्स पूर्ण करू शकता.',
    faqQ3: 'कोर्ससाठी कोणती उपकरणे लागतात?',
    faqA3: 'सुरुवातीला फक्त तुमचा स्मार्टफोन पुरेसा आहे! कोर्समध्ये फोनवरूनच प्रोफेशनल कंटेंट कसा तयार करायचा हे शिकवलं जातं.',
    faqQ4: 'लाइफटाइम ॲक्सेस मिळेल का?',
    faqA4: 'होय! कोर्सला लाइफटाइम ॲक्सेस मिळतो आणि भविष्यातील सर्व अपडेट्स मोफत मिळतात.',
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
    heroLine1: 'Become A Pro',
    heroLine2: 'Content Creator',
    heroSubtitle: 'Learn high-quality storytelling and video production. Discover the secrets behind India\'s biggest brands.',
    joinCourse: 'Join Course',
    viewCourse: 'View Course',
    learnMore: 'Learn More',
    newCourseLive: 'New Course is now live!',
    aboutTitle: 'Who is Sushant Ghadge?',
    aboutSubtitle: 'One of the most influential names in the content creation industry',
    aboutP1: 'Sushant Ghadge — an actor, filmmaker, and a leading name in the digital content world. Having acted in Amazon Prime Video\'s "Sharmajee Ki Beti", Sushant has created a distinct identity in content creation.',
    aboutP2: 'Over the years, he has created over 1,000 videos and gained 2 Billion+ views. He has successfully collaborated with India\'s biggest brands — Prime Video, Disney Hotstar, Zomato, Cred, Realme.',
    aboutP3: 'By building a community of 500K+ people, Sushant is giving professional direction to thousands of youth today. Now he is bringing his entire experience to you through this course.',
    brandDeals: 'Brand Deals',
    totalViews: 'Total Views',
    videosCreated: 'Videos Created',
    community: 'Community',
    followInsta: 'Follow on Instagram',
    videoTitle: 'Learn about the course',
    videoSubtitle: 'Hear from Sushant — what this course is about, what you will learn, and how it can change your life.',
    videoComingSoon: 'Video coming soon...',
    courseTag: 'Course',
    courseTitle: 'Content Creation Masterclass – Foundation Course',
    courseSubtitle: 'Complete guidance from zero to pro level',
    courseBadge: '🔥 Limited Seats',
    courseCardTitle: 'Content Creation Masterclass',
    courseDesc: 'In this course you will learn — video scripting, shooting, editing, how to get brand deals, social media growth strategy, monetization, and much more.',
    courseFeature1: 'Video & Editing Mastery',
    courseFeature2: 'Social Media Algorithm Hacks',
    courseFeature3: 'Brand Deals & Monetization',

    // Detailed Course Info
    courseDetailedIntro: 'Do you want to start Content Creation, but don\'t know exactly where to begin? Have many questions about how to choose a Niche, how to find Content Ideas, how to make the first Reel, and what to do after posting? Then this course is for you.\n\nThis Foundation Course is designed to help you build a strong foundation in Content Creation. What exactly is Content Creation, how to find the right Niche, how to build a System for Content Creation, how to turn an Idea into a Video/Reel, what to do after posting it, and how to move towards Monetization—you will learn all this Step-by-Step in this course.',
    courseLearnTitle: 'What will you learn in this course?',
    courseLearnPoints: [
      'What exactly is Content Creation?',
      'How to find the right Niche for yourself?',
      'How to do the necessary Planning and create a System for Content Creation?',
      'The complete Process of turning a simple Idea into a Video/Reel.',
      'How to post your first Reel and what to do after that?',
      'How does Monetization start and how to prepare for further Growth?'
    ],
    courseWhoTitle: 'Who is this course for?',
    courseWhoPoints: [
      'For those who want to start from the very beginning of Content Creation.',
      'For those who know nothing about Content Creation and want to learn Step-by-Step.',
      'For those who haven\'t created a single Reel or Video yet.',
      'For those who want consistency in Content Creation but are not getting the right direction and System.',
      'If you have already posted 100-200 or more Reels but still lack clarity on Content Strategy, Niche, Systems, and Growth, then this course is equally useful for you.',
      'For Students, Professionals, Business Owners, Freelancers, and Creators.',
      'From those starting from Zero to everyone who wants to strengthen their Content Creation Foundation.'
    ],
    courseIncludesTitle: 'Course Includes:',
    courseIncludesPoints: [
      '5 Pre-recorded Video Lessons',
      'Language: English',
      'Beginner-Friendly & Step-by-Step Learning',
      'Foundation to First Reel Guidance'
    ],
    courseModulesTitle: 'Course Modules:',
    courseModulesPoints: [
      '1. Introduction to Content Creation',
      '2. Finding a Niche and building the right System',
      '3. Process of creating a Video/Reel from an Idea',
      '4. What to do after posting the first Reel?',
      '5. Monetization and preparation for further Growth'
    ],
    courseConclusion: 'Content Creation is not just a journey of making Reels, but a journey of building your identity, your voice, and your System. This Foundation Course will help you start from Zero Knowledge and build a strong foundation for Content Creation.\n\nWhether you are just starting out or want to build the right Foundation again, this course will prove to be the most important first step in your Content Creation journey.',
    courseRequirementsTitle: 'What do you need?',
    courseRequirementsPoints: [
      'A smartphone (any)',
      'Internet connection',
      'Willingness to learn and start',
      'No prior experience required'
    ],
    courseAchieveTitle: 'What will you achieve after this course?',
    courseAchievePoints: [
      'Find your own Content Niche',
      'Build a strong System for Content Creation',
      'Create and post your first Reel',
      'Gain clarity in Content Strategy and Planning',
      'Get a clear direction towards Monetization'
    ],
    whatsIncluded: "What's Included",

    enrollNow: 'Enroll Now',
    securePayment: '100% Secure Payment',
    needHelp: 'Need Help? Contact Support',
    
    // Login & Register Pages
    welcomeBack: 'Welcome Back',
    createYourAccount: 'Create your free account',
    joinThousands: 'Join thousands of creators mastering content creation',
    fullName: 'Full Name',
    creatingAccount: 'Creating Account...',
    alreadyHaveAccount: 'Already have an account? ',
    signInArrow: 'Sign In →',
    signInToContinue: 'Sign in to continue your content creation journey.',
    emailAddress: 'Email Address',
    password: 'Password',
    signIn: 'Sign In',
    or: 'or',
    continueWithGoogle: 'Continue with Google',
    dontHaveAccount: 'Don\'t have an account? ',
    createAccount: 'Create account →',
    
    // Dashboard Page
    myMasterclasses: 'My Masterclasses',
    accessPurchasedCourses: 'Access your purchased courses and start learning.',
    noCoursesYet: 'You haven\'t purchased any courses yet.',
    exploreCourses: 'Explore Courses',
    orderHistory: 'Order History',
    reviewTransactions: 'Review your past transactions.',
    orderId: 'Order ID',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    noOrderHistory: 'No order history found.',
    startLearning: 'Start Learning',
    browseCourses: 'Browse Courses',
    signOut: 'Sign Out',
    soon: 'Soon',
    preparing: '⏳ Preparing...',
    downloadResources: '📥 Download Resources',
    checkOutOurLatest: 'Check out our latest masterclasses and start your journey.',
    downloadableFiles: 'Downloadable Course Files',
    protectedSignedUrls: 'Protected, short-lived 15-minute signed URL downloads.',
    resourceZip: 'Resource ZIP • Protected Signed URL',
    download: 'Download',
    noDownloads: 'No downloadable files available yet.',
    transactionsVerification: 'Your transactions and payment verification receipts.',
    successful: '✓ Successful',
    course: 'Course',

    brandsTitle: 'Brands Worked With',
    brandsSubtitle: 'Successful collaborations with India\'s top brands',
    testimonialsTitle: 'Student Experiences',
    testimonialsSubtitle: 'Listen to what students who learned from Sushant are saying today.',
    testi1Name: 'Rahul Mane',
    testi1Role: 'Content Creator',
    testi1Text: '"Sushant Sir\'s course brought a massive improvement in my videos. Earlier, my videos were not getting reach, but with his hook and retention tricks, my videos started going viral."',
    testi2Name: 'Amit Patil',
    testi2Role: 'Video Editor',
    testi2Text: '"I have done many video editing courses, but the practical knowledge I got in this course, I found nowhere else. I truly learned here what storytelling should be like and how to keep the audience hooked."',
    testi3Name: 'Sneha Kulkarni',
    testi3Role: 'Vlogger',
    testi3Text: '"The course gives such detailed information on how to get brand deals and how to talk to brands that I got my first paid brand collaboration in the very first month. This course is truly life changing!"',
    testi4Name: 'Pranav K.',
    testi4Role: 'Content Creator',
    testi4Text: '"I really liked the video about the System in the Foundation Course. For the first time, I understood so easily how to maintain consistency in Content Creation and how to build my own workflow. Now I don\'t work randomly, but create content according to a set system. Because of this, my execution has improved a lot."',
    testi5Name: 'Neha S.',
    testi5Role: 'Aspiring Creator',
    testi5Text: '"Ever since I started following Sushant Helps Creators, my perspective on looking at content has completely changed. In just a few weeks, my account gained 2,000+ new followers and one of my Reels reached 1 Million+. Most importantly, now I have clarity on what to post and why to post."',
    testi6Name: 'Ritesh D.',
    testi6Role: 'Video Creator',
    testi6Text: '"I had watched the Foundation Course as a trial on the Community Wall. Before that, I thought Content Creation just meant posting a Reel. But after taking this course, I got a lot of clarity about Niche, Strategy, and Direction. Now I don\'t create random content, but work according to a system. This course proved to be a game changer for me."',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Have any doubts about the course? Find answers here.',
    faqQ1: 'What is taught in the course?',
    faqA1: 'Video scripting, shooting techniques, professional editing, social media growth strategy, how to get brand deals, monetization, YouTube, Instagram, Reels, Shorts — everything is taught from A to Z.',
    faqQ2: 'How long is the course?',
    faqA2: 'This course consists of 5 Pre-recorded Video Lessons. You can complete this course at your own pace.',
    faqQ3: 'What equipment is needed for the course?',
    faqA3: 'In the beginning, just your smartphone is enough! The course teaches how to create professional content straight from the phone.',
    faqQ4: 'Will I get lifetime access?',
    faqA4: 'Yes! You get lifetime access to the course and all future updates are free.',
    footerDesc: 'Content Creator, Filmmaker, Actor, and Mentor. Learn from Sushant Ghadge who has worked with 150+ brands in India.',
    footerLinks: 'Links',
    footerContact: 'Contact',
    footerHome: 'Home',
    footerAbout: 'About Me',
    footerCourse: 'Course',
    footerBrands: 'Brands',
    footerFaq: 'FAQ',
    footerRights: '© 2026 Sushant Ghadge. All Rights Reserved.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('mr');
  
  const toggleLang = () => {
    setLang(prev => (prev === 'mr' ? 'en' : 'mr'));
  };
  
  const t = (key: string) => {
    const val = (translations[lang] as Record<string, any>)[key];
    return val || key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-mr');
    } else {
      document.body.classList.add('lang-mr');
      document.body.classList.remove('lang-en');
    }
  }, [lang]);

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
