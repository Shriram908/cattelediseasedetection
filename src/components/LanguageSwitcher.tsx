import { useI18n, Language } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage, languageNames } = useI18n();

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
      <SelectTrigger className="w-auto gap-1 border-none bg-transparent h-8 px-2">
        <Globe className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
