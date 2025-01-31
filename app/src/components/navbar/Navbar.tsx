'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
    const [locale, setLocale] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
       const cookieLocale = document.cookie.split("; ")
       .find((row) => row.startsWith("MY_LOCALE="))
       ?.split("=")[1];
        if (cookieLocale) {
            setLocale(cookieLocale);
        }else{
            const browserLocale = navigator.language;
            setLocale(browserLocale);
            document.cookie = `MY_LOCALE=${browserLocale};`;
            router.refresh();
        }
    }, [router]);

    const handleLanguageChange = (newLocale: string) => {
        setLocale(newLocale);
        document.cookie = `MY_LOCALE=${newLocale};`;
        router.refresh();
    };

  return (
    <div className='py-3 flex items center justify-between border-b'>
      <h1 className='text-lg font-bold'>Leipziger</h1>
      <div className='flex items-center gap-3'>
        <button 
            onClick={() => handleLanguageChange('en')}
            className={`border p-2 rounded-md text-sm ${locale === 'en' ? 'bg-black text-white' : ''}`}>
            EN
        </button>
        <button 
            onClick={() => handleLanguageChange('de')}
            className={`border p-2 rounded-md text-sm ${locale === 'de' ? 'bg-black text-white' : ''}`}>
            DE
        </button>
      </div>
    </div>
  );
};

export default Navbar;
