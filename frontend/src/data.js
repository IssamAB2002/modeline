// Default copy for FrontSettings-backed fields. Used until the
// /api/front-settings/ response arrives, and as a fallback for any
// field the admin has left blank. Keyed by language so the UI can
// fall back ar -> en -> these defaults based on the active locale.
export const frontSettingsDefaults = {
  ar: {
    home_topbar: 'شحن مجاني للطلبات التي تتجاوز 5,000 دج · حرفية أصيلة مضمونة',
    home_nav_logo_tagline: '',
    home_hero_eyebrow: 'أصيل · تراثي · راقي',
    home_hero_title_line1: 'ارتدِ',
    home_hero_title_emphasis: 'لغة',
    home_hero_title_line3: 'أجدادك',
    home_hero_subtitle:
      'ملابس تقليدية راقية وملابس أطفال وإكسسوارات — أجمل ما في التراث الجزائري، يصل إلى بابك.',

    about_hero_title_main: 'قصتنا',
    about_hero_title_emphasis: '',
    about_hero_subtitle:
      'ثلاثة عقود من التفاني في تقديم الملابس التقليدية الجزائرية — تُلبس وتُقدَّر وتُرث.',
    about_story_title_main: 'متجر عائلي،',
    about_story_title_emphasis: 'راسخ في التراث',
    about_story_paragraph_1:
      'اكتشف الحاج مراد عالم الملابس التقليدية في المدينة العتيقة بتلمسان. ما بدأ كمتجر صغير في قصبة الجزائر، تطوّر إلى تشكيلة منتقاة من العائلات الحرفية الموثوقة تمتد عبر ست ولايات — إلا أن الروح ظلّت كما هي.',
    about_story_paragraph_2:
      'نتعامل حصرياً مع حرفيين متمكنين توارثوا تقنياتهم عبر ثلاثة أجيال على الأقل. تخضع كل قطعة للفحص الدقيق قبل أن تصل إليك — موثّقة، ومرفقة بشهادة تحمل اسم الحرفي الذي صنعها.',

    about_stat_1_value: '30+',
    about_stat_1_label: 'سنة من الخبرة',
    about_stat_2_value: '6',
    about_stat_2_label: 'ولايات حرفية',
    about_stat_3_value: '48',
    about_stat_3_label: 'عائلة حرفية',
    about_stat_4_value: '4k+',
    about_stat_4_label: 'عميل سعيد',
    about_story_image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
    about_story_image_full_url: '',
    about_story_image_label: 'تلمسان — مجموعة 2024',

    about_intro_eyebrow: 'التزامنا',
    about_intro_title: 'قرون من {{em}}التقاليد{{/em}}، متاحة اليوم',
    about_intro_text:
      'كل قطعة في مجموعتنا مصدرها مباشرة من عائلات الحرفيين الجزائريين. نكرّم معارفهم ونجلب إليك أرقى ما ينتجون — أصيلاً وممتلئاً بالروح.',

    product_shipping_intro: 'نشحن إلى جميع أنحاء الجزائر ووجهات دولية مختارة. كل قطعة مفتقشة، ملفوفة بورق acid-free، ومودعة في كيس قطني مطبوع يدوياً قبل الإرسال.',
    product_shipping_algeria: 'الجزائر: 2–4 أيام عمل (مجاني فوق 5000 دج)',
    product_shipping_france: 'فرنسا وأوروبا: 5–8 أيام عمل',
    product_shipping_tracking: 'جميع الشحنات تشمل التتبع والتأمين.',

    contact_hero_title_main: 'تواصل',
    contact_hero_title_emphasis: 'مع Modeline',
    contact_hero_subtitle:
      'سواء كنت تسعى لطلب مخصص، ترغب في زيارة صالات عرضنا، أو لديك سؤال — نحن هنا.',
    contact_intro_title_main: 'كل استفسار يستحق',
    contact_intro_title_emphasis: 'عناية ردّ',
    contact_intro_text:
      'نؤمن بأن العلاقة بين المتجر وعملائه يجب أن تكون باقية كالألبسة التي نوفرها. سواء كنت تطلب قطعة لمناسبة خاصة، أو تحتاج إرشاداً حول المقاسات والملاءمة، أو ترغب في زيارة صالات عرضنا — نقرأ كل رسالة بذات الاهتمام الذي نبذله لكل تفصيل.',
  },
  en: {
    home_topbar: 'Free shipping on orders over 5,000 DA · Authentic craftsmanship guaranteed',
    home_nav_logo_tagline: '',
    home_hero_eyebrow: 'Handcrafted · Authentic · Heritage',
    home_hero_title_line1: 'Dress in the',
    home_hero_title_emphasis: 'Language',
    home_hero_title_line3: 'of Your Ancestors',
    home_hero_subtitle:
      'Fine traditional garments, kids\' clothing, and accessories — the very best of Algerian heritage, brought to your door.',

    about_hero_title_main: 'Our',
    about_hero_title_emphasis: 'Story',
    about_hero_subtitle:
      'Three decades of devotion to Algerian traditional clothing — worn, cherished, and passed down.',
    about_story_title_main: 'A family store,',
    about_story_title_emphasis: 'rooted in tradition',
    about_story_paragraph_1:
      "Hadj Mourad discovered his love for traditional Algerian dress in the old medina of Tlemcen. What began as a small boutique in the Casbah of Algiers has grown into a curated selection from trusted artisan families spanning six wilayas — yet the ethos remains unchanged.",
    about_story_paragraph_2:
      'We source exclusively from master craftspeople who have inherited their techniques across at least three generations. Every piece is carefully selected and inspected before reaching you — authenticated, documented, and accompanied by a certificate naming the artisan who made it.',

    about_stat_1_value: '30+',
    about_stat_1_label: 'Years of Heritage',
    about_stat_2_value: '6',
    about_stat_2_label: 'Craft Wilayas',
    about_stat_3_value: '48',
    about_stat_3_label: 'Artisan Families',
    about_stat_4_value: '4k+',
    about_stat_4_label: 'Happy Clients',
    about_story_image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
    about_story_image_full_url: '',
    about_story_image_label: 'Tlemcen Traditional Collection, 2024',

    about_intro_eyebrow: 'Our Commitment',
    about_intro_title: 'Centuries of {{em}}Tradition{{/em}}, Available Today',
    about_intro_text:
      'Every garment in our collection is sourced directly from Algerian artisan families. We honour their knowledge and bring their finest work to you — unadulterated and full of soul.',

    product_shipping_intro: 'We ship across Algeria and to selected international destinations. Every piece is inspected, wrapped in acid-free tissue, and placed in a hand-stamped cotton bag before dispatch.',
    product_shipping_algeria: 'Algeria: 2–4 business days (free above 5,000 DA)',
    product_shipping_france: 'France & Europe: 5–8 business days',
    product_shipping_tracking: 'All shipments include tracking and insurance.',

    contact_hero_title_main: 'Reach',
    contact_hero_title_emphasis: 'Our Store',
    contact_hero_subtitle:
      'Whether you seek a custom order, wish to visit our showrooms, or simply have a question — we are here.',
    contact_intro_title_main: 'Every inquiry deserves',
    contact_intro_title_emphasis: 'the care of a reply',
    contact_intro_text:
      'We believe that the relationship between a store and its patrons should be as enduring as the garments we offer. Whether you are ordering a piece for a special occasion, seeking guidance on sizing and fit, or wishing to arrange a visit to our showrooms — we read every message with the same attention we give to every detail.',
  },
};

