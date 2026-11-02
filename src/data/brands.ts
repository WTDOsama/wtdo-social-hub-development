/**
 * سجل أيقونات العلامات التجارية الرسمية (Simple Icons)
 * تُستخدم مسارات SVG الأصلية مع ألوان العلامة الرسمية.
 */
import {
  siWhatsapp,
  siYoutube,
  siInstagram,
  siTiktok,
  siFacebook,
  siMessenger,
  siTelegram,
  siX,
  siGmail,
  siGoogledrive,
  siSnapchat,
  siPinterest,
  siGithub,
  siNotion,
  siDiscord,
  siReddit,
  siSpotify,
  siNetflix,
  siFigma,
  siTwitch,
  siThreads,
  siWikipedia,
  siGooglemaps,
  siGoogletranslate,
  siZoom,
  siCloudflare,
  siVercel,
  siClaude,
} from "simple-icons";

export interface Brand {
  path: string;
  hex: string;
  label: string;
  /** لون الشعار فوق الخلفية الداكنة (افتراضيًا لون العلامة) */
  ink?: string;
}

/** مسار LinkedIn الرسمي (أُزيل من المكتبة بطلب قانوني، والمسار نفسه محفوظ هنا) */
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z";

export const BRANDS: Record<string, Brand> = {
  whatsapp: { path: siWhatsapp.path, hex: "25D366", label: "واتساب" },
  "whatsapp-business": { path: siWhatsapp.path, hex: "00A884", label: "واتساب للأعمال" },
  youtube: { path: siYoutube.path, hex: "FF0000", label: "يوتيوب" },
  "youtube-studio": { path: siYoutube.path, hex: "FF4E45", label: "يوتيوب ستوديو" },
  instagram: { path: siInstagram.path, hex: "FF0069", label: "إنستغرام" },
  tiktok: { path: siTiktok.path, hex: "69C9D0", ink: "F8FAFC", label: "تيك توك" },
  facebook: { path: siFacebook.path, hex: "0866FF", label: "فيسبوك" },
  messenger: { path: siMessenger.path, hex: "00B2FF", label: "ماسنجر" },
  telegram: { path: siTelegram.path, hex: "26A5E4", label: "تيليجرام" },
  x: { path: siX.path, hex: "F8FAFC", ink: "F8FAFC", label: "إكس" },
  gmail: { path: siGmail.path, hex: "EA4335", label: "جيميل" },
  "google-drive": { path: siGoogledrive.path, hex: "34A853", label: "جوجل درايف" },
  linkedin: { path: LINKEDIN_PATH, hex: "0A66C2", label: "لينكدإن" },
  snapchat: { path: siSnapchat.path, hex: "FFFC00", label: "سناب شات" },
  pinterest: { path: siPinterest.path, hex: "BD081C", label: "بينتريست" },
  github: { path: siGithub.path, hex: "E6EDF3", ink: "E6EDF3", label: "GitHub" },
  notion: { path: siNotion.path, hex: "F8FAFC", ink: "F8FAFC", label: "Notion" },
  discord: { path: siDiscord.path, hex: "5865F2", label: "Discord" },
  reddit: { path: siReddit.path, hex: "FF4500", label: "Reddit" },
  spotify: { path: siSpotify.path, hex: "1ED760", label: "Spotify" },
  netflix: { path: siNetflix.path, hex: "E50914", label: "Netflix" },
  figma: { path: siFigma.path, hex: "F24E1E", label: "Figma" },
  twitch: { path: siTwitch.path, hex: "9146FF", label: "Twitch" },
  threads: { path: siThreads.path, hex: "F8FAFC", ink: "F8FAFC", label: "Threads" },
  wikipedia: { path: siWikipedia.path, hex: "F8FAFC", ink: "F8FAFC", label: "ويكيبيديا" },
  "google-maps": { path: siGooglemaps.path, hex: "34A853", label: "خرائط جوجل" },
  "google-translate": { path: siGoogletranslate.path, hex: "4285F4", label: "ترجمة جوجل" },
  zoom: { path: siZoom.path, hex: "0B5CFF", label: "Zoom" },
  cloudflare: { path: siCloudflare.path, hex: "F38020", label: "Cloudflare" },
  vercel: { path: siVercel.path, hex: "F8FAFC", ink: "F8FAFC", label: "Vercel" },
  claude: { path: siClaude.path, hex: "D97757", label: "Claude" },
};

/** ألوان البلاطة المشتقة من العلامة التجارية */
export function brandTile(key: string): { bg: string; fg: string; border: string; path: string } | null {
  const brand = BRANDS[key];
  if (!brand) return null;
  return {
    path: brand.path,
    fg: `#${brand.ink ?? brand.hex}`,
    bg: `#${brand.hex}1f`,
    border: `#${brand.hex}40`,
  };
}