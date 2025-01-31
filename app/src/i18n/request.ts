import {getRequestConfig} from 'next-intl/server';
import { cookies } from 'next/headers';
 
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('MY_LOCALE')?.value || "en";
  const locale = cookieLocale;
  //const locale = cookies?.value || 'en';
 
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});