export const fallbackStorefront = {
  topbar: 'Free shipping on orders over 5,000 DA · Authentic craftsmanship guaranteed',
  nav: {
    brand: 'MODELINE',
    tagline: '',
    logo: '/image.png',
    links: ['Home', 'Shop', 'About', 'Contact US'],
  },
  hero: {
    eyebrow: 'Handcrafted · Authentic · Heritage',
    title: ['Dress in the', 'Language', 'of Your Ancestors'],
    subtitle:
      'Fine traditional garments, kids\' clothing, and accessories — the very best of Algerian heritage, brought to your door.',
    primaryCta: 'Discover Collections',
    secondaryCta: 'Our Story',
  },
  categories: [
    {
      label: 'Featured Collection',
      title: 'Traditional Robes & Kaftans',
      cta: 'Browse All',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      alt: 'Traditional Robes',
      featured: true,
    },
    {
      label: "Men's",
      title: 'Burnous & Djellabas',
      cta: 'Shop Now',
      image: 'https://images.unsplash.com/photo-1597466599360-3b596c3d7cb7?w=600&q=80',
      alt: "Men's Burnous",
    },
    {
      label: "Women's",
      title: 'Haik & Chedda',
      cta: 'Shop Now',
      image: 'https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=600&q=80',
      alt: "Women's Haik",
    },
    {
      label: 'Kids',
      title: 'Boys & Girls Traditional Wear',
      cta: 'Shop Now',
      image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80',
      alt: "Kids' Traditional Clothing",
    },
    {
      label: 'Heritage',
      title: 'Belts & Accessories',
      cta: 'Explore',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
      alt: 'Traditional Equipment',
    },
    {
      label: 'Footwear',
      title: 'Babouches & Sandals',
      cta: 'View All',
      image: 'https://images.unsplash.com/photo-1600074169098-16a54d791d0d?w=600&q=80',
      alt: 'Handcrafted Footwear',
    },
  ],
  products: [
    {
      badge: 'New',
      name: 'Grand Ivory Burnous',
      origin: 'Tlemcen Craft, Wool blend',
      price: '12,500 DA',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
      alt: 'Ivory Burnous',
    },
    {
      badge: 'Bestseller',
      name: 'Constantine Silk Kaftan',
      origin: 'Hand-embroidered, Pure silk',
      oldPrice: '24,000 DA',
      price: '19,800 DA',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&q=80',
      alt: 'Embroidered Kaftan',
    },
    {
      name: 'Chechia & Tagelmust Set',
      origin: 'Kabylie wool, handloomed',
      price: '3,200 DA',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80',
      alt: 'Traditional Headwear',
    },
    {
      badge: 'Limited',
      name: 'Ornate Khodmi Belt',
      origin: 'Silver-thread, Annaba craft',
      price: '8,900 DA',
      image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=500&q=80',
      alt: 'Ceremonial Belt',
    },
  ],
  story: {
    eyebrow: 'Our Commitment',
    title: ['Centuries of', 'Tradition,', 'Available Today'],
    text:
      'Every garment in our collection is sourced directly from Algerian artisan families. We honour their knowledge and bring their finest work to you — unadulterated and full of soul.',
    cta: 'Explore Our Collection',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    alt: 'Heritage craftsmanship',
  },
  trust: [
    {
      icon: '✦',
      label: 'Same-Day Dispatch',
      description: 'Orders confirmed before 14:00 ship the same afternoon',
    },
    {
      icon: '◈',
      label: 'Certified Authentic',
      description: 'Every piece is verified for authenticity before it reaches you',
    },
    {
      icon: '⬡',
      label: 'Easy Returns',
      description: '30-day hassle-free returns on all items',
    },
    {
      icon: '◇',
      label: 'Secure Payment',
      description: 'CIB, Edahabia and cash on delivery accepted',
    },
  ],
  testimonials: [
    {
      name: 'Fatima B.',
      place: 'Constantine, Algeria',
      text:
        "The burnous I received for my son's wedding was beyond expectation. The wool quality, the stitching - everything spoke of genuine craftsmanship.",
    },
    {
      name: 'Karim M.',
      place: 'Oran, Algeria',
      text:
        'Ordered the Tlemcen kaftan as a gift for my mother. It arrived beautifully wrapped within 24 hours, exactly as described.',
    },
    {
      name: 'Nour El-Houda K.',
      place: 'Algiers, Algeria',
      text:
        'Exceptional quality and fast shipping. The embroidery work on the ceremonial piece I bought is simply museum-worthy.',
    },
  ],
  newsletter: {
    title: ['Receive', 'Rare Finds', 'Before Anyone Else'],
    subtitle:
      'Join our circle — new arrivals, seasonal lookbooks and exclusive offers delivered to your inbox.',
    placeholder: 'Your email address...',
    button: 'Subscribe',
  },
  footer: {
    brand: 'MODELINE',
    tagline: '',
    description:
      'A family-run store dedicated to bringing you the finest Algerian traditional clothing and kids\' wear. Every piece tells a story.',
    columns: [
      {
        title: 'Collections',
        links: [
          "Men's Burnous",
          "Women's Kaftans",
          'Ceremonial Wear',
          'Heritage Equipment',
          'Footwear',
          'New Arrivals',
        ],
      },
      {
        title: 'Information',
        links: [
          'Our Story',
          'Our Suppliers',
          'Authenticity Policy',
          'Shipping & Delivery',
          'Returns',
          'Size Guide',
        ],
      },
      {
        title: 'Contact',
        links: ['WhatsApp Us', 'Email Us', 'Visit Our Showroom', 'Track Your Order'],
      },
    ],
    socials: ['f', 'in', 'wa', 'ig'],
    bottomLeft: 'Copyright 2026 MODELINE. All rights reserved.',
    bottomRight: 'Algiers · Oran · Constantine',
  },
};
