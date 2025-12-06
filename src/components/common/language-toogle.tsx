import { useLingui } from "@lingui/react";
import { useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { serialize } from "cookie-es";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dynamicActivate, locales } from "@/modules/lingui/i18n";

const updateLanguage = createServerFn({ method: "POST" })
  .inputValidator((locale: string) => locale)
  .handler(({ data }) => {
    setResponseHeader(
      "Set-Cookie",
      serialize("locale", data, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      })
    );
  });

const LanguageToggle = () => {
  const { i18n } = useLingui();
  const navigate = useNavigate();

  return (
    <Select
      onValueChange={async (locale) => {
        try {
          // Run both operations in parallel for better performance
          await Promise.all([
            updateLanguage({ data: locale }),
            dynamicActivate(i18n, locale),
          ]);

          // Update html lang attribute for accessibility
          document.documentElement.lang = locale;

          // Optionally refresh the current route to update any translated content
          // This is much gentler than a full page reload
          navigate({ to: window.location.pathname, replace: true });
        } catch (error) {
          console.error(error);
        }
      }}
      value={i18n.locale}
    >
      <SelectTrigger size="sm">
        <SelectValue>{i18n.locale.toUpperCase()}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.keys(locales).map((locale) => (
          <SelectItem key={locale} value={locale}>
            {locale.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageToggle;
