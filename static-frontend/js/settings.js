import { API } from './config.js';

// Arabic-only defaults — mirrors frontSettingsDefaults.ar from data.js.
// Used until the API response arrives, and as fallback for blank fields.
const DEFAULTS = {
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
  about_story_paragraph_3: '',

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
  about_intro_title: 'قرون من التقاليد، متاحة اليوم',
  about_intro_text:
    'كل قطعة في مجموعتنا مصدرها مباشرة من عائلات الحرفيين الجزائريين. نكرّم معارفهم ونجلب إليك أرقى ما ينتجون — أصيلاً وممتلئاً بالروح.',

  product_shipping_intro:
    'نشحن إلى جميع أنحاء الجزائر ووجهات دولية مختارة. كل قطعة مفتقشة، ملفوفة بورق acid-free، ومودعة في كيس قطني مطبوع يدوياً قبل الإرسال.',
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
};

// Module-level cache — fetched once per page load, reused by all callers.
let _cache = null;
let _promise = null;

function _merge(apiData) {
  const merged = { ...DEFAULTS };
  if (!apiData) return merged;

  for (const key of Object.keys(DEFAULTS)) {
    const fromApi = apiData[`${key}_ar`] ?? apiData[key];
    if (typeof fromApi === 'string' && fromApi.trim() !== '') {
      merged[key] = fromApi;
    }
  }
  return merged;
}

// Returns the merged settings object. Fetches once; subsequent calls return
// the cached result immediately.
export async function loadSettings() {
  if (_cache) return _cache;

  // If a fetch is already in-flight, wait for it rather than firing again.
  if (!_promise) {
    _promise = fetch(`${API}/home/front-settings/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        _cache = _merge(data);
        return _cache;
      })
      .catch(() => {
        _cache = _merge(null);
        return _cache;
      });
  }

  return _promise;
}